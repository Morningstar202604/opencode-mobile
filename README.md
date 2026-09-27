<div align="center">

[**English**](README.md) · [中文](README.zh-CN.md)

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/banner.png" alt="OpenCode Mobile" width="100%" />
</p>

# OpenCode Mobile

> **Run OpenCode — the terminal AI coding agent — on your Android phone.**
> A mobile-native AI assistant with a **completely rebuilt UI** (React 19,
> designed like ChatGPT / Doubao / Qwen / Codex) and **100% BYO-model**:
> no official services, no official models, no vendor lock-in.

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/chat-markdown.png" width="180" alt="Chat with Markdown" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/sessions.png" width="180" alt="Sessions" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/files.png" width="180" alt="Code files" />
  <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/settings.png" width="180" alt="Settings" />
</p>

<p align="center">
  <b>Chat · Sessions · Code files · Fully custom models & prompts</b>
</p>

</div>

---

## Why OpenCode Mobile?

OpenCode is a brilliant open-source coding agent — but its web UI was built for
desktop, and the official service tied you to their models. OpenCode Mobile
**throws away the original layout and rebuilds the front end from scratch** with
a modern stack (React 19 + Vite + Tailwind CSS 4), designed the way mainstream
AI apps are: message bubbles, a pill composer, a bottom tab bar, bottom sheets,
and mobile-first ergonomics.

- 🧩 **Fully rebuilt UI** — none of the original OpenCode layouts survive. Every
  screen is re-designed for the phone: Chat, Sessions, Code files, Settings,
  model picker.
- ✍️ **Rich Markdown rendering** — assistant messages render headings, tables,
  lists, quotes and **syntax-highlighted code blocks** (17 languages) with a
  one-tap copy button.
- 🧠 **Reasoning & tool-call visibility** — streaming `reasoning_content` shows
  as a collapsible "Thinking" card; tool calls appear as chips, exactly like the
  modern agents you use.
- 📁 **Code file manager** — create, edit and delete code files right on the
  phone (real files in the app's Documents directory), then **insert any file
  into chat** for the model to analyze — your phone becomes the computer.
- 🌐 **Bilingual i18n (English / 简体中文)** — switch language anytime in
  Settings; all screens, labels and dialogs are translated.
- 🔌 **100% custom models** — bring your own OpenAI-compatible API
  (base URL + key + model ID). The official provider is **completely removed**;
  nothing phones home.
- 👤 **Custom roles & system prompts** — create role presets (coder, analyst,
  translator, SQL expert, anything), edit the global system prompt, or give a
  model its own prompt. The final system prompt is assembled and sent with
  every message.
- ✅ **Test connection built in** — verify any endpoint right in the add-model
  form before saving.
- 🗂️ **Local session management** — grouped history (Today / Yesterday / Older),
  rename, delete, search; conversations are stored on-device.
- ⏹️ **Stop generation** — interrupt a stream at any time (client-side abort).
- 🔒 **Private by default** — no account, no cloud relay; your conversations go
  straight from the phone to the API provider you configured.
- ⚡ **No backend required** — the app talks directly to your model API over
  SSE streaming. It runs anywhere, no local server needed.

## Screenshots

Full app walkthrough — every screen is mobile-first at 390×844.

| Chat (Markdown + thinking + tool calls) | Sessions | Code files | Settings |
| --- | --- | --- | --- |
| <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/chat-markdown.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/sessions.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/files.png" width="150"/> | <img src="https://cdn.jsdelivr.net/gh/X33834/opencode-mobile@main/docs/screenshots/settings.png" width="150"/> |

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
2. Tap **Add model** and fill in:
   - **Display name** — e.g. `GPT-4o mini`
   - **API base URL** — e.g. `https://api.openai.com/v1`
   - **API key** — your key (stays on-device)
   - **Model ID** — e.g. `gpt-4o-mini`
3. Tap **Test connection** — you should see a green `✓ 连接成功`.
4. Tap **Save** (it becomes your default model), then tap **＋** to start a chat.
5. Optional: in **Me → Roles & prompts**, create role presets or a global
   system prompt to shape how your model answers.

> Works with any OpenAI-compatible endpoint. Verified with Agnes AI
> (`https://apihub.agnes-ai.com/v1`, `agnes-2.5-flash`), OpenAI-compatible
> providers, and local OpenAI-compatible servers.

## Build from source

The Android app is a plain Capacitor shell around a self-contained React app —
**no upstream monorepo needed**.

```bash
# 1) Frontend (React 19 + Vite + Tailwind) — app-react/
cd app-react
npm install
npm run build          # → app-react/dist/

# 2) Android app — this repo root
cd ..
rm -rf dist && cp -r app-react/dist dist
npm i
npx cap sync android
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Full, tested steps (JDK, Android SDK, signing) are in
**[docs/BUILD.md](docs/BUILD.md)**.

## How it works

```
┌──────────────────────────────────────────────────────┐
│                  OpenCode Mobile (Android)           │
│                                                      │
│   React 19 UI (app-react/)  ── Capacitor WebView ──► │
│   │                                                   │
│   ├─ Chat (SSE streaming, stop, Markdown + syntax    │
│   │        highlighting, thinking & tool-call cards) │
│   ├─ Sessions (local history, rename/delete/search)  │
│   ├─ Code files (edit on-device, insert into chat)   │
│   └─ Settings                                         │
│        ├─ Models (base URL + key + model ID)         │
│        ├─ Roles & prompts (custom system prompts)    │
│        └─ General (language zh/en)                   │
└───────────────┬──────────────────────────────────────┘
                │ HTTPS + Authorization: Bearer <key>
                ▼
       Your OpenAI-compatible API
   (ChatGPT / Claude via gateway / DeepSeek /
    Qwen / Agnes / any provider you choose)
```

- Conversations are stored locally (`localStorage`) on the device.
- Every message stream is a standard OpenAI `chat/completions` SSE request
  straight from the phone to your provider.
- No official OpenCode account, no cloud relay, no telemetry.

## Roadmap

- [x] v0.1–v0.13 — mobile wrapper, patched upstream UI, custom models
- [x] v0.14 — **full UI rebuild** (React 19): custom roles, system prompts,
      session management, stop generation, on-device storage
- [x] v0.15 — **Markdown rendering & code highlighting**, reasoning
      (`thinking`) & tool-call visualization, on-device **code file manager**
      (edit + insert into chat), full zh/en i18n
- [ ] Agent tools (file editing / shell) via a self-hosted or cloud sandbox

## License

MIT — see [LICENSE](LICENSE). Both the original OpenCode project
([sst/opencode](https://github.com/sst/opencode), MIT) and this mobile
rebuild are MIT-licensed.

## Contributing & Security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md).
