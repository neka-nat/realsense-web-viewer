import { useEffect, useState, useRef } from "react";
import { CameraParameters } from "../utils/parameters";

export const useDepthData = (
  videoRef: React.MutableRefObject<HTMLVideoElement | null>,
  cameraParameters: CameraParameters | undefined
) => {
  const [depthData, setDepthData] = useState<number[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");

    video.onloadedmetadata = function () {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    };

    video.onplay = function () {
      function step() {
        if (
          !video ||
          !cameraParameters ||
          video.paused ||
          video.ended ||
          !ctx ||
          !canvas
        ) {
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const depthImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const { depthScale, getDepthIntrinsics } = cameraParameters;
        const width = depthImage.width;
        const height = depthImage.height;
        const depthIntrinsics = getDepthIntrinsics(width, height);

        if (!depthIntrinsics) {
          console.error("Failed to get depth intrinsics.");
          return [];
        }
        const [cx, cy] = depthIntrinsics.offset;
        const [fx, fy] = depthIntrinsics.focalLength;

        const vertices: number[][] = [];
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const depthPixel = depthImage.data[y * width + x];
            const Z = depthScale * depthPixel;
            const X = ((x - cx) * Z) / fx;
            const Y = ((y - cy) * Z) / fy;
            vertices.push([X * 0.001, Y * 0.001, Z * 0.001]);
          }
        }
        setDepthData(vertices);
        requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    };
  }, [videoRef, cameraParameters]);

  return { depthData, canvasRef };
};
