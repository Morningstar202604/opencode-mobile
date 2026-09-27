# Architecture

OpenCode Mobile is a thin **Android shell** around the OpenCode engine. Three
layers, each of which could be swapped independently:

```
┌──────────────────────────────────────────────────────────┐
│ 1. Android app (Capacitor)                               │
│    • WebView host, app id `ai.opencode.mobile`           │
│    • serves the built Web UI from assets (webDir: dist)  │
│    • launches `opencode serve` locally as the backend    │
├──────────────────────────────────────────────────────────┤
│ 2. Web UI (SolidJS + Vite, packages/app)                 │
│    • mobile-first redesign (this project's main work)    │
│    • talks to the backend via the OpenCode SDK (v1)      │
├──────────────────────────────────────────────────────────┤
│ 3. Backend (opencode serve — official binary)            │
│    • sessions, config, auth, providers, tools, files     │
│    • calls the user-configured model API (OpenAI-compatible) │
└──────────────────────────────────────────────────────────┘
```

## Data flow

1. User configures a model in **Me → Models** (display name, base URL, key,
   model ID).
2. The UI stores the key via `PUT /auth/:providerID` and writes the provider
   into config via `PATCH /config` (`provider.<id>` =
   `@ai-sdk/openai-compatible`, `options.baseURL`, `models`).
3. The user starts a session. Composer posts
   `POST /session/{id}/message` with `{ model, parts }`.
4. The backend runs the agent loop (chat → tools → filesystem → shell) and
   streams events back over `GET /event`.
5. Messages are read via `GET /session/{id}/message`; tools are executed
   **on-device** by the backend binary.

## The mobile redesign (this project's core)

The upstream desktop UI was re-built in `web/packages/app/src`:

| Area | Mobile-first change |
| --- | --- |
| Navigation | Global bottom tab bar **Chat / New / Me** (all routes incl. drafts) |
| Home | Conversation list: big title, search, time groups, quick prompt, FAB |
| Session | Message bubbles, pill composer, 44px send, compact top bar with back, dark-safe |
| Model picker | Bottom sheet (menu-v2) |
| Settings | Full-screen page; Doubao-style home (Models / Server / Providers / General); add-model form with **test connection** |
| Providers | Official provider list & popular picks **removed**; `disabled_providers: ["opencode"]` + front-end filter |

All of it lives in `web/packages/app/src` — the backend contract is untouched
(1:1 API mapping verified across v0.1→v0.13).

## Key technical decisions

- **Capacitor over Tauri/Flutter**: reuses the entire upstream Web UI unchanged
  at the contract level, fastest path to a native shell; iOS can reuse the same
  shell.
- **`opencode serve` as backend** (not `node-pty`): `node-pty` cannot compile on
  Android; the HTTP backend keeps session/file/tool capabilities and is
  process-local (nothing leaves the device).
- **Fully custom models**: OpenAI-compatible protocol via `@ai-sdk/openai-compatible`,
  no official auth flow, no model catalog phone-home.

## Repository map

```
web/packages/app/src/
├── pages/                # home, layout (tab bar), session timeline, composer
├── components/           # titlebar, settings-v2 (models/server/providers/general), dialogs
├── context/              # models, server-sync, session stores
└── index.css             # mobile-first styles (sections 1–9.3)
android/                  # Capacitor Android project
tools/                    # static-server + Playwright regression scripts
docs/screenshots/         # UI evidence per version
```

## Compatibility notes

- Verified working with OpenAI-compatible endpoints: Agnes AI
  (`apihub.agnes-ai.com/v1`), mock OpenAI-compatible local server, and the
  upstream test model path.
- Agnes free reasoning models: stable for plain chat; tool-loop heavy tasks are
  better with a fast non-reasoning model.
- The v1 SDK endpoints (`/session`, `/auth`, `/config`, `/provider`, `/event`,
  `/message`, `/project`, ...) are used via the official JS SDK; the dev proxy
  (`tools/static-server.cjs`) rewrites SPA-fallback HTML to 404 JSON so the SDK
  can distinguish missing endpoints.
