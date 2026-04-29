# App Promo Video - Remotion 3D Product Showcase Video / Remotion 3D 产品展示视频

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## English

A Remotion + React Three Fiber based App promotional video generation tool, supporting iPhone and iPad 3D model display with alpha channel export.

### Features

- **3D Model Display**: Support for iPhone and iPad 3D models with screenshot textures
- **Smooth Animation**: Spring animation system based on keyframes, supporting position, rotation, and scale animations
- **Image Transition**: Fade in/out effects when switching screenshots to prevent flickering
- **Transparent Background**: Support for exporting transparent videos with alpha channel
- **2K Resolution**: Default 2560x1440 resolution for high-definition output
- **Post-processing**: Brightness and contrast adjustment support

### Project Structure

```
src/
├── AppPromo/
│   ├── index.tsx          # Main entry component, transparent background setup
│   ├── Scene.tsx          # 3D scene configuration, keyframe animations
│   ├── PhoneModel.tsx     # iPhone 3D model component
│   └── iPadModel.tsx      # iPad 3D model component
├── Root.tsx               # Remotion Composition config (resolution, fps, etc.)
└── index.css              # Global styles

public/
├── iphone.glb             # iPhone 3D model file
├── ipad.glb               # iPad 3D model file
└── screenshot_*.png       # Screenshot resources

remotion.config.ts         # Remotion global config (encoding, alpha channel, etc.)
```

### Installation & Running

**Install Dependencies**
```bash
pnpm install
```

**Start Preview (Remotion Studio)**
```bash
pnpm run dev
# or
npx remotion studio
```

**Export Video**

Standard export (transparent background ProRes 4444):
```bash
npx remotion render AppPromo out.mov
```

With concurrency control (prevent flickering):
```bash
npx remotion render AppPromo out.mov --concurrency=1
```

Export as WebM (VP9 transparent):
```bash
npx remotion render AppPromo out.webm --codec=vp9 --pixel-format=yuva420p
```

Export single frame for testing:
```bash
npx remotion still AppPromo frame.png --frame=60
```

### Configuration

**Resolution Settings** - Edit `src/Root.tsx`:
```tsx
<Composition
  id="AppPromo"
  component={AppPromo}
  durationInFrames={300}  // Total duration (frames)
  fps={30}                 // Frame rate
  width={2560}             // Width (2K)
  height={1440}            // Height (2K)
/>
```

**Keyframe Animation** - Edit `src/AppPromo/Scene.tsx`:
```tsx
export const KEYFRAMES = [
  {
    frame: 0,                    // Time point (frame)
    pos: [0, -1, 0],            // Position [x, y, z]
    rot: [-3, 0, 0],            // Rotation [x, y, z] (radians)
    scale: 5,                    // Scale
    screenshot: 0,               // Index of screenshots array
  },
  // ... more keyframes
];
```

**Transparent Channel** - Edit `remotion.config.ts`:
```ts
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuva444p10le");  // Pixel format with alpha support
Config.setCodec("prores");
Config.setProResProfile("4444");         // ProRes 4444 supports transparency
```

**3D Scene** - Edit `src/AppPromo/Scene.tsx`:
```tsx
<ThreeCanvas
  width={width}
  height={height}
  dpr={[1, 3]}                    // Device pixel ratio (quality)
  camera={{ position: [0, 0, 5], fov: 20 }}
  gl={{
    antialias: true,
    alpha: true,                  // Enable transparency
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  }}
>
```

**Background** - Edit `src/AppPromo/index.tsx`:
```tsx
<AbsoluteFill
  style={{
    background: "transparent",    // Transparent background
    // background: "#ffffff",     // White background
  }}
>
```

**Post-processing** - Edit `src/AppPromo/Scene.tsx`:
```tsx
<EffectComposer>
  <BrightnessContrast brightness={0.1} contrast={0.2} />
</EffectComposer>
```

