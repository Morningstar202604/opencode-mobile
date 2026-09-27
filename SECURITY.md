# Security

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead,
email the maintainers privately (see repository settings), or open a
[private advisory](https://github.com/advisories/new) if you are on GitHub.

We aim to acknowledge reports within 3 business days and to ship a fix as soon
as a safe patch is available.

## Security posture

- **No account, no cloud relay.** OpenCode Mobile does not talk to any official
  OpenCode service. Conversations flow **phone → your model API directly**.
- **No local backend.** Since v0.14 the app is a self-contained React front end
  that calls the OpenAI-compatible `chat/completions` API over SSE straight
  from the WebView. No `opencode` binary, no local server, no agent shell runs
  on the device.
- **Your API key stays on-device.** Keys and conversations are persisted in the
  WebView's on-device storage (Capacitor Preferences / localStorage). They are
  never uploaded to this project or to any third party other than the API base
  URL you configured.
- **The signing keystore is never committed.** Release signing reads
  `OCM_KEYSTORE_FILE` / `OCM_KEYSTORE_PASS` / `OCM_KEYSTORE_ALIAS` from the
  environment (see `android/app/build.gradle`). The published APKs are
  self-signed; verify the APK signature before sideloading any build.
- **Secrets in scripts**: regression scripts in `tools/` read API keys from
  environment variables only — never hard-code keys.
- **Only user-configured endpoints are contacted.** The app ships with no
  default provider, model, or remote URL. Anything the app connects to is
  something you typed into Settings.

## Threat model notes

- The WebView is served from local assets over the `https` Capacitor scheme;
  network requests to your model API go through the WebView/OS network stack
  with standard TLS protections.
- Code files created in the app's **Code** tab are written to the app's own
  Documents directory (via `@capacitor/filesystem`). They are plain text files
  the model may analyze; treat their contents as you would any local file.
- Sideloading untrusted APKs is always risky: only install builds you compiled
  yourself or the signed release APKs from the official GitHub Releases page.

## Responsible disclosure

Please include: affected version, a minimal reproduction, and (if known) the
impact. Thank you for helping keep this project safe.
