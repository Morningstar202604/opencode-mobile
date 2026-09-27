<div align="center">

[English](README.md) · **中文**

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/banner.png" alt="OpenCode Mobile" width="100%" />
</p>

# OpenCode Mobile

> **把 OpenCode——终端里的 AI 编程智能体——装进你的安卓手机。**
> 移动端原生体验，界面完全按主流 AI 应用（ChatGPT / 豆包 / 千问）的设计语言重做，
> 模型 100% 自定义：**无官方服务、无官方模型、无任何绑定。**

</div>

---

## 为什么选择 OpenCode Mobile？

[OpenCode](https://github.com/sst/opencode) 是优秀的开源 AI 编程智能体，但官方 Web 界面为桌面设计，且官方服务绑定了官方模型。

OpenCode Mobile 保留完整引擎能力，**为手机重新设计了一切**：

- 📱 **移动优先界面**——消息气泡、胶囊输入框、底部三 Tab（对话 / 新建 / 我的）、全屏设置、模型选择底部弹层、添加模型「测试连接」——不参考 OpenCode 原生桌面布局
- 🔌 **模型 100% 自定义**——只需填 **API 地址 + API Key + 模型 ID**（OpenAI 兼容接口均可）；官方服务商与官方模型（含免费额度）**彻底移除**，不向官方回传任何数据
- ✅ **测试连接内置**——添加模型时先在表单里验证你的 API 端点，绿色成功 / 红色报错
- 🤖 **完整 agent 能力**——OpenCode 引擎随 App 内置运行：会话、文件读写、执行命令、agent 工作流，全部由**你自己的模型**驱动
- 🔒 **默认隐私**——无账号、无云中转，对话从手机直达你配置的模型服务
- ⚡ **随处可用**——整个应用自包含，后端是官方 `opencode` 二进制，在手机上本地运行

## 界面预览

| 首页 | 会话页 | 设置主页 | 模型页 | 测试连接 |
| --- | --- | --- | --- | --- |
| <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/home-v4.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/session-v5.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v011-settings-home.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v012-models.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v013-test-conn.png" width="140"/> |

## 快速上手

### 安装 APK

从 [**GitHub Releases**](https://github.com/X33834/opencode-mobile/releases/latest) 下载最新 APK 安装到手机（`设置 → 安装未知应用 → 允许`）。
镜像仓库：[Gitee](https://gitee.com/badhope/opencode-mobile) · [GitCode](https://gitcode.com/badhope/opencode-mobile)。

### 首次使用

1. 打开 App → 底部 **我的** → **模型**
2. 点 **＋ 添加**，填写：
   - **显示名称**——如 `GPT-4o mini`
   - **API 地址**——如 `https://api.openai.com/v1`
   - **API Key**——你的密钥（仅保存在设备上）
   - **模型 ID**——如 `gpt-4o-mini`
3. 点 **测试连接**——出现绿色 `✓ 连接成功`
4. 点 **保存**，然后开始对话。智能体可在工作目录中读写文件、执行命令——全部通过你自己的模型完成。

> 兼容任何 OpenAI 兼容端点。已实测：Agnes AI（`https://apihub.agnes-ai.com/v1`，`agnes-2.5-flash`）、OpenAI、本地 OpenAI 兼容服务。

## 从源码构建

```bash
# 1) 前端（Web UI）——需要上游 monorepo，详见 docs/BUILD.md
cd opencode          # sst/opencode 检出
# 应用本仓库 web/ 源码（web/packages/app、ui、sdk）
cd packages/app && bun install && bun run build   # → dist/

# 2) 安卓 App——本仓库
cp -r packages/app/dist /path/to/opencode-mobile/dist
cd /path/to/opencode-mobile
npm i
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

完整实测步骤（JDK、Android SDK、签名）见 **[docs/BUILD.md](docs/BUILD.md)**。

## 工作原理

```
┌───────────────────────────────────────────────┐
│  安卓 App（本仓库）                             │
│  ┌──────────────┐   ┌──────────────────────┐  │
│  │ Capacitor    │   │ OpenCode Web UI      │  │
│  │ (WebView)    │──▶│ (SolidJS, 移动优先)   │  │
│  └──────────────┘   └──────────┬───────────┘  │
│                                │ localhost    │
│  ┌─────────────────────────────▼───────────┐  │
│  │ opencode serve（官方二进制，进程内后端：  │  │
│  │ 会话/工具/文件）                         │  │
│  └─────────────────────────────┬───────────┘  │
└────────────────────────────────┼─────────────┘
                                 │ HTTPS（你自己的 API Key）
                        ┌────────▼────────┐
                        │ 你的模型服务     │
                        │ (OpenAI 兼容)   │
                        └─────────────────┘
```

App **从不**与 OpenCode 官方服务通信。后端二进制与你在终端里运行的是同一个，只是跑在手机上。

## 设计原则

- **主流 AI 应用体验优先**——不保留 OpenCode 桌面布局；导航、输入、模型选择、设置全部按 ChatGPT / 豆包 / 千问的移动端心智重做
- **功能优先，再谈美化**——每个 UI 改动都在真实后端 + 390×844 手机视口上回归验证（`tools/reg-*.cjs` + Playwright）
- **模型由你掌控**——没有精选服务商列表、没有赞助默认项，只有你自己配置的模型

## 仓库结构

```
opencode-mobile/
├── android/            # Capacitor 安卓工程（可构建）
├── web/                # 前端源码（packages/app · ui · sdk）
├── tools/              # 开发工具（本地静态服务器、回归脚本）
├── docs/
│   ├── BUILD.md        # 端到端构建指南（已实测）
│   ├── ARCHITECTURE.md # 架构与数据流
│   └── screenshots/    # 界面截图
├── CHANGELOG.md
├── LICENSE             # MIT（上游 + 本项目）
└── README.md
```

## 路线图

- [x] v0.13 — 测试连接、Agnes AI 实测、崩溃修复
- [x] v0.12 — 模型完全自定义、服务器页卡片化
- [x] v0.11 — 设置主页（豆包式）
- [x] v0.10 — 首页快捷输入、设置全屏化
- [x] v0.9 — 会话页顶栏、深色模式
- [x] v0.8 — 底部主导航
- [x] v0.7 — 移除官方服务商、模型底部弹层
- [x] v0.1–v0.6 — 安卓壳、聊天界面、首页、细节
- [ ] 停止生成按钮
- [ ] 断连提示横幅
- [ ] 会话管理（重命名 / 删除）
- [ ] iOS 移植（同一套壳）

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。欢迎提交 Bug、界面反馈与模型兼容性报告。

## 许可证与声明

[MIT](LICENSE)。本项目是**非官方社区项目**：上游引擎与 Web UI 来自 [sst/opencode](https://github.com/sst/opencode)（MIT，© 2025 opencode contributors，版权声明保留在 LICENSE 中）。「OpenCode」是上游项目名称，本仓库与其维护者无附属或背书关系。
