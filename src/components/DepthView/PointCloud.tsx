import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float32BufferAttribute } from "three";
import { OrbitControls } from "@react-three/drei";

export const PointCloud: React.FC<{ data: number[] }> = ({ data }) => {
  const ref = useRef<THREE.Points>(null);
  useFrame(() => {
    if (ref.current) {
      const positionAttribute = new Float32BufferAttribute(data, 3);
      ref.current.geometry.setAttribute("position", positionAttribute);
      ref.current.geometry.computeBoundingSphere();
    }
  });

  return (
    <>
      <OrbitControls />
      <points ref={ref} />
    </>
  );
};
