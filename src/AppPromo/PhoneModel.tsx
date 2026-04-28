import { useRef, useMemo } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
} from "remotion";
import * as THREE from "three";

const iphoneModel = staticFile("iphone.glb");

interface PhoneModelProps {
  screenshot: string;
  scale: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  animationOffset?: number;
}

export const PhoneModel: React.FC<PhoneModelProps> = ({
  screenshot,
  scale: baseScale,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  animationOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phoneRef = useRef<THREE.Group>(null);

  const { scene } = useGLTF(iphoneModel);
  const texture = useTexture(screenshot);

  // 修复贴图方向
  texture.flipY = false;

  // 悬浮动画
  const floatY = spring({
    frame: frame + animationOffset,
    fps,
    config: {
      damping: 20,
      stiffness: 50,
      mass: 1,
    },
  });

  const floatOffset = interpolate(floatY, [0, 1], [-0.05, 0.05]);

  // 初始进入动画
  const entranceProgress = spring({
    frame,
    fps,
    config: {
      damping: 15,
      stiffness: 100,
    },
  });

  const entranceScale = interpolate(entranceProgress, [0, 1], [0.5, 1]);
  const entranceY = interpolate(entranceProgress, [0, 1], [position[1] - 3, position[1]]);

  const finalScale = baseScale * entranceScale;

  // 应用贴图到display material
  const phoneScene = useMemo(() => {
    const clonedScene = scene.clone();

    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const materialName = child.material?.name?.toLowerCase() || "";
        if (
          materialName.includes("display") ||
          materialName.includes("screen") ||
          materialName.includes("glass")
        ) {
          const newMaterial = new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(0x000000),
            roughness: 0.1,
            metalness: 0.2,
            emissive: new THREE.Color(0xbebebe),
            emissiveMap: texture,
            emissiveIntensity: 1.0,
          });
          child.material = newMaterial;
        }
      }
    });

    return clonedScene;
  }, [scene, texture]);

  return (
    <group
      ref={phoneRef}
      position={[position[0], entranceY + floatOffset, position[2]]}
      rotation={rotation}
      scale={[finalScale, finalScale, finalScale]}
    >
      <primitive object={phoneScene} />
    </group>
  );
};
