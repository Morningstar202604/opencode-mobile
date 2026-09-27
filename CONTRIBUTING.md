# Contributing

Thanks for your interest in **OpenCode Mobile**! This is a community-built
Android app inspired by [OpenCode](https://github.com/sst/opencode) — an
unofficial, non-affiliated project. All contributions are welcome: bug reports,
UI polish, model-compatibility reports, docs, and translations.

## Getting started

1. Fork the repo and clone it.
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the layering
   (Capacitor shell → React 19 Web UI → your OpenAI-compatible API).
3. Follow [docs/BUILD.md](docs/BUILD.md) to get a working dev loop. The fastest
   loop is: edit `app-react/src`, `npm run build`, copy `dist/` into the repo
   root (or serve it with `tools/static-server.cjs` for browser debugging),
   then `npx cap sync android && cd android && ./gradlew assembleDebug`.

## Design constraints (please read before submitting UI changes)

This project has hard product rules:

- **Do not reintroduce the upstream desktop layout.** UI must stay in the
  mainstream-AI-app idiom (message bubbles, pill composer, bottom tab bar,
  bottom sheets, safe-area-aware, mobile-first at ~390px width).
- **No official providers, no official models, no free-tier defaults.** The app
  ships with zero providers and zero model presets wired to any vendor. Only
  user-configured OpenAI-compatible models may appear.
- **Do not break function while changing form.** Every UI change should be
  accompanied by a regression check at 390×844 (`tools/reg-*.cjs`, Playwright)
  against a real or mocked OpenAI-compatible endpoint.
- **Secrets never in the repo.** API keys go through environment variables in
  scripts/tests only. The signing keystore is intentionally not committed
  (see `keystore/` in `.gitignore`).

## What makes a good PR

- One concern per PR, with a screenshot of the before/after if it touches UI.
- Frontend changes: keep the TypeScript/React 19 conventions of `app-react/src`
  (functional components, Tailwind utility classes, typed state via `types.ts`,
  user-facing strings through `i18n.ts`).
- Regression scripts live in `tools/` and follow `reg-vNNN.cjs` naming.
- Update `CHANGELOG.md` under the current version section.

## Code of conduct

Be respectful, constructive, and assume good faith. Harassment or
discrimination of any kind is not tolerated. See
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

By contributing you agree that your contributions are licensed under the
project's [MIT License](LICENSE).
