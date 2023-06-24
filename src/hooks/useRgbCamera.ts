import { useEffect, useRef, useState } from "react";

export const useRgbCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoSize, setVideoSize] = useState<
    { width: number; height: number } | undefined
  >(undefined);

  useEffect(() => {
    async function getCameraStream() {
      if (videoRef.current) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const realsenseCamera = devices.filter(
            (device) =>
              device.kind === "videoinput" &&
              device.label.includes("RealSense") &&
              device.label.includes("RGB")
          );
          if (realsenseCamera.length > 1) {
            const sortedDevice = realsenseCamera.sort((a, b) => {
              // Heuristics, as everything else in this method: pick camera with
              // 'RGB' at the end
              return b.label.lastIndexOf("RGB") - a.label.lastIndexOf("RGB");
            });
            const id = sortedDevice[0].deviceId;
            const constraints = {
              video: {
                width: 640,
                height: 480,
                deviceId: { exact: id },
              },
            };
            const stream = await navigator.mediaDevices.getUserMedia(
              constraints
            );
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              setVideoSize({
                width: videoRef.current!.videoWidth,
                height: videoRef.current!.videoHeight,
              });
            };
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      }
    }
    getCameraStream();
  }, []);

  return { videoRef, videoSize };
};