**Material Reflection** - Edit `src/AppPromo/PhoneModel.tsx` or `iPadModel.tsx`:
```tsx
child.material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.2,      // Roughness (0-1, lower = smoother)
  metalness: 0.8,      // Metalness (0-1, higher = more reflective)
  emissive: new THREE.Color(0xBBBBBB),
  emissiveIntensity: 1,
});
```

### Resources

Place the following files in `public/` directory:
- `iphone.glb` - iPhone 3D model (GLB format)
- `ipad.glb` - iPad 3D model (GLB format)
- `screenshot_1.png` ~ `screenshot_6.png` - Screenshots (recommended to match model screen ratio)

### FAQ

**Flickering when exporting image transitions**
- Frame-driven transition animation used instead of setTimeout
- All textures preloaded at module level
- Add `--concurrency=1` parameter when exporting

**Transparent background not working**
- Ensure `setPixelFormat("yuva444p10le")` in `remotion.config.ts`
- Ensure `alpha: true` in `ThreeCanvas`
- Ensure scene `background` is set to `null`

**Scene too dark/bright**
- Adjust light source `intensity` in `Scene.tsx`
- Adjust `brightness` and `contrast` values in `BrightnessContrast`
- Adjust material `emissiveIntensity`

---

<a name="chinese"></a>
## 中文

基于 Remotion + React Three Fiber 的 App 产品宣传视频生成工具，支持 iPhone 和 iPad 3D 模型展示，带透明通道导出。

### 功能特性

- **3D 模型展示**：支持 iPhone 和 iPad 3D 模型，带屏幕截图贴图
- **流畅动画**：基于关键帧的弹簧动画系统，支持位置、旋转、缩放动画
- **图片切换过渡**：屏幕截图切换时带淡入淡出效果，防止闪黑
- **透明背景**：支持导出带 Alpha 通道的透明视频
- **2K 分辨率**：默认 2560x1440 分辨率，支持高清输出
- **后期效果**：支持亮度、对比度调整

### 项目结构

```
src/
├── AppPromo/
│   ├── index.tsx          # 主入口组件，透明背景设置
│   ├── Scene.tsx          # 3D 场景配置，关键帧动画
│   ├── PhoneModel.tsx     # iPhone 3D 模型组件
│   └── iPadModel.tsx      # iPad 3D 模型组件
├── Root.tsx               # Remotion Composition 配置（分辨率、帧率等）
└── index.css              # 全局样式

public/
├── iphone.glb             # iPhone 3D 模型文件
├── ipad.glb               # iPad 3D 模型文件
└── screenshot_*.png       # 屏幕截图资源

remotion.config.ts         # Remotion 全局配置（编码、透明通道等）
```

### 安装运行

**安装依赖**
```bash
pnpm install
```

**启动预览（Remotion Studio）**
```bash
pnpm run dev
# 或
npx remotion studio
```

**导出视频**

标准导出（透明背景 ProRes 4444）：
```bash
npx remotion render AppPromo out.mov
```

带并发控制的导出（防止闪烁）：
```bash
npx remotion render AppPromo out.mov --concurrency=1
```

导出为 WebM（VP9 透明）：
```bash
npx remotion render AppPromo out.webm --codec=vp9 --pixel-format=yuva420p
```

导出单帧测试：
```bash
npx remotion still AppPromo frame.png --frame=60
```

### 基础配置

**分辨率设置** - 编辑 `src/Root.tsx`：
```tsx
<Composition
  id="AppPromo"
  component={AppPromo}
  durationInFrames={300}  // 总时长（帧）
  fps={30}                 // 帧率
  width={2560}             // 宽度（2K）
  height={1440}            // 高度（2K）
/>
```

