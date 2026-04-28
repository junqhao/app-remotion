import { AbsoluteFill, staticFile } from "remotion";
import { Scene } from "./Scene";

// 5个截图
const screenshot1 = staticFile("screenshot_1.png");
const screenshot2 = staticFile("screenshot_2.png");
const screenshot3 = staticFile("screenshot_3.png");
const screenshot4 = staticFile("screenshot_4.png");
const screenshot5 = staticFile("screenshot_5.png");

export const AppPromo: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: "#ffffff", // 白色背景，需要透明时改为 "transparent"
      }}
    >
      {/* 3D场景 - 5组分镜 */}
      <Scene
        screenshot1={screenshot1}
        screenshot2={screenshot2}
        screenshot3={screenshot3}
        screenshot4={screenshot4}
        screenshot5={screenshot5}
      />
    </AbsoluteFill>
  );
};
