# Changelog

All notable changes to **OpenCode Mobile** are documented here.

The format is inspired by [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to semantic versioning.

## [0.15.0] — 2026-09-28

### Added
- **Rich Markdown rendering** — assistant messages now render headings, tables,
  lists, blockquotes and **syntax-highlighted code blocks** (17 languages via
  highlight.js, hand-registered core builds) with a one-tap copy button.
- **Reasoning & tool-call visualization** — streaming `reasoning_content` is
  shown as a collapsible "Thinking" card; streaming `tool_calls` are aggregated
  and shown as cyan chips. Both persist with the message.
- **Code file manager** — new **Code** tab: create / edit / delete code files.
  On device, files live in the app Documents directory (`@capacitor/filesystem`,
  `.ocm` extension); in browser preview they fall back to localStorage. Any file
  can be **inserted into chat** — a new session opens with the file name and
  content pre-filled in the composer for the model to analyze.
- **Full zh/en i18n** — all screens (Chat, Sessions, Code files, Settings),
  labels and dialogs are translated; language switch under Settings → General.
  `i18n.ts` provides typed dictionaries with `{var}` interpolation.
- Streaming accumulation fix — content, reasoning and tool calls are now
  accumulated through the stream instead of per-frame snapshot patches.
- Strict TypeScript check (`tsc --noEmit`) wired into `npm run build`; a
  `tsconfig.json` was added to the React app.

### Verified
- Playwright 390×844 regression (18/18): bottom 4-tab nav ✓, add model +
  save ✓, code file create/edit/save ✓, insert-into-chat pre-fills composer ✓,
  streaming thinking card + tool-call chips + Markdown (code block, table,
  blockquote) ✓, session back-navigation ✓, English i18n switch ✓.
- `@capacitor/filesystem` synced into the Android project; release APK signed
  with the same keystore as v0.14 (DN/SHA-256 unchanged → in-place upgrade OK).

## [0.14.0] — 2026-09-27

### Changed (breaking)
- **Complete UI rebuild** — the front end is no longer the patched upstream
  SolidJS UI. It is now a **self-contained React 19 + Vite + Tailwind CSS 4**
  app (`app-react/`) designed like mainstream AI apps (ChatGPT / Doubao / Qwen /
  Codex): message bubbles, pill composer, bottom tab bar (Chat / ＋ / Me),
  bottom sheets. The original OpenCode layouts are gone.
- **No local backend** — the app talks **directly to your model API** over SSE
  streaming (`chat/completions`). The `opencode` binary / local server is no
  longer involved; the app runs anywhere on the phone.
- Repo trimmed: the upstream `web/` snapshot was removed (not needed anymore).

### Added
- **Custom roles & system prompts** — built-in roles (General / Coder / Analyst /
  Writer / Translator), create/delete custom roles, per-model system prompt,
  global system prompt; all assembled and sent as `system` in every request.
- **Session management** — grouped history (Today / Yesterday / Older), search,
  rename, delete (with confirm); conversations stored on-device.
- **Stop generation** — client-side abort of the SSE stream.
- **Add model** — display name, base URL, API key, model ID, test connection,
  set as default; multiple models with a bottom-sheet picker.
- Signed release keystore rebuilt (same DN as v0.13).

### Verified
- Playwright 390×844: add model → test connection (Agnes AI, agnes-2.5-flash)
  ✓ → chat streaming ✓ → custom role "数字人" (only digits) → reply `2` for
  `1+1` ✓ → sessions list / rename ✓.

## [0.13.0] — 2026-09-27

### Added
- **Test connection** button on the "Add model" form — validates an OpenAI-compatible
  API endpoint (`/chat/completions`) directly from the UI before saving; green success /
  red error states.
- Verified **Agnes AI** (`apihub.agnes-ai.com`) end-to-end: free reasoning models
  `agnes-2.5/2.0/1.5-flash` answer chat requests reliably (~30s with reasoning).

### Fixed
- Model page crash (`TypeError: h.name.trim is not a function`):
  - root cause #1 — the add-model form stored the raw DOM event instead of the input
    value (`onChange` handler);
  - root cause #2 — defensive normalization for non-string model names from the v1 API.
- Server connectivity behind an HTTP(S) proxy returning `407`: the packaged backend now
  bypasses the environment proxy (phones reach public APIs directly, no impact on-device).

### Notes
- Agnes reasoning models are **stable for plain chat but unstable in multi-step tool
  loops** (observed: tool call issued, then the loop stalls). Use a fast non-reasoning
  model for complex agent tasks.

## [0.12.0] — 2026-09-26

### Added
- **Fully custom models** (ChatGPT/Codex-style page, replaces the upstream provider tree):
  - flat "My Models" list — avatar, name, `model-id · provider`, enable switch, delete;
  - add form: display name / API base URL / API key / model ID;
  - automatic provider creation: `PUT /auth/:providerID` stores the key,
    `PATCH /config` writes `provider.<id>` with `@ai-sdk/openai-compatible`.
- Server page shows the connected backend URL (monospace).
- Settings "General" page grouped into rounded cards.

## [0.11.0] — 2026-09-26

### Added
- Doubao-style settings **home page**: big title + four rows (Models / Server / Providers /
  General) + back-to-home button; mobile hides the left tab rail.

### Fixed
- Settings default tab never showing (explicit default values were overriding the index).

## [0.10.0] — 2026-09-26

### Added
- Home page quick prompt (type on the home screen to start a session).
- Settings as a full-screen page with a close button.

### Fixed
- Proxied v1 endpoints returning 200 + HTML (SPA fallback) now rewritten to 404 JSON
  (`/global`, `/path`, `/pty`), unblocking the SDK protocol detection.

## [0.9.0] — 2026-09-26

### Added
- Session page top bar rebuilt (back button, larger title, compact 44px actions);
- Dark-mode safe styling.

## [0.8.0] — 2026-09-26

### Added
- Global **bottom tab bar** (Chat / New / Me), always visible including drafts.

## [0.7.0] — 2026-09-26

### Changed
- **Official providers removed** (double safety: `disabled_providers: ["opencode"]`
  server-side + front-end filtering + no popular recommendations). Only your custom
  models appear.
- Model picker as a bottom sheet (GPT/Claude style).

## [0.6.0] — 2026-09-26

### Added
- Session page details: AI message avatars, tighter spacing.

## [0.5.0] — 2026-09-26

### Added
- Home page rebuilt as a conversation list (big title, search, time groups, FAB).

## [0.3.0] — 2026-09-26

### Added
- Chat-style session page: message bubbles, pill input, 44px send button.

## [0.2.0] — 2026-09-26

### Added
- Touch-friendly sidebar drawer + hamburger; app branding "OpenCode Mobile" with
  a full mipmap icon set.

## [0.1.0] — 2026-09-26

### Added
- First Android build: OpenCode Web UI packaged with Capacitor; `opencode serve`
  (official binary) as the in-process backend.
