import React, { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  VideoTexture,
  DataTexture,
  RGBAFormat,
} from "three";
import { CameraParameters } from "../../utils/parameters";
import { vertexShader } from "../../shaders/vertexShader";
import { fragmentShader } from "../../shaders/fragmentShader";
import { OrbitControls } from "@react-three/drei";

type Props = {
  depthVideoRef: React.RefObject<HTMLVideoElement>;
  colorVideoRef: React.RefObject<HTMLVideoElement>;
  depthSize: { width: number; height: number };
  colorSize: { width: number; height: number };
  parameters: CameraParameters;
};

function videoToDepthTexture(
  video: HTMLVideoElement,
  width: number,
  height: number
): THREE.DataTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to get 2d context");
  }

  context.drawImage(video, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);

  const depthTexture = new DataTexture(
    new Uint8Array(width * height * 4),
    width,
    height,
    RGBAFormat
  );
  const pixels = depthTexture.image.data;

  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels[i] = imageData.data[i]; // Red channel: high 8 bits
    pixels[i + 1] = imageData.data[i + 1]; // Green channel: low 8 bits
    pixels[i + 2] = 0; // Blue channel: not used
    pixels[i + 3] = 255; // Alpha channel: fully opaque
  }
  depthTexture.needsUpdate = true;
  return depthTexture;
}

export const PointCloudGLSL: React.FC<Props> = ({
  depthVideoRef,
  colorVideoRef,
  depthSize,
  colorSize,
  parameters,
}: Props) => {
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
            value: parameters.getDepthIntrinsics(
              depthSize.width,
              depthSize.height
            )?.focalLength,
          },
          u_depth_offset: {
            value: parameters.getDepthIntrinsics(
              depthSize.width,
              depthSize.height
            )?.offset,
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
          u_depth_texture: { value: null },
          u_color_texture: { value: colorVideoTexture },
        },
        vertexColors: true,
      }),
    [depthSize, colorSize, parameters, colorVideoTexture]
  );

  const geometry = useMemo(() => {
    const positions = new Float32Array(depthSize.width * depthSize.height * 3);
    for (let i = 0; i < depthSize.width; i++) {
      for (let j = 0; j < depthSize.height; j++) {
        const k = j * depthSize.width + i;
        positions[k * 3] = i;
        positions[k * 3 + 1] = j;
        positions[k * 3 + 2] = 0;
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geometry;
  }, [depthSize]);

  useFrame(() => {
    if (depthVideoRef.current && shaderMaterial) {
      const depthTexture = videoToDepthTexture(
        depthVideoRef.current,
        depthSize.width,
        depthSize.height
      );
      shaderMaterial.uniforms.u_depth_texture.value = depthTexture;
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
