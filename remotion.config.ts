// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';

// 透明视频配置
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuva444p10le");
Config.setCodec("prores");
Config.setProResProfile("4444");

Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);

// M1 Mac WebGL 配置
Config.setChromiumOpenGlRenderer("angle");

// 导出优化配置 - 防止闪烁和黑帧
Config.setConcurrency(1); // 降低并发，确保每帧渲染完整

// 帧渲染延迟 - 确保纹理加载完成
Config.setChromiumHeadlessMode(true);

// 设置更高的PNG质量
Config.setJpegQuality(95);

// 确保每一帧都完全渲染
Config.setEveryNthFrame(1);
