import { ThreeCanvas } from "@remotion/three";
import { useVideoConfig, useCurrentFrame } from "remotion";
import { PhoneModel } from "./PhoneModel";
import { IPadModel } from "./iPadModel";
import { Suspense, useEffect } from "react";
import { EffectComposer, BrightnessContrast } from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { PROCESSED_PHONE, PROCESSED_IPAD, getInterpolatedValue } from "./Keyframes";

interface SceneProps {
  screenshots: string[];
}

// --- 色彩映射与环境初始化 ---
function ToneMapping() {
  const { gl, scene } = useThree();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.8;
    // 确保背景透明
    scene.background = null;
    gl.setClearColor(0x000000, 0);
  }, [gl, scene]);
  return null;
}

// --- 主场景组件 ---
export const Scene: React.FC<SceneProps> = ({ screenshots }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const phone = getInterpolatedValue(frame, PROCESSED_PHONE);
  const ipad = getInterpolatedValue(frame, PROCESSED_IPAD);

  // --- 关键防御逻辑 ---
  // 1. 只有当时间超过了 iPad 设定的 hold 时间（即开始动的那一刻），才渲染
  // 假设第一个关键帧的 hold 是 240，那么它的 absEndFrame - duration 就是 240
  const isTimeToShowIpad = frame >= PROCESSED_IPAD[1].absStartFrame;

  // 2. 即使在这个时间点，如果 Suspense 还在加载，我们也给它一个绝对安全的坐标
  const safeIpadPos = isTimeToShowIpad ? ipad.pos : [9999, 9999, 9999];
  const safeIpadScale = isTimeToShowIpad ? ipad.scale : 0;

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ position: [0, 0, 5], fov: 20 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <ToneMapping />
      <ambientLight intensity={10} />
      <directionalLight position={[-5, 10, 5]} intensity={5} />
      <pointLight position={[5, 5, 2]} intensity={5} />

      <Suspense fallback={null}>
        <PhoneModel
          screenshot={screenshots[phone.screenshot]}
          scale={10 * phone.scale}
          position={phone.pos as [number, number, number]}
          rotation={phone.rot as [number, number, number]}
        />
      </Suspense>

      {/* 只有时间到了才渲染组件，且位置双重锁定 */}
      {isTimeToShowIpad && (
        <Suspense fallback={null}>
          <IPadModel
            screenshot={screenshots[ipad.screenshot]}
            scale={1 * safeIpadScale}
            position={safeIpadPos as [number, number, number]}
            rotation={ipad.rot as [number, number, number]}
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