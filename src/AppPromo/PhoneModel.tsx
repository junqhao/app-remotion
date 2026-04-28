import { useRef, useMemo, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
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

// 预加载所有截图
const textureCache: Map<string, THREE.Texture> = new Map();

function getTexture(url: string): THREE.Texture {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }
  
  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  texture.flipY = false;
  textureCache.set(url, texture);
  return texture;
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
  
  // 使用缓存的 texture
  const texture = getTexture(screenshot);

  // 截图切换淡入淡出动画
  const [prevScreenshot, setPrevScreenshot] = useState(screenshot);
  const [transitionProgress, setTransitionProgress] = useState(1);

  useEffect(() => {
    if (screenshot !== prevScreenshot) {
      setPrevScreenshot(screenshot);
      setTransitionProgress(0);
    }
  }, [screenshot, prevScreenshot]);

  useEffect(() => {
    if (transitionProgress < 1) {
      const timer = setTimeout(() => {
        setTransitionProgress((p) => Math.min(p + 0.12, 1));
      }, 16);
      return () => clearTimeout(timer);
    }
  }, [transitionProgress]);

  const prevTexture = getTexture(prevScreenshot);

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

  // 应用贴图到display material - 支持交叉淡入淡出
  const phoneScene = useMemo(() => {
    const clonedScene = scene.clone();
    const t = transitionProgress;
    const isTransitioning = t < 1 && prevScreenshot !== screenshot;

    clonedScene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        const materialName = child.material?.name?.toLowerCase() || "";
        if (
          materialName.includes("display") ||
          materialName.includes("screen") ||
          materialName.includes("glass")
        ) {
          if (isTransitioning) {
            // 过渡期间：创建两个 mesh 叠加
            // 旧图 mesh（淡出）
            const prevMesh = child.clone();
            prevMesh.material = new THREE.MeshStandardMaterial({
              map: prevTexture,
              color: new THREE.Color(0x000000),
              roughness: 1.0,
              metalness: 0,
              emissive: new THREE.Color(0xbebebe),
              emissiveMap: prevTexture,
              emissiveIntensity: 0.9,
              transparent: true,
              opacity: 1 - t,
            });
            prevMesh.renderOrder = child.renderOrder - 1;
            
            // 新图 mesh（淡入）
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              color: new THREE.Color(0x000000),
              roughness: 1.0,
              metalness: 0,
              emissive: new THREE.Color(0xbebebe),
              emissiveMap: texture,
              emissiveIntensity: 0.9,
              transparent: true,
              opacity: t,
            });
            
            child.add(prevMesh);
          } else {
            // 非过渡期间：只显示当前图
            child.material = new THREE.MeshStandardMaterial({
              map: texture,
              color: new THREE.Color(0x000000),
              roughness: 1.0,
              metalness: 0,
              emissive: new THREE.Color(0xbebebe),
              emissiveMap: texture,
              emissiveIntensity: 0.9,
            });
          }
        }
      }
    });

    return clonedScene;
  }, [scene, texture, prevTexture, transitionProgress, prevScreenshot, screenshot]);

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
