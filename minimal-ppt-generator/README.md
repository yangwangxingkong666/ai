# 极简 PPT 生成器 — Minimal PPT Generator

> 文案一键生成极简风 PPT — Markdown 驱动、4 种极简美学主题、一键导出标准 `.pptx`、支持 DeepSeek / OpenAI 等大模型 AI 智能生成。

![技术栈](https://img.shields.io/badge/HTML-CSS-JS-blue) ![PptxGenJS](https://img.shields.io/badge/PptxGenJS-3.12.0-orange) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4) ![DeepSeek](https://img.shields.io/badge/AI-DeepSeek-4F46E5)

---

## 功能特性

- **Markdown 驱动**：用 `---` 分隔幻灯片，支持 `#` / `##` / 列表 / 引用 / 代码块
- **4 种极简主题**：极简原白 / 极客暗黑 / 莫兰迪棕 / 森系青绿 — 实时切换，CSS 变量驱动
- **16:9 卡片式预览**：大留白、强字号对比、圆角阴影、翻页动画
- **一键导出 PPTX**：基于 PptxGenJS，生成真实的 `.pptx` 文件，可直接用 PowerPoint / WPS / Keynote 打开编辑
- **AI 智能生成**：默认配置 DeepSeek API（`deepseek-chat`），输入主题即可自动生成 10 页结构化 Markdown 文案。也支持任何兼容 OpenAI Chat Completions 格式的 API

---

## 快速使用

### 本地使用

直接双击 `minimal-ppt-generator/index.html` 即可在浏览器中使用。

> **无需安装任何依赖**，所有 CDN 资源均从网络加载。

### 在线使用

部署到 GitHub Pages 后访问：

```
https://<你的用户名>.github.io/<仓库名>/minimal-ppt-generator/
```

---

## 项目文件结构

```
minimal-ppt-generator/
├── index.html          # 主页面（双栏布局 + 主题选择器 + AI 弹窗）
├── style.css           # 4 主题 CSS 变量 + 卡片美学样式
├── app.js              # Markdown 解析器 + 16:9 预览渲染 + PptxGenJS 导出
├── ai-config.js        # DeepSeek / OpenAI 兼容 API 调用 + AI 自动生成
└── README.md           # 本文件
```

---

## AI 功能配置（默认 DeepSeek）

1. 点击顶部工具栏 **"AI 生成"** 按钮
2. 弹窗中已预填 DeepSeek 默认值：
   - **Endpoint**：`https://api.deepseek.com/v1/chat/completions`
   - **模型**：`deepseek-chat`
3. 填入你的 **DeepSeek API Key**（从 [platform.deepseek.com](https://platform.deepseek.com) 获取）
4. 输入 PPT 主题关键词，点击 **"生成 PPT 文案"**
5. 等待 10-30 秒，生成的 10 页 Markdown 文案将自动填入左侧编辑器

### 切换到其他 AI 提供商

只需修改弹窗中的 Endpoint、Model 和 API Key 即可，支持：
- **OpenAI**：`https://api.openai.com/v1/chat/completions` + `gpt-4o-mini`
- **DeepSeek**：`https://api.deepseek.com/v1/chat/completions` + `deepseek-chat`
- **通义千问（阿里云百炼）**：`https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` + `qwen-plus`
- **Moonshot（Kimi）**：`https://api.moonshot.cn/v1/chat/completions` + `moonshot-v1-8k`
- **任何兼容 OpenAI 格式的 API**

---

## Markdown 编写规范

| 元素 | 写法 | 说明 |
|------|------|------|
| 幻灯片分隔 | `---` | 单独一行，分隔两张幻灯片 |
| 大标题 | `# 标题` | 封面标题或内容页主标题 |
| 副标题 | `## 副标题` | 封面副标题或内容页副标题 |
| 无序列表 | `- 项目` | 圆点列表 |
| 有序列表 | `1. 项目` | 数字列表 |
| 粗体 | `**强调**` | 加粗 |
| 斜体 | `*斜体*` | 倾斜 |
| 引用 | `> 文字` | 引用块 |
| 行内代码 | `` `code` `` | 代码格式 |
| 代码块 | ` ``` ` 包裹 | 多行代码 |

---

## 部署到 GitHub Pages

### 第一步：推送整个项目

```bash
git init
git add .
git commit -m "feat: 极简 PPT 生成器 — DeepSeek 兼容版"
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

### 第二步：开启 GitHub Pages

1. 仓库 → **Settings** → **Pages**
2. Branch 选择 `main`，文件夹选择 `/ (root)`
3. 点击 **Save**，等待 1-2 分钟

### 第三步：访问

```
https://<你的用户名>.github.io/<仓库名>/minimal-ppt-generator/
```

---

## 四大极简主题

| 主题 | 配色特点 |
|------|---------|
| **极简原白** | 纯白 #fff + Indigo #4F46E5 |
| **极客暗黑** | 深石墨 #16213e + 青空蓝 #38BDF8 |
| **莫兰迪棕** | 暖米 #faf6f0 + 灰褐 #A0897B |
| **森系青绿** | 浅青绿 #f4f9f2 + 森林绿 #4A7C59 |

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Tailwind CSS 3 | 原子化 UI 框架 |
| CSS 变量 | 4 主题实时切换 |
| CSS `color-mix()` | 主题色派生 |
| PptxGenJS 3.12 | 客户端生成 .pptx 文件 |
| Lucide Icons | 极简图标库 |
| Google Fonts | Playfair Display + Inter + Noto Sans SC |
| DeepSeek API | AI 智能生成（默认），兼容所有 OpenAI 格式 |

---

## License

MIT — 自由使用、修改和分发。