# Contributing

Thanks for your interest in **OpenCode Mobile**! This is a community-built
Android client around [OpenCode](https://github.com/sst/opencode) — an
unofficial, non-affiliated project. All contributions are welcome: bug reports,
UI polish, model-compatibility reports, docs, and translations.

## Getting started

1. Fork the repo and clone it.
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the layering
   (Capacitor shell → Web UI → local `opencode serve` backend).
3. Follow [docs/BUILD.md](docs/BUILD.md) to get a working dev loop. The fastest
   loop is: edit `web/packages/app/src`, `bun run build`, copy `dist/` into the
   Android project (or serve it with `tools/static-server.cjs` for browser
   debugging), then `npx cap sync android && gradlew assembleDebug`.

## Design constraints (please read before submitting UI changes)

This project has hard product rules:

- **Do not reintroduce the upstream desktop layout.** UI must stay in the
  mainstream-AI-app idiom (bubbles, pill composer, bottom tab bar, bottom sheets,
  full-screen settings).
- **No official providers, no official models, no free-tier defaults.**
  `disabled_providers: ["opencode"]` + front-end filtering must stay in place.
  Only user-configured OpenAI-compatible models may appear.
- **Do not break function while changing form.** Every UI change should be
  accompanied by a regression check against a real backend at 390×844
  (`tools/reg-*.cjs`, Playwright).
- **Secrets never in the repo.** API keys go through environment variables in
  scripts/tests only. The signing keystore is intentionally not committed
  (see `keystore/` in `.gitignore`).

## What makes a good PR

- One concern per PR, with a screenshot of the before/after if it touches UI.
- Frontend changes: keep TypeScript/SolidJS conventions of `web/packages/app/src`.
- Regression scripts live in `tools/` and follow `reg-vNNN.cjs` naming.
- Update `CHANGELOG.md` under `[Unreleased]`.

## Code of conduct

Be respectful, constructive, and assume good faith. Harassment or
discrimination of any kind is not tolerated.

## License

By contributing you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
