import { spring,interpolate } from "remotion";

export interface KeyframeBase {
  duration: number; // 动到这个状态耗时多少帧
  hold: number;     // 到达后停留多少帧
  pos: number[];
  rot: number[];
  scale: number;
  screenshot: number;
}

interface KeyframeInternal extends KeyframeBase {
  absStartFrame: number;
  absEndFrame: number;
  absHoldFrame: number;
}

// ============================================
// 2. 关键帧配置 (你的主要控制区)
// ============================================

export const KEYFRAMES: KeyframeBase[] = [
  {
    duration: 0,
    hold: 0,
    pos: [0, -1, 0],
    rot: [-2, 0, 0],
    scale: 4,
    screenshot: 0,
  },
  {
    duration: 30,
    hold: 45,
    pos: [0, -0.02, 0],
    rot: [0, 0, 0],
    scale: 1,
    screenshot: 0,
  },
  {
    duration: 20,
    hold: 45,
    pos: [0.6, -0.02, 1],
    rot: [0, -Math.PI / 8, 0],
    scale: 0.8,
    screenshot: 1,
  },
  {
    duration: 20,
    hold: 45,
    pos: [-0.6, -0.02, 1],
    rot: [0.1, Math.PI / 8, 0],
    scale: 0.8,
    screenshot: 2,
  },
  {
    duration: 20,
    hold: 45,
    pos: [-0.5, -0.02, 2],
    rot: [0, 0, 0],
    scale: 0.6,
    screenshot: 3,
  },
  {
    duration: 20,
    hold: 45,
    pos: [1.2, -0.3, 0],
    rot: [0, -Math.PI / 10, 0],
    scale: 0.6,
    screenshot: 4,
  },
];

const IPAD_KEYFRAMES: KeyframeBase[] = [
  {
    duration: 0, // 这里的前置时长可以理解为“等待多久开始出现”
    hold: 270,
    pos: [150, -38, -250],
    rot: [0, 0, 0],
    scale: 1,
    screenshot: 5,
  },   
  {
    duration: 30,
    hold: 60,
    pos: [30, -38, -250],
    rot: [0, Math.PI / 12, 0],
    scale: 1,
    screenshot: 5,
  },
];

function processKeyframes(keyframes: KeyframeBase[]): KeyframeInternal[] {
  const timeline: KeyframeInternal[] = [];
  let currentTime = 0;

  keyframes.forEach((kf) => {
    const absStartFrame = currentTime;
    const absEndFrame = absStartFrame + kf.duration;
    const absHoldFrame = absEndFrame + kf.hold;

    timeline.push({ ...kf, absStartFrame, absEndFrame, absHoldFrame });
    currentTime = absHoldFrame;
  });

  return timeline;
}

// --- 获取单个时间轴总长 ---
export function getTimelineDuration(timeline: KeyframeInternal[]): number {
  if (timeline.length === 0) return 0;
  return timeline[timeline.length - 1].absHoldFrame;
}

export const PROCESSED_PHONE = processKeyframes(KEYFRAMES);
export const PROCESSED_IPAD = processKeyframes(IPAD_KEYFRAMES);

export const TOTAL_DURATION = Math.max(
  getTimelineDuration(PROCESSED_PHONE),
  getTimelineDuration(PROCESSED_IPAD)
);

const SPRING_CONFIG = { stiffness: 120, damping: 20, mass: 0.6 };

export function getInterpolatedValue(frame: number, timeline: KeyframeInternal[]) {
  // 1. 寻找当前帧属于哪一个动作区间（通过起始帧判断）
  let currentIndex = 0;
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (frame >= timeline[i].absStartFrame) {
      currentIndex = i;
      break;
    }
  }

  const current = timeline[currentIndex];
  const prev = timeline[currentIndex - 1] || current; // 如果是第一个点，prev 就是自己

  // 2. 计算相对于该动作开始的帧数
  const relativeFrame = frame - current.absStartFrame;

  // 3. 核心优化：去掉 durationInFrames
  // 这样弹簧会根据 stiffness/damping 产生自然的 Overshoot（超调）
  const t = spring({
    frame: relativeFrame,
    fps: 30,
    config: SPRING_CONFIG,
    // durationInFrames: current.duration, // 必须删掉，否则不 Q 弹
  });

  // 4. 插值返回
  // 当 t > 1 时（弹簧弹过头），interpolate 会根据线性关系计算出超过目标的坐标
  return {
    pos: prev.pos.map((v, i) => 
      interpolate(t, [0, 1], [v, current.pos[i]])
    ) as [number, number, number],
    rot: prev.rot.map((v, i) => 
      interpolate(t, [0, 1], [v, current.rot[i]])
    ) as [number, number, number],
    scale: interpolate(t, [0, 1], [prev.scale, current.scale]),
    screenshot: current.screenshot,
  };
}
