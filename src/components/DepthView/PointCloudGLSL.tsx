import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  VideoTexture,
} from "three";
import { CameraParameters } from "../../utils/parameters";
import { vertexShader } from "../../shaders/vertexShader";
import { fragmentShader } from "../../shaders/fragmentShader";
import { OrbitControls } from "@react-three/drei";

type Props = {
  depthVideoRef: React.RefObject<HTMLVideoElement>;
  colorVideoRef: React.RefObject<HTMLVideoElement>;
  depthSize: { width: number, height: number };
  colorSize: { width: number, height: number };
  parameters: CameraParameters;
};

export const PointCloudGLSL: React.FC<Props> = ({
  depthVideoRef,
  colorVideoRef,
  depthSize,
  colorSize,
  parameters,
}: Props) => {
  const depthVideoTexture = useMemo(() => {
    if (depthVideoRef.current) {
      return new VideoTexture(depthVideoRef.current);
    }
  }, [depthVideoRef]);
  const colorVideoTexture = useMemo(() => {
    if (colorVideoRef.current) {
      return new VideoTexture(colorVideoRef.current);
    }
  }, [colorVideoRef]);

  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_depth_scale: { value: parameters.depthScale },
          u_depth_focal_length: {
            value: parameters.getDepthIntrinsics(depthSize.width, depthSize.height)?.focalLength,
          },
          u_depth_offset: {
            value: parameters.getDepthIntrinsics(depthSize.width, depthSize.height)?.offset,
          },
          u_depth_distortion_model: { value: 0 },
          u_depth_distortion_coeffs: {
            value: parameters.depthDistortioncoeffs,
          },
          u_color_focal_length: { value: parameters.colorFocalLength },
          u_color_offset: { value: parameters.colorOffset },
          u_color_distortion_model: { value: parameters.colorDistortionModel },
          u_color_distortion_coeffs: {
            value: parameters.colorDistortioncoeffs,
          },
          u_depth_to_color: { value: parameters.depthToColor },
          u_depth_texture_size: { value: [depthSize.width, depthSize.height] },
          u_color_texture_size: { value: [colorSize.width, colorSize.height] },
          u_depth_texture: { value: depthVideoTexture },
          u_color_texture: { value: colorVideoTexture },
        },
        vertexColors: true,
      }),
    [depthSize, colorSize, parameters, depthVideoTexture, colorVideoTexture]
  );

  const geometry = useMemo(() => {
    const totalPixels = depthSize.width * depthSize.height;
    const positions = new Float32Array(totalPixels * 3);
    for (let k = 0; k < totalPixels; k++) {
      const i = k % depthSize.width;
      const j = Math.floor(k / depthSize.width);
      positions[k * 3] = i;
      positions[k * 3 + 1] = j;
      positions[k * 3 + 2] = 0;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [depthSize]);

  useFrame(() => {
    if (depthVideoTexture) {
      depthVideoTexture.needsUpdate = true;
    }
    if (colorVideoTexture) {
      colorVideoTexture.needsUpdate = true;
    }
  });

  return (
    <>
      <OrbitControls />
      <points material={shaderMaterial} geometry={geometry} />
    </>
  );
};
