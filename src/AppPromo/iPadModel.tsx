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

const ipadModel = staticFile("ipad.glb");

interface iPadModelProps {
  screenshot: string;
  scale: number;
  hideApplePencil?: boolean;
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
  staticFile("screenshot_6.png"),
];

// 立即开始预加载
ALL_SCREENSHOTS.forEach(preloadTexture);

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
  const entranceX = interpolate(entranceProgress, [0, 1], [-position[0] * 2, position[0]]);

  const finalScale = baseScale * entranceScale;

  // 应用贴图到display material，并隐藏 Apple Pencil，支持过渡动画
  const ipadScene = useMemo(() => {
    const clonedScene = scene.clone();
    const t = transitionProgress;
    const isTransitioning = t < 1 && prevScreenshot !== screenshot;

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
          // 防止递归：如果发现已经是克隆出来的辅助 Mesh，跳过它
          if (child.userData.isPrevMesh) return;

          if (isTransitioning && prevTexture) {
            // 寻找或创建"旧图层"
            let prevMesh = child.getObjectByName("prevDisplayMesh") as THREE.Mesh;
            
            if (!prevMesh) {
              prevMesh = child.clone();
              prevMesh.name = "prevDisplayMesh";
              prevMesh.userData.isPrevMesh = true;
              // 微移防止 Z-Fighting
              prevMesh.position.z += 0.001;
              child.add(prevMesh);
            }

            // 配置旧图材质 (淡出)
            const clonedPrevTexture = prevTexture.clone();
            clonedPrevTexture.center = new THREE.Vector2(0.5, 0.5);
            clonedPrevTexture.rotation = 0;
            clonedPrevTexture.repeat.set(-1, 1);
            
            prevMesh.material = new THREE.MeshStandardMaterial({
              map: clonedPrevTexture,
              color: new THREE.Color(0x000000),
              roughness: 1.0,
              metalness: 0,
              emissive: new THREE.Color(0xbebebe),
              emissiveMap: clonedPrevTexture,
              emissiveIntensity: 0.9,
              transparent: true,
              opacity: 1 - t,
              depthWrite: false,
            });

            // 配置新图材质 (淡入)
            const clonedTexture = texture.clone();
            clonedTexture.center = new THREE.Vector2(0.5, 0.5);
            clonedTexture.rotation = 0;
            clonedTexture.repeat.set(-1, 1);
            
            child.material = new THREE.MeshStandardMaterial({
              map: clonedTexture,
              color: new THREE.Color(0x000000),
              roughness: 1.0,
              metalness: 0,
              emissive: new THREE.Color(0xbebebe),
              emissiveMap: clonedTexture,
              emissiveIntensity: 0.9,
              transparent: true,
              opacity: t,
              depthWrite: false,
            });
          } else {
            // 过渡结束后，清理辅助 Mesh
            const oldPrev = child.getObjectByName("prevDisplayMesh");
            if (oldPrev) {
              child.remove(oldPrev);
            }

            // 克隆纹理并水平翻转
            const clonedTexture = texture.clone();
            clonedTexture.center = new THREE.Vector2(0.5, 0.5);
            clonedTexture.rotation = 0;
            clonedTexture.repeat.set(-1, 1); // 水平翻转
            
            const newMaterial = new THREE.MeshStandardMaterial({
              map: clonedTexture,
              color: new THREE.Color(0x000000),
              roughness: 0.2,
              metalness: 0.8,
              emissive: new THREE.Color(0xbbbbbb),
              emissiveMap: clonedTexture,
              emissiveIntensity: 1,
              transparent: false,
            });
            child.material = newMaterial;
          }
        }
      }
    });

    return clonedScene;
  }, [scene, texture, prevTexture, transitionProgress, prevScreenshot, screenshot, hideApplePencil]);

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