**关键帧动画配置** - 编辑 `src/AppPromo/Scene.tsx`：
```tsx
export const KEYFRAMES = [
  {
    frame: 0,                    // 时间点（帧）
    pos: [0, -1, 0],            // 位置 [x, y, z]
    rot: [-3, 0, 0],            // 旋转 [x, y, z]（弧度）
    scale: 5,                    // 缩放
    screenshot: 0,               // 使用 screenshots 数组的索引
  },
  // ... 更多关键帧
];
```

**透明通道配置** - 编辑 `remotion.config.ts`：
```ts
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuva444p10le");  // 支持 Alpha 的像素格式
Config.setCodec("prores");
Config.setProResProfile("4444");         // ProRes 4444 支持透明
```

**3D 场景配置** - 编辑 `src/AppPromo/Scene.tsx`：
```tsx
<ThreeCanvas
  width={width}
  height={height}
  dpr={[1, 3]}                    // 设备像素比（质量）
  camera={{ position: [0, 0, 5], fov: 20 }}
  gl={{
    antialias: true,
    alpha: true,                  // 启用透明
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  }}
>
```

**背景设置** - 编辑 `src/AppPromo/index.tsx`：
```tsx
<AbsoluteFill
  style={{
    background: "transparent",    // 透明背景
    // background: "#ffffff",     // 白色背景
  }}
>
```

**后期效果调整** - 编辑 `src/AppPromo/Scene.tsx`：
```tsx
<EffectComposer>
  <BrightnessContrast brightness={0.1} contrast={0.2} />
</EffectComposer>
```

**材质反光调整** - 编辑 `src/AppPromo/PhoneModel.tsx` 或 `iPadModel.tsx`：
```tsx
child.material = new THREE.MeshStandardMaterial({
  map: texture,
  roughness: 0.2,      // 粗糙度（0-1，越小越光滑）
  metalness: 0.8,      // 金属度（0-1，越大越反光）
  emissive: new THREE.Color(0xBBBBBB),
  emissiveIntensity: 1,
});
```

### 资源准备

将以下文件放入 `public/` 目录：
- `iphone.glb` - iPhone 3D 模型（GLB 格式）
- `ipad.glb` - iPad 3D 模型（GLB 格式）
- `screenshot_1.png` ~ `screenshot_6.png` - 屏幕截图（建议与模型屏幕比例匹配）

### 常见问题

**导出时图片切换闪黑**
- 已在代码中使用帧驱动的过渡动画替代 setTimeout
- 所有纹理在模块级别预加载
- 建议导出时添加 `--concurrency=1` 参数

**透明背景不生效**
- 确保 `remotion.config.ts` 中设置了 `setPixelFormat("yuva444p10le")`
- 确保 `ThreeCanvas` 中设置了 `alpha: true`
- 确保场景 `background` 设置为 `null`

**画面太暗/太亮**
- 调整 `Scene.tsx` 中的光源 `intensity`
- 调整 `BrightnessContrast` 的 `brightness` 和 `contrast` 值
- 调整材质的 `emissiveIntensity`

---

## Tech Stack / 技术栈

- [Remotion](https://www.remotion.dev/) - React video generation framework / React 视频生成框架
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) - React Three.js renderer / React Three.js 渲染器
- [Three.js](https://threejs.org/) - 3D graphics library / 3D 图形库
- [React Three Drei](https://github.com/pmndrs/drei) - Three.js helper components / Three.js 辅助组件
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework / 样式框架

## Documentation / 参考文档

- [Remotion Docs](https://www.remotion.dev/docs/) / [Remotion 文档](https://www.remotion.dev/docs/)
- [Remotion Three.js Integration](https://www.remotion.dev/docs/three-canvas) / [Remotion Three.js 集成](https://www.remotion.dev/docs/three-canvas)
- [Remotion Transparent Videos](https://www.remotion.dev/docs/transparent-videos) / [Remotion 透明视频](https://www.remotion.dev/docs/transparent-videos)
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) / [React Three Fiber 文档](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)

## License / 许可证

MIT
