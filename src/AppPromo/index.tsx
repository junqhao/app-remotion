import { AbsoluteFill, staticFile } from "remotion";
import { Scene } from "./Scene";

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
        background: "transparent", // 透明背景
      }}
    >
      <Scene screenshots={screenshots} />
    </AbsoluteFill>
  );
};
