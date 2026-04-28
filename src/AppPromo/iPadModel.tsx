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

const ipadModel = staticFile("ipad.glb");

interface iPadModelProps {
  screenshot: string;
  scale: number;
  hideApplePencil?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  animationOffset?: number;
}

export const IPadModel: React.FC<iPadModelProps> = ({
  screenshot,
  scale: baseScale,
  hideApplePencil = true,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  animationOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ipadRef = useRef<THREE.Group>(null);

  const { scene } = useGLTF(ipadModel);
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
  const entranceX = interpolate(entranceProgress, [0, 1], [-position[0] * 2, position[0]]);

  const finalScale = baseScale * entranceScale;

  // 应用贴图到display material，并隐藏 Apple Pencil
  const ipadScene = useMemo(() => {
    const clonedScene = scene.clone();

    clonedScene.traverse((child: THREE.Object3D) => {
      // 隐藏 Apple Pencil
      if (hideApplePencil) {
        const name = child.name?.toLowerCase() || "";
        if (
          name.includes("pencil") ||
          name.includes("applepencil") ||
          name.includes("pen")
        ) {
          child.visible = false;
          return;
        }
      }

      // 应用贴图到屏幕，并调整 bezel 材质
      if (child instanceof THREE.Mesh) {
        const materialName = child.material?.name?.toLowerCase() || "";
        const meshName = child.name?.toLowerCase() || "";
        
        // 屏幕材质
        if (
          materialName.includes("display") ||
          materialName.includes("screen") ||
          materialName.includes("glass")
        ) {
          // 克隆纹理并水平翻转
          const clonedTexture = texture.clone();
          clonedTexture.center = new THREE.Vector2(0.5, 0.5);
          clonedTexture.rotation = 0;
          clonedTexture.repeat.set(-1, 1); // 水平翻转
          
          const newMaterial = new THREE.MeshStandardMaterial({
            map: clonedTexture,
            color: new THREE.Color(0x000000),
            roughness: 1.0,
            metalness: 0,
            emissive: new THREE.Color(0xbebebe),
            emissiveMap: clonedTexture,
            emissiveIntensity: 0.9,
          });
          child.material = newMaterial;
        }
        // Bezel 边框材质 - 降低反光
        else if (
          materialName.includes("bezel") ||
          materialName.includes("frame") ||
          meshName.includes("bezel") ||
          meshName.includes("frame")
        ) {
          const bezelMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0x1a1a1a),
            roughness: 1,
            metalness: 0,
            envMapIntensity: 0.2,
          });
          child.material = bezelMaterial;
        }
      }
    });

    return clonedScene;
  }, [scene, texture, hideApplePencil]);

  return (
    <group
      ref={ipadRef}
      position={[entranceX, position[1] + floatOffset, position[2]]}
      rotation={rotation}
      scale={[finalScale, finalScale, finalScale]}
    >
      <primitive object={ipadScene} />
    </group>
  );
};
