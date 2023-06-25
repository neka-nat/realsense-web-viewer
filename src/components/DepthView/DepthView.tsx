import React from "react";
import { Canvas } from "@react-three/fiber";
import { useDepthCamera } from "../../hooks/useDepthCamera";
import { useRgbCamera } from "../../hooks/useRgbCamera";
import { PointCloudGLSL } from "./PointCloudGLSL";

interface DepthViewProps {
  // 必要なプロパティを定義
}

export const DepthView: React.FC<DepthViewProps> = (props) => {
  const { videoRef, cameraParameters, videoSize } = useDepthCamera();
  const { videoRef: colorVideoRef, videoSize: colorVideoSize } = useRgbCamera();

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline hidden />
      <video ref={colorVideoRef} autoPlay playsInline hidden />
      <div style={{ width: "50vw", height: "50vh" }}>
        <Canvas flat linear>
          <group rotation-z={1.57} rotation-y={0.0} rotation-x={1.57}>
          {cameraParameters ? (
            <PointCloudGLSL
              depthVideoRef={videoRef}
              colorVideoRef={colorVideoRef}
              depthSize={videoSize || { width: 640, height: 480 }}
              colorSize={colorVideoSize || { width: 640, height: 480 }}
              parameters={cameraParameters}
            />
          ) : null}
          </group>
        </Canvas>
      </div>
    </div>
  );
};
