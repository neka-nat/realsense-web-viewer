import { useEffect, useRef, useState } from "react";
import { CameraParameters, getCameraParameters } from "../utils/parameters";

export const useDepthCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraParameters, setCameraParameters] = useState<
    CameraParameters | undefined
  >(undefined);
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | undefined>(undefined);

  useEffect(() => {
    async function getCameraStream() {
      if (videoRef.current) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const realsenseCamera = devices.find(
            (device) =>
              device.kind === "videoinput" && device.label.includes("RealSense")
          );

          if (realsenseCamera) {
            const constraints = {
              video: {
                deviceId: { exact: realsenseCamera.deviceId },
                frameRate: { exact: 60 },
              },
            };
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );
            const cameraParameters = await getCameraParameters(stream);
            setCameraParameters(cameraParameters);
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setVideoSize({ width: videoRef.current!.videoWidth, height: videoRef.current!.videoHeight });
            }
          } else {
            console.error("RealSense camera not found");
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }
    }

    getCameraStream();
  }, []);

  return { videoRef, cameraParameters, videoSize };
};
