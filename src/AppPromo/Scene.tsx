import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig, useCurrentFrame, interpolate, spring } from "remotion";
import { PhoneModel } from "./PhoneModel";
import { IPadModel } from "./iPadModel";
import { Suspense, useEffect, useMemo } from "react";
import { Environment } from "@react-three/drei";
import { EffectComposer, BrightnessContrast } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

import * as THREE from "three";

interface SceneProps {
  screenshot1: string;
  screenshot2: string;
  screenshot3: string;
  screenshot4: string;
  screenshot5: string;
}

// 模型缩放配置
const PHONE_SCALE = 10;
const IPAD_SCALE = 1;

// Spring 配置：高刚度，高阻尼，模拟 Apple 的精密感
const SPRING_CONFIG = {
  stiffness: 60,
  damping: 12,
  mass: 0.8,
};

// 色调映射设置
function ToneMapping() {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.8;
  }, [gl]);

  return null;
}



// 5 个分镜的目标状态
const SHOT_TARGETS = [
  { pos: [0, 0, 0], rot: [0, 0, 0], scale: 1 },         // 分镜1: 悦见于色
  { pos: [0.5, 0, 1], rot: [0, -Math.PI / 8, 0], scale: 1.1 }, // 分镜2: 万物色彩
  { pos: [-0.5, 0.2, 0], rot: [0.2, 0.4, 0], scale: 0.9 }, // 分镜3: 即刻获取
  { pos: [0, -0.2, 2], rot: [Math.PI / 10, 0, 0], scale: 1.2 }, // 分镜4: iCloud
  { pos: [-1.5, 0, 0], rot: [0, Math.PI / 6, 0], scale: 0.7 }, // 分镜5: 和 iPad 一起
];

// 截图映射
const SCREENSHOT_MAP = [0, 1, 2, 3, 0]; // 分镜1-4用screenshot1-4，分镜5用screenshot1

export const Scene: React.FC<SceneProps> = ({
  screenshot1,
  screenshot2,
  screenshot3,
  screenshot4,
  screenshot5,
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const screenshots = [screenshot1, screenshot2, screenshot3, screenshot4, screenshot5];

  // 计算当前分镜（基于时间）
  const shotDuration = 60; // 每分镜60帧
  const totalShots = 5;
  
  // 使用 spring 产生平滑的分镜过渡
  const shotProgress = frame / shotDuration;
  const currentShotIndex = Math.min(Math.floor(shotProgress), totalShots - 1);
  const nextShotIndex = Math.min(currentShotIndex + 1, totalShots - 1);
  const localProgress = shotProgress - currentShotIndex;

  // Spring 驱动的过渡
  const transitionSpring = spring({
    frame: frame % shotDuration,
    fps,
    config: SPRING_CONFIG,
  });

  // 平滑插值当前和目标状态
  const t = interpolate(transitionSpring, [0, 1], [0, 1]);
  
  const currentTarget = SHOT_TARGETS[currentShotIndex];
  const nextTarget = SHOT_TARGETS[nextShotIndex];

  // 位置插值（带微浮动）
  const drift = Math.sin(frame / 30) * 0.05;
  const position: [number, number, number] = [
    interpolate(t, [0, 1], [currentTarget.pos[0], nextTarget.pos[0]]) + drift * 0.5,
    interpolate(t, [0, 1], [currentTarget.pos[1], nextTarget.pos[1]]) + drift,
    interpolate(t, [0, 1], [currentTarget.pos[2], nextTarget.pos[2]]),
  ];

  // 旋转插值
  const rotation: [number, number, number] = [
    interpolate(t, [0, 1], [currentTarget.rot[0], nextTarget.rot[0]]),
    interpolate(t, [0, 1], [currentTarget.rot[1], nextTarget.rot[1]]),
    interpolate(t, [0, 1], [currentTarget.rot[2], nextTarget.rot[2]]),
  ];

  // 缩放插值（带弹性回弹）
  const scaleSpring = spring({
    frame: frame % shotDuration,
    fps,
    config: { ...SPRING_CONFIG, stiffness: 80 },
  });
  const scaleT = interpolate(scaleSpring, [0, 1], [0, 1]);
  const scale = interpolate(scaleT, [0, 1], [currentTarget.scale, nextTarget.scale]);

  // 截图切换：在动作最剧烈的瞬间（spring 中间值）切换
  const screenshotIndex = SCREENSHOT_MAP[currentShotIndex];
  const currentScreenshot = screenshots[screenshotIndex];

  // iPad 在第 5 分镜：从屏幕左侧水平滑入
  const ipadStartFrame = 240;
  const showIPad = frame >= ipadStartFrame;

  // iPad 路径：从屏幕左侧水平滑入到右侧
  const ipadFrame = Math.max(0, frame - ipadStartFrame);
  const ipadSpring = spring({
    frame: ipadFrame,
    fps,
    config: { ...SPRING_CONFIG, stiffness: 40, damping: 10 },
  });
  const ipadProgress = interpolate(ipadSpring, [0, 1], [0, 1]);
  const ipadX = interpolate(ipadProgress, [0, 1], [-8, 2.5]);
  const ipadY = -40; // 保持原来的 y
  const ipadZ = -250; // 保持原来的深度
  const ipadScale = 1; // 保持原来的 scale

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 5], fov: 20 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
    >
      <ToneMapping />


      {/* 环境光 */}
      <ambientLight intensity={0.2} />

      {/* 主光源 */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} castShadow />

      {/* 补光 - 中性白色 */}
      <pointLight position={[-5, 3, -5]} intensity={0.3} />
      <pointLight position={[5, -3, -5]} intensity={0.2} />

      {/* iPhone 模型 */}
      <Suspense fallback={null}>
        <PhoneModel
          screenshot={currentScreenshot}
          scale={PHONE_SCALE * scale}
          position={position}
          rotation={rotation}
        />
      </Suspense>

      {/* iPad 模型 - 第 5 分镜渐入 */}
      {showIPad && (
        <Suspense fallback={null}>
          <IPadModel
            screenshot={screenshot5}
            scale={IPAD_SCALE}
            position={[ipadX, ipadY, ipadZ]}
            rotation={[0, -Math.PI / 8, 0]}
            hideApplePencil={true}
          />
        </Suspense>
      )}

      {/* 后期处理 - 对比度调整 */}
      <EffectComposer>
        <BrightnessContrast
          brightness={0}
          contrast={0.4}
        />
      </EffectComposer>
    </ThreeCanvas>
  );
};
