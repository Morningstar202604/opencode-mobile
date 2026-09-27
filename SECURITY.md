# Security

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities. Instead,
email the maintainers privately (see repository settings), or open a
[private advisory](https://github.com/advisories/new) if you are on GitHub.

We aim to acknowledge reports within 3 business days and to ship a fix as soon
as a safe patch is available.

## Security posture

- **No account, no cloud relay.** OpenCode Mobile does not talk to any official
  OpenCode service. Conversations flow phone → your model API directly.
- **Your API key stays on-device** (stored by the local backend's auth store,
  written via `PUT /auth/:providerID`). It is never uploaded to this project or
  any third-party service other than the API base URL you configured.
- **The signing keystore is never committed.** Release signing reads
  `OCM_KEYSTORE_FILE` / `OCM_KEYSTORE_PASS` / `OCM_KEYSTORE_ALIAS` from the
  environment (see `android/app/build.gradle`). The published APKs are
  self-signed; verify the APK signature before sideloading any build.
- **Secrets in scripts**: regression scripts in `tools/` read API keys from
  environment variables only — never hard-code keys.

## Threat model notes

- The app embeds the official `opencode` binary as a local backend. Treat the
  app's working directory as you would a shell session: the agent can read and
  write files and execute commands **in the workspace you grant it**.
- The WebView is served from local assets over the `https` Capacitor scheme;
  network requests to your model API go through the WebView/OS network stack
  with the standard TLS protections.

## Responsible disclosure

Please include: affected version, a minimal reproduction, and (if known) the
impact. Thank you for helping keep this project safe.
