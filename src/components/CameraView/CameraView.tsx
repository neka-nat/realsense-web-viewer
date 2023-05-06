import React from "react";
import { useRgbCamera } from "../../hooks/useRgbCamera";

interface CameraViewProps {
  // 必要なプロパティを定義
}

export const CameraView: React.FC<CameraViewProps> = (props) => {
  const { videoRef } = useRgbCamera();

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
    </div>
  );
};
