# Architecture

OpenCode Mobile is a thin **Android shell** around a **self-contained React 19
front end** that talks **directly to your OpenAI-compatible model API**. There
is no local backend and no official OpenCode service involved at runtime.

```
┌──────────────────────────────────────────────────────────┐
│ 1. Android app (Capacitor)                               │
│    • WebView host, app id `ai.opencode.mobile`           │
│    • serves the built React app from assets (webDir: dist)│
│    • INTERNET permission + cleartext traffic enabled     │
├──────────────────────────────────────────────────────────┤
│ 2. Web UI (React 19 + Vite + Tailwind, app-react/)       │
│    • mobile-first design, none of the upstream layout    │
│    • Chat (SSE streaming + stop)                         │
│    • Sessions (local history, rename/delete/search)      │
│    • Settings (models / roles & prompts / general)       │
│    • state persisted in localStorage on-device           │
├──────────────────────────────────────────────────────────┤
│ 3. Model API (user-configured, OpenAI-compatible)        │
│    • POST {baseURL}/chat/completions (SSE)               │
│    • Authorization: Bearer <apiKey>                      │
└──────────────────────────────────────────────────────────┘
```

## Data flow

1. User adds a model in **Me → Models**: display name, base URL, API key,
   model ID. An optional per-model system prompt can be attached.
2. **Test connection** sends a minimal `chat/completions` request to verify
   the endpoint before saving.
3. The saved model becomes the default; the model picker (bottom sheet) can
   switch at any time.
4. User sends a message in a session. The app assembles the **system prompt**
   (global prompt + active role prompt + model prompt), appends history + the
   new user message, and streams `chat/completions` over SSE, rendering deltas
   in real time. **Stop** aborts the stream client-side.
5. Sessions (messages, titles, timestamps, model used) are stored in
   `localStorage` — nothing leaves the device except the model request itself.

## The UI rebuild (this project's core)

The original OpenCode web UI was **completely discarded** and re-written from
scratch in `app-react/src`:

| Area | Implementation |
| --- | --- |
| Navigation | Bottom tab bar **Chat / ＋ / Me**; safe-area aware |
| Chat | Message bubbles (user right / assistant left), pill composer, 44px send, stop button while streaming, auto-scroll, typing indicator |
| Sessions | Search, groups (Today / Yesterday / Older), rename & delete dialogs |
| Settings | Tabs: **Models / Roles & prompts / General**; add-model form with test connection; role presets + custom roles; global system prompt |
| Model picker | Bottom sheet, shows name + model ID, active check |

## Key technical decisions

- **React 19 + Vite + Tailwind CSS 4**: modern, mainstream stack — the same
  design language as ChatGPT / Doubao / Qwen / Codex; fast dev loop and small
  bundle (~257 kB JS, ~21 kB CSS).
- **Direct API calls (no local backend)**: the app works anywhere — no
  `opencode` binary, no server, no account. SSE streaming is implemented with
  the browser `fetch` reader loop.
- **Capacitor over Tauri/Flutter**: mature Android shell, plain WebView, easy
  to rebuild and sign; iOS can reuse the same shell.
- **On-device privacy**: keys and conversations never leave the phone except
  the HTTPS request to the provider you configured.
