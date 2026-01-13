# Web AI 图片增强器（Overlay-only）

> 纯前端合成：保持原图像素不变，只叠加透明 PNG 图层。包含 Laper.ai 风格 UI、Framer Motion 动效、Tailwind + shadcn 组件。

## 0. 环境与启动
1) Node 18+（推荐 18/20）。
2) 安装依赖：`npm install`
3) 开发模式：`npm run dev`
4) 访问：`http://localhost:3000`
5) 环境变量：复制 `.env.example` 为 `.env.local`，填入 `GEMINI_API_KEY`（未填则自动使用 mock 数据）。

## 1. 核心流程
1) 上传原图（只读，不改尺寸/像素）。
2) 输入自然语言指令。
3) 调用 `/api/generate`：
   - 若无 API Key 或指令含 `demo`，返回内置透明占位 PNG（红色方块代替圣诞帽）。
   - 否则应调用 Gemini：先拿 JSON 定位，再拿透明 PNG overlay，并返回 `{ overlay_png_base64, overlay_size, placement, confidence }`。
4) 前端在 Canvas 中叠加：底层原图 + 上层 overlay（按 placement 旋转/缩放/拖拽微调）。
5) 可下载：合成 PNG、单独 overlay PNG、placement JSON。

## 2. 关键实现点
- **不改原图尺寸**：Canvas 尺寸 = 原图尺寸；仅叠加 overlay。
- **两段式提示**（需在真实 Gemini 调用中实现）：
  1) JSON：返回 overlay_brief + placement(x,y,width,height,rotation) + 约束。
  2) PNG：据 overlay_brief 生成透明 PNG（紧边界），并返回 overlay 实际尺寸。
- **校验与容错**：前端 clamp 坐标和尺寸；无 overlay 或 confidence 低时提示用户手动调整。
- **导出**：`toBlob` 导出 PNG；单独导出 overlay / placement JSON。
- **UI/交互**：
  - 深色 + 玻璃拟态，Framer Motion 过渡。
  - 画布区支持滚轮缩放、拖拽（空格按下可扩展为平移，本实现默认点击空白拖动画布、点中 overlay 拖动 overlay）。
  - 控制面板：示例 chips、滑杆微调 x/y/width/height/rotation、下载按钮。

## 3. 需自行补完的真实模型调用
`app/api/generate/route.ts` 里现为 mock。建议：
```ts
// 伪代码
const gen = new GoogleGenerativeAI(apiKey);
const model = gen.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-pro" });
// Step 1: 请求 JSON（传入 image base64 + prompt）
// Step 2: 用 overlay_brief 生成透明 PNG（image output 或 base64）
// Step 3: 返回合并结果
```
确保：
- PNG 背景透明，不含原图像素。
- 不要让模型输出合成图。

## 4. 目录结构
```
web ai 工具/img-enhancer-web/
├── app/
│   ├── api/generate/route.ts        # Mock & API 模板
│   ├── components/
│   │   ├── ControlPanel.tsx         # 右侧面板 + 调整/下载
│   │   └── ImageCanvas.tsx          # 画布合成，拖拽/缩放/旋转
│   │   └── ui/*                     # 按钮/输入/滑杆等
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                     # 页面主逻辑
├── lib/utils.ts
├── package.json / tsconfig.json / tailwind.config.ts / postcss.config.js / next.config.js
├── .env.example
└── README.md
```

## 5. Mock 体验
- 未配置 `GEMINI_API_KEY` 时自动走 mock。
- 在指令中包含 "demo" 也会强制返回 mock（红方块当作圣诞帽）。

## 6. 注意
- 生产中请把真实的 Gemini 调用搬到 `/api/generate`，避免在前端暴露 Key。
- 如果需要 WebGL/Three.js 特效，可在画布外围再加特效层，但保持导出使用 2D Canvas 保证像素对齐。
# Auto deploy test 2026年 1月13日 星期二 20时50分43秒 CST
