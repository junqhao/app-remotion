import "./index.css";
import { Composition } from "remotion";
import { AppPromo } from "./AppPromo";

// Each <Composition> is an entry in the sidebar!

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* App宣传视频 - 10秒时长，5组分镜展示 */}
      <Composition
        id="AppPromo"
        component={AppPromo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
