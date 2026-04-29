import "./index.css";
import { Composition } from "remotion";
import { AppPromo } from "./AppPromo";

// 从 Scene.tsx 导入关键帧配置（需要在 Scene.tsx 中导出）
import { TOTAL_DURATION } from "./AppPromo/Keyframes";

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
