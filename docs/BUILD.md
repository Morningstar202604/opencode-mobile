# Build guide (tested end-to-end)

This document records the exact, tested build chain used to produce the
v0.14.0 APKs. Environment: Linux x86_64, Node.js ≥ 20, Temurin JDK 21,
Android SDK.

## Prerequisites

| Tool | Version / note |
| --- | --- |
| Node.js | ≥ 20 (for Vite + Capacitor CLI) |
| npm | 10+ (bundled with Node) |
| JDK | **21** (Temurin: `https://adoptium.net`) |
| Android SDK | `platform-tools`, `platforms;android-35`, `build-tools;35.0.0` |
| Gradle | 8.x (wrapper included in `android/`) |

## Step 1 — Frontend (React 19 + Vite + Tailwind)

The mobile UI is a **self-contained React app** in `app-react/` of this repo.
No upstream monorepo is required.

```bash
cd app-react
npm install
npm run build
# → dist/  (the built Web UI)
```

## Step 2 — Copy the web build into the Android project

```bash
rm -rf dist && cp -r app-react/dist dist
```

## Step 3 — Sync Capacitor

```bash
cd /path/to/opencode-mobile
npm i            # installs @capacitor/cli etc.
npx cap sync android
```

## Step 4 — Build the APK

```bash
export JAVA_HOME=/path/to/jdk-21
export ANDROID_HOME=/path/to/android-sdk
cd android
./gradlew assembleRelease assembleDebug --no-daemon
# → app/build/outputs/apk/release/app-release.apk
# → app/build/outputs/apk/debug/app-debug.apk
```

### Signing

The published APKs are self-signed. For your own release builds:

```bash
# generate once
keytool -genkeypair -v -keystore opencode-mobile.keystore \
  -alias opencode-mobile -keyalg RSA -keysize 2048 -validity 10000

# point Gradle at it (android/app/build.gradle signingConfigs.release)
```

The `keystore/` directory is intentionally **not committed** (see `.gitignore`)
— never publish your signing key.

## Local browser debugging (fast UI loop)

Instead of rebuilding the APK for every UI tweak, serve the built `dist/` and
proxy API calls to a local `opencode serve`:

```bash
# 1) start the backend (bypass proxy env if behind one)
env -u HTTPS_PROXY -u HTTP_PROXY opencode serve --port 8188 --hostname 127.0.0.1

# 2) serve the UI + proxy (tools/static-server.cjs)
node tools/static-server.cjs            # http://127.0.0.1:8190

# 3) regression check at phone viewport
CHROMIUM=/usr/local/bin/chromium node tools/reg-v013.cjs
```

## Notes & known constraints

- **`node-pty` cannot build on Android** — the TUI terminal front-end of
  OpenCode is not portable to the phone. The app uses `opencode serve` (the
  HTTP backend) instead; session/file/tool capabilities are unaffected.
- On a phone, the app talks to public model APIs directly; corporate proxy
  environments may need a bypass (`env -u HTTPS_PROXY`) only when developing on
  a desktop behind a proxy.
