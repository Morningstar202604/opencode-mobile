<div align="center">

[**English**](README.md) · [中文](README.zh-CN.md)

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/banner.png" alt="OpenCode Mobile" width="100%" />
</p>

# OpenCode Mobile

> **Run OpenCode — the terminal AI coding agent — on your Android phone.**
> A mobile-native wrapper with a completely custom, mainstream-AI-style UI
> (think ChatGPT / Doubao / Qwen app), 100% BYO-model: **no official services,
> no official models, no vendor lock-in.**

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/home-v4.png" width="180" alt="Home" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/session-v5.png" width="180" alt="Session" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v012-models.png" width="180" alt="Models" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v013-test-conn.png" width="180" alt="Test connection" />
</p>

<p align="center">
  <b>Home · Session · Fully custom models · Test connection</b>
</p>

</div>

---

## Why OpenCode Mobile?

[OpenCode](https://github.com/sst/opencode) is a brilliant open-source coding
agent that runs in your terminal. But the web UI was built for desktop, and the
official service tied you to their models.

OpenCode Mobile takes the same engine and **redesigns it for the phone**:

- 📱 **Mobile-first UI** — rebuilt around how mainstream AI apps look and feel:
  message bubbles, a pill composer, a bottom tab bar (Chat / New / Me), full-screen
  settings, bottom sheets for model picking.
- 🔌 **100% custom models** — bring your own OpenAI-compatible API
  (base URL + key + model ID). The official provider and its free tier are
  **completely removed**; nothing phones home.
- ✅ **Test connection built in** — verify your API endpoint right in the add-model
  form before saving.
- 🤖 **Real agent capabilities** — the full OpenCode engine runs on your device:
  chat, file edits, shell commands, agent workflows — powered by *your* model.
- 🔒 **Private by default** — no account, no cloud relay; your conversations go
  straight from the phone to the API provider you configured.
- ⚡ **Runs anywhere** — the whole thing is self-contained; the backend is the
  official `opencode` binary running locally on the phone.

## Screenshots

| Home | Session | Settings home | Models | Test connection |
| --- | --- | --- | --- | --- |
| <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/home-v4.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/session-v5.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v011-settings-home.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v012-models.png" width="140"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/v013-test-conn.png" width="140"/> |

## Quick start

### Install the APK

Download the latest release APK from the
[**GitHub Releases**](https://github.com/X33834/opencode-mobile/releases/latest)
page (or follow the build instructions below) and install it on your Android
device (`Settings → Install unknown apps` → allow this file).
Mirrors: [Gitee](https://gitee.com/badhope/opencode-mobile) ·
[GitCode](https://gitcode.com/badhope/opencode-mobile).

### First run

1. Open the app → bottom **Me** tab → **Models**.
2. Tap **＋ Add** and fill in:
   - **Display name** — e.g. `GPT-4o mini`
   - **API base URL** — e.g. `https://api.openai.com/v1`
   - **API key** — your key (stays on-device)
   - **Model ID** — e.g. `gpt-4o-mini`
3. Tap **Test connection** — you should see a green `✓ 连接成功`.
4. Tap **Save**, then start chatting. The agent can edit files and run commands
   in its working directory — all through your own model.

> Works with any OpenAI-compatible endpoint. Verified with Agnes AI
> (`https://apihub.agnes-ai.com/v1`, `agnes-2.5-flash`), OpenAI, and local
> OpenAI-compatible servers.

## Build from source

```bash
# 1) Frontend (Web UI) — needs the upstream monorepo, see docs/BUILD.md
cd opencode          # sst/opencode checkout
# apply the web/ sources from this repo (web/packages/app, ui, sdk)
cd packages/app && bun install && bun run build   # → dist/

# 2) Android app — this repo
cp -r packages/app/dist /path/to/opencode-mobile/dist
cd /path/to/opencode-mobile
npm i
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Full, tested steps (JDK, Android SDK, signing) are in
**[docs/BUILD.md](docs/BUILD.md)**.

## How it works

```
┌───────────────────────────────────────────────┐
│  Android app (this repo)                      │
│  ┌──────────────┐   ┌──────────────────────┐  │
│  │ Capacitor    │   │ OpenCode Web UI      │  │
│  │ (WebView)    │──▶│ (SolidJS, mobile-    │  │
│  │              │   │  first, this repo)   │  │
│  └──────────────┘   └──────────┬───────────┘  │
│                                │ localhost    │
│  ┌─────────────────────────────▼───────────┐  │
│  │ opencode serve (official binary, in-    │  │
│  │ process backend: sessions, tools, files)│  │
│  └─────────────────────────────┬───────────┘  │
└────────────────────────────────┼─────────────┘
                                 │ HTTPS (your own API key)
                        ┌────────▼────────┐
                        │ Your model API  │
                        │ (OpenAI-compatible) │
                        └─────────────────┘
```

The app **never** talks to OpenCode's official service. The backend binary is
the same one you would run in a terminal — it just runs on your phone.

## Design principles

- **Mainstream-AI UX first.** We did *not* keep OpenCode's desktop layout.
  Navigation, composer, model picker and settings were re-designed to match the
  mental model of ChatGPT / Doubao / Qwen apps on mobile.
- **Function first, then flair.** Every UI change is regression-tested against
  the real backend (`tools/reg-*.cjs` + Playwright at 390×844).
- **You own your models.** No curated provider list, no sponsored defaults —
  only what you configure.

## Repository layout

```
opencode-mobile/
├── android/            # Capacitor Android project (buildable)
├── web/                # Frontend sources (packages/app · ui · sdk)
├── tools/              # Dev tools (local static server, regression scripts)
├── docs/
│   ├── BUILD.md        # End-to-end build guide (tested)
│   ├── ARCHITECTURE.md # Architecture & data flow
│   └── screenshots/    # UI screenshots
├── CHANGELOG.md
├── LICENSE             # MIT (upstream + this project)
└── README.md
```

## Roadmap

- [x] v0.13 — test connection, Agnes AI verified, crash fixes
- [x] v0.12 — fully custom models, server card UI, general page cards
- [x] v0.11 — settings home (Doubao-style)
- [x] v0.10 — home quick prompt, full-screen settings
- [x] v0.9 — session top bar, dark mode
- [x] v0.8 — bottom tab bar
- [x] v0.7 — official providers removed, model bottom sheet
- [x] v0.1–v0.6 — Android shell, chat UI, home page, details
- [ ] Stop-generation button
- [ ] Connection-status banner
- [ ] Session management (rename/delete)
- [ ] iOS port (same Capacitor shell)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports, UI feedback, and model
compatibility reports are all welcome.

## License & attribution

[MIT](LICENSE). This project is an **unofficial, community-built** Android
client. The upstream engine and Web UI are
[OpenCode](https://github.com/sst/opencode) (MIT, © 2025 opencode contributors),
and the upstream copyright is preserved in the LICENSE file. "OpenCode" is the
name of the upstream project; this repository is not affiliated with or endorsed
by its maintainers.


---

## 中文

完整中文版见 **[README.zh-CN.md](README.zh-CN.md)** — 把 OpenCode AI 编程智能体装进安卓手机，100% 自定义模型，界面按豆包 / ChatGPT 设计语言重做。
