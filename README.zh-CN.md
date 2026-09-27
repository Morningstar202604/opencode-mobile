<div align="center">

[English](README.md) · **中文**

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/banner.png" alt="OpenCode Mobile" width="100%" />
</p>

# OpenCode Mobile

> **把 OpenCode——终端里的 AI 编程智能体——装进你的安卓手机。**
> 移动端原生 AI 助手，**前端完全重构**（React 19，设计语言对标 ChatGPT / 豆包 / 千问 / Codex），
> 模型 **100% 自定义**：**无官方服务、无官方模型、无任何绑定。**

</div>

---

## 为什么选择 OpenCode Mobile？

[OpenCode](https://github.com/sst/opencode) 是优秀的开源 AI 编程智能体，但官方 Web 界面为桌面设计，且官方服务绑定了官方模型。OpenCode Mobile **把原来的界面全部丢掉、用新技术栈从零重写**（React 19 + Vite + Tailwind CSS 4），按主流 AI 应用的方式设计：消息气泡、胶囊输入框、底部导航、底部弹层、移动优先的交互。

- 🧩 **前端彻底重构**——不再沿用任何 OpenCode 原生布局；聊天、会话、代码文件、设置、模型选择全部为手机重做
- ✍️ **富 Markdown 渲染**——标题、表格、列表、引用，以及**带语法高亮的代码块**（17 种语言）一键复制
- 🧠 **思考过程与工具调用可视化**——流式 `reasoning_content` 以可折叠「思考过程」卡片呈现；工具调用以标签 chips 展示，对标主流 Agent 应用
- 📁 **代码文件管理器**——手机上直接新建/编辑/删除代码文件（真实文件存于应用 Documents 目录），**一键插入聊天**让模型分析——手机就是你的电脑
- 🌐 **中英双语 i18n**——设置里随时切换语言，所有页面、标签、弹窗均已翻译
- 🔌 **模型 100% 自定义**——只需填 **API 地址 + API Key + 模型 ID**（任意 OpenAI 兼容接口）；官方服务商与官方模型**彻底移除**，不向官方回传任何数据
- 👤 **自定义角色与提示词**——内置程序员 / 数据分析师 / 翻译等角色，可新建任意角色预设（如「SQL 专家」）、编辑全局系统提示词、或给单个模型配置专属提示词；每次对话自动组装 system prompt 发送
- ✅ **测试连接内置**——添加模型时先在表单里验证你的 API 端点，绿色成功 / 红色报错
- 🗂️ **本地会话管理**——按今天 / 昨天 / 更早分组的历史记录，支持重命名、删除、搜索；对话全部保存在手机本地
- ⏹️ **随时停止生成**——流式输出过程中可立即打断
- 🔒 **默认隐私**——无账号、无云中转，对话从手机直达你配置的模型服务
- ⚡ **无需后端**——App 直接以 SSE 流式调用你的模型 API，随处可用，不需要本地服务

## 界面预览（全部截图）

移动端 390×844 真实视口截图。

| 聊天（Markdown + 思考 + 工具调用） | 会话列表 | 代码文件 | 设置 |
| --- | --- | --- | --- |
| <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/chat-markdown.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/sessions.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/files.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/settings.png" width="150"/> |

## 快速开始

### 安装 APK

从 [**GitHub Releases**](https://github.com/X33834/opencode-mobile/releases/latest) 页面下载最新 APK（或按下方源码构建），安装到安卓手机（`设置 → 允许安装未知应用` → 允许此文件）。
镜像：[Gitee](https://gitee.com/badhope/opencode-mobile) · [GitCode](https://gitcode.com/badhope/opencode-mobile)。

### 第一次使用

1. 打开 App → 底部 **我的** Tab → **模型管理**。
2. 点击 **添加模型**，填写：
   - **显示名称** —— 例如 `GPT-4o mini`
   - **API 地址（baseURL）** —— 例如 `https://api.openai.com/v1`
   - **API Key** —— 你的密钥（只保存在本机）
   - **模型 ID** —— 例如 `gpt-4o-mini`
3. 点击 **测试连接** —— 应看到绿色 `✓ 连接成功`。
4. 点击 **保存**（自动设为默认模型），点底部 **＋** 开始对话。
5. 可选：在 **我的 → 角色与提示词** 里新建角色预设或编辑全局提示词，塑造模型回答风格。

> 兼容任意 OpenAI 兼容端点。已实测 Agnes AI（`https://apihub.agnes-ai.com/v1`、`agnes-2.5-flash`）、各类 OpenAI 兼容服务与本地兼容服务。

## 源码构建

安卓 App 是标准的 Capacitor 壳 + 自包含 React 应用——**不再依赖上游 monorepo**。

```bash
# 1) 前端（React 19 + Vite + Tailwind）—— app-react/
cd app-react
npm install
npm run build          # → app-react/dist/

# 2) 安卓工程 —— 仓库根目录
cd ..
rm -rf dist && cp -r app-react/dist dist
npm i
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

完整构建步骤（JDK、Android SDK、签名）见 **[docs/BUILD.md](docs/BUILD.md)**。

## 工作原理

```
┌──────────────────────────────────────────────────────┐
│                  OpenCode Mobile（安卓）              │
│                                                      │
│   React 19 UI（app-react/）── Capacitor WebView ──►  │
│   │                                                   │
│   ├─ 聊天（SSE 流式、可停止；Markdown 渲染、代码高亮、│
│   │        思考过程与工具调用卡片）                    │
│   ├─ 会话（本地历史，重命名/删除/搜索）               │
│   ├─ 代码文件（手机本地编辑，一键插入聊天）           │
│   └─ 设置                                             │
│        ├─ 模型管理（API 地址 + Key + 模型 ID）        │
│        ├─ 角色与提示词（自定义系统提示词）            │
│        └─ 通用（语言 中/英）                          │
└───────────────┬──────────────────────────────────────┘
                │ HTTPS + Authorization: Bearer <key>
                ▼
       你自己的 OpenAI 兼容 API
   （ChatGPT / Claude 网关 / DeepSeek / 千问 / Agnes / 任意）
```

- 会话保存在本机（`localStorage`）。
- 每次对话都是标准的 OpenAI `chat/completions` SSE 流式请求，从手机直达你的服务商。
- 无官方 OpenCode 账号、无云中转、无任何遥测。

## 路线图

- [x] v0.1–v0.13 —— 移动化封装、改造上游 UI、自定义模型
- [x] v0.14 —— **前端全面重构**（React 19）：自定义角色、系统提示词、会话管理、停止生成、本地存储
- [x] v0.15 —— **Markdown 渲染与代码高亮**、思考过程（thinking）与工具调用可视化、手机本地**代码文件管理器**（编辑 + 插入聊天）、中英全量 i18n
- [ ] Agent 工具（文件读写 / 执行命令）—— 通过自建或云端沙箱

## 开源许可

MIT —— 见 [LICENSE](LICENSE)。上游 OpenCode（[sst/opencode](https://github.com/sst/opencode)，MIT）与本移动端重构均为 MIT 许可。

## 贡献与安全

见 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [SECURITY.md](SECURITY.md)。
