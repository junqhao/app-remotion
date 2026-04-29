import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig, useCurrentFrame, interpolate, spring } from "remotion";
import { PhoneModel } from "./PhoneModel";
import { IPadModel } from "./iPadModel";
import { Suspense, useEffect } from "react";
import { Environment } from "@react-three/drei";
import { EffectComposer, BrightnessContrast } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

import * as THREE from "three";

interface SceneProps {
  screenshots: string[]; // 截图数组，在 keyframes 中用 index 引用
}

// ============================================
// 1. 基础配置
// ============================================

const PHONE_SCALE = 10;
const IPAD_SCALE = 1;

// Spring 配置
const SPRING_CONFIG = {
  stiffness: 70,
  damping: 15,
  mass: 0.6,
};

// ============================================
// 2. 关键帧配置 - 在这里设置每个时间点的状态
// ============================================
// 每个关键帧包含：
// - frame: 时间点（帧数）
// - pos: [x, y, z] 位置
// - rot: [x, y, z] 旋转（弧度）
// - scale: 缩放
// - screenshot: 使用哪张截图 (0-5)

export const KEYFRAMES = [
  // 第0帧：起始位置 - 从屏幕下方滑入
  {
    frame: 0,
    pos: [0, -1, 0],
    rot: [-3, 0, 0],
    scale: 5,
    screenshot: 0,
  },
  // 第60帧：到达正中
  {
    frame: 60,
    pos: [0, -0.02, 0],
    rot: [0, 0, 0],
    scale: 1,
    screenshot: 0,
  },
  // 第120帧：侧转展示
  {
    frame: 120,
    pos: [0.6, -0.02, 1],
    rot: [0, -Math.PI / 8, 0],
    scale: 0.8,
    screenshot: 1,
  },
  // 第150帧：倾斜展示
  {
    frame: 180,
    pos: [-0.6, -0.02, 1],
    rot: [0.1, Math.PI / 8, 0],
    scale: 0.8,
    screenshot: 2,
  },
  // 第240帧：俯视展示
  {
    frame: 240,
    pos: [-0.5, -0.02, 2],
    rot: [0, 0, 0],
    scale: 0.6,
    screenshot: 3,
  },
  // 第300帧：缩小让位给iPad
  {
    frame: 300,
    pos: [1.2, -0.3, 0],
    rot: [0, -Math.PI / 10, 0],
    scale: 0.6,
    screenshot: 4,
  },
];

 // ============================================
// 3. iPad 关键帧配置
// ============================================

const IPAD_KEYFRAMES = [
  // 第240帧：从屏幕左侧外开始
  {
    frame: 240,
    pos: [100, -38, -250],
    rot: [0, 0, 0],
    scale: 1,
    screenshot: 5, // 使用 screenshots[5]
  },  
  // 第300帧：保持
  {
    frame: 300,
    pos: [30, -38, -250],
    rot: [0, Math.PI / 12, 0],
    scale: 1,
    screenshot: 5,
  },
];

// ============================================
// 4. 动画细节配置
// ============================================

const FLOAT_SPEED = 30;
const FLOAT_AMPLITUDE = 0;

// 色调映射
function ToneMapping() {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.8;
    // 设置透明背景
    scene.background = null;
    gl.setClearColor(0x000000, 0);
  }, [gl, scene]);
  return null;
}

// ============================================
// 关键帧插值函数 - 支持 iPhone 和 iPad 关键帧
// ============================================
interface KeyframeBase {
  frame: number;
  pos: number[];
  rot: number[];
  scale: number;
}

interface KeyframeWithScreenshot extends KeyframeBase {
  screenshot: number;
}

type Keyframe = KeyframeBase | KeyframeWithScreenshot;

function getInterpolatedValue(frame: number, keyframes: Keyframe[]) {
  // 找到当前帧应该使用哪个关键帧的状态
  let currentIndex = 0;
  for (let i = keyframes.length - 1; i >= 0; i--) {
    if (frame >= keyframes[i].frame) {
      currentIndex = i;
      break;
    }
  }

  const current = keyframes[currentIndex];
  const next = keyframes[Math.min(currentIndex + 1, keyframes.length - 1)];

  // 如果已经在最后一个关键帧，直接返回
  if (currentIndex === keyframes.length - 1) {
    const result: any = {
      pos: current.pos as [number, number, number],
      rot: current.rot as [number, number, number],
      scale: current.scale,
    };
    if ('screenshot' in current) {
      result.screenshot = current.screenshot;
    }
    return result;
  }

  // 计算在当前区间内的进度 (0-1)
  const duration = next.frame - current.frame;
  const progress = duration > 0 ? (frame - current.frame) / duration : 0;

  // 使用 spring 动画
  const springValue = spring({
    frame: progress * duration,
    fps: 30,
    config: SPRING_CONFIG,
  });
  const t = interpolate(springValue, [0, 1], [0, 1]);

  const result: any = {
    pos: [
      interpolate(t, [0, 1], [current.pos[0], next.pos[0]]),
      interpolate(t, [0, 1], [current.pos[1], next.pos[1]]),
      interpolate(t, [0, 1], [current.pos[2], next.pos[2]]),
    ] as [number, number, number],
    rot: [
      interpolate(t, [0, 1], [current.rot[0], next.rot[0]]),
      interpolate(t, [0, 1], [current.rot[1], next.rot[1]]),
      interpolate(t, [0, 1], [current.rot[2], next.rot[2]]),
    ] as [number, number, number],
    scale: interpolate(t, [0, 1], [current.scale, next.scale]),
  };

  // 处理 screenshot - 动画一开始就切换，不滞后
  if ('screenshot' in current && 'screenshot' in next) {
    // 动画开始时立即切换到下一个截图，和位置/旋转同步
    result.screenshot = (next as KeyframeWithScreenshot).screenshot;
  }

  return result;
}

// ============================================
// 主组件
// ============================================

export const Scene: React.FC<SceneProps> = ({ screenshots }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  // 获取 iPhone 当前帧的插值状态
  const { pos, rot, scale, screenshot } = getInterpolatedValue(frame, KEYFRAMES);

  // 添加微浮动
  const floatOffset = Math.sin(frame / FLOAT_SPEED) * FLOAT_AMPLITUDE;
  const position: [number, number, number] = [
    pos[0] + floatOffset * 0.5,
    pos[1] + floatOffset,
    pos[2],
  ];

  // iPad 动画 - 使用关键帧插值
  const showIPad = frame >= IPAD_KEYFRAMES[0].frame;
  const ipadState = getInterpolatedValue(frame, IPAD_KEYFRAMES);
  const ipadPosition: [number, number, number] = [
    ipadState.pos[0],
    ipadState.pos[1],
    ipadState.pos[2],
  ];

  return (
    <ThreeCanvas
      width={width}
      height={height}
      dpr={[1, 3]}
      camera={{ position: [0, 0, 5], fov: 20 }}
      gl={{
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      frameloop="demand" // 确保每帧完整渲染，防止导出时闪黑
    >
      <ToneMapping />

      {/* 1. 环境光：提供基础亮度，防止背光面死黑 */}
    <ambientLight intensity={10} />

      {/* 2. 主光源 (关键)：放在左上方 (-X, +Y) */}
      <directionalLight 
        position={[-5, 10, 5]} 
        intensity={5} 
        castShadow // 如果需要阴影
      />

      {/* 3. 补光灯：放在稍微偏右的位置，亮度调低，增加立体感 */}
      <pointLight 
        position={[5, 5, 2]} 
        intensity={5} 
        decay={2} // 物理衰减
      />

      <Suspense fallback={null}>
        <PhoneModel
          screenshot={screenshots[screenshot]}
          scale={PHONE_SCALE * scale}
          position={position}
          rotation={rot as [number, number, number]}
        />
      </Suspense>

      {showIPad && (
        <Suspense fallback={null}>
          <IPadModel
            screenshot={screenshots[ipadState.screenshot]}
            scale={IPAD_SCALE * ipadState.scale}
            position={ipadPosition}
            rotation={ipadState.rot as [number, number, number]}
            hideApplePencil={true}
          />
        </Suspense>
      )}

      <EffectComposer>
        <BrightnessContrast brightness={0.1} contrast={0.2} />
      </EffectComposer>
    </ThreeCanvas>
  );
};
