import "./index.css";
import { Composition } from "remotion";
import { AppPromo } from "./AppPromo";

// 从 Scene.tsx 导入关键帧配置（需要在 Scene.tsx 中导出）
import { KEYFRAMES } from "./AppPromo/Scene";

// 根据最后一个关键帧计算总时长
const LAST_KEYFRAME = KEYFRAMES[KEYFRAMES.length - 1];
const TOTAL_DURATION = LAST_KEYFRAME.frame;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* App宣传视频 - 动态时长根据关键帧 - 2K分辨率 */}
      <Composition
        id="AppPromo"
        component={AppPromo}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={2560}
        height={1440}
      />
    </>
  );
};
