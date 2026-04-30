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

// 预加载所有截图 - 在模块级别预加载
const textureCache: Map<string, THREE.Texture> = new Map();
const loadingTextures: Set<string> = new Set();

function preloadTexture(url: string): void {
  if (textureCache.has(url) || loadingTextures.has(url)) return;
  
  loadingTextures.add(url);
  const loader = new THREE.TextureLoader();
  loader.load(url, (texture) => {
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(url, texture);
    loadingTextures.delete(url);
  });
}

function getTexture(url: string): THREE.Texture {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }
  
  // 如果缓存中没有，立即加载并返回临时纹理
  const loader = new THREE.TextureLoader();
  const texture = loader.load(url);
  texture.flipY = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(url, texture);
  return texture;
}

// 预加载所有可能用到的截图
const ALL_SCREENSHOTS = [
  staticFile("screenshot_1.png"),
  staticFile("screenshot_2.png"),
  staticFile("screenshot_3.png"),
  staticFile("screenshot_4.png"),
  staticFile("screenshot_5.png"),
];

// 立即开始预加载
ALL_SCREENSHOTS.forEach(preloadTexture);

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

  // 截图切换检测 - 使用 ref 避免不必要的重渲染
  const [prevScreenshot, setPrevScreenshot] = useState(screenshot);
  const [transitionStartFrame, setTransitionStartFrame] = useState<number | null>(null);

  useEffect(() => {
    if (screenshot !== prevScreenshot) {
      setPrevScreenshot(screenshot);
      setTransitionStartFrame(frame);
    }
  }, [screenshot, prevScreenshot, frame]);

  // 计算过渡进度 - 基于帧数而不是 setTimeout
  const TRANSITION_DURATION = 8; // 8帧完成过渡 (约267ms @ 30fps)
  const transitionProgress = useMemo(() => {
    if (transitionStartFrame === null) return 1;
    const elapsed = frame - transitionStartFrame;
    return Math.min(elapsed / TRANSITION_DURATION, 1);
  }, [frame, transitionStartFrame]);

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

    clonedScene.traverse((child: any) => {
    if (child instanceof THREE.Mesh) {
      const materialName = child.material?.name?.toLowerCase() || "";
      if (materialName.includes("display") || materialName.includes("screen")) {
        
        // --- 1. 防止递归：如果发现已经是克隆出来的辅助 Mesh，跳过它 ---
        if (child.userData.isPrevMesh) return;

        if (isTransitioning && prevTexture) {
          // --- 2. 寻找或创建"旧图层" ---
          let prevMesh = child.getObjectByName("prevDisplayMesh") as THREE.Mesh;
          
          if (!prevMesh) {
            prevMesh = child.clone();
            prevMesh.name = "prevDisplayMesh";
            prevMesh.userData.isPrevMesh = true; // 标记防止递归遍历
            // 关键：微移 0.1 毫米，彻底解决闪烁 (Z-Fighting)
            prevMesh.position.z += 0.001; 
            child.add(prevMesh);
          }

          // --- 3. 配置旧图材质 (淡出) ---
          prevMesh.material = new THREE.MeshStandardMaterial({
            map: prevTexture,
            color: new THREE.Color(0x000000),
            emissive: new THREE.Color(0xBBBBBB),
            emissiveMap: prevTexture,
            emissiveIntensity: 1,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 1 - t, // 随时间从 1 变到 0
            depthWrite: false, // 关键：关闭深度写入，防止遮挡
          });

          // --- 4. 配置新图材质 (淡入) ---
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            color: new THREE.Color(0x000000),
            emissive: new THREE.Color(0xBBBBBB),
            emissiveMap: texture,
            emissiveIntensity: 1,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: t, // 随时间从 0 变到 1
            depthWrite: false, // 关键：关闭深度写入
          });

      } else {
        // --- 5. 过渡结束后，清理辅助 Mesh ---
        const oldPrev = child.getObjectByName("prevDisplayMesh");
        if (oldPrev) {
          child.remove(oldPrev);
        }

        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          color: new THREE.Color(0x000000),
          emissive: new THREE.Color(0xBBBBBB),
          emissiveMap: texture,
          emissiveIntensity: 1,
          roughness: 0.2,
          metalness: 0.8,
          transparent: false,
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
