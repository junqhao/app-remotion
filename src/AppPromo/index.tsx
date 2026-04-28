import { AbsoluteFill, staticFile } from "remotion";
import { Scene } from "./Scene";

// 截图数组 - 在 keyframes 中用 index 引用
// index 0: screenshot_1 (用于分镜0起始)
// index 1: screenshot_1 (用于分镜1)
// index 2: screenshot_2 (用于分镜2)
// index 3: screenshot_3 (用于分镜3)
// index 4: screenshot_4 (用于分镜4和iPad)
// index 5: screenshot_5
const screenshots = [
  staticFile("screenshot_1.png"),
  staticFile("screenshot_2.png"),
  staticFile("screenshot_3.png"),
  staticFile("screenshot_4.png"),
  staticFile("screenshot_5.png"),
  staticFile("screenshot_6.png"),
];

export const AppPromo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#1ad226ff", // 白色背景，需要透明时改为 "transparent"
      }}
    >
      <Scene screenshots={screenshots} />
    </AbsoluteFill>
  );
};
