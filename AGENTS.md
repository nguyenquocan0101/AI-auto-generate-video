# Repository Guidelines

## Project Structure & Module Organization

This repository generates Vietnamese 9:16 short videos from article/text input using TypeScript, OmniVoice TTS, HyperFrames templates, and deterministic rendering.

- `src/cli.ts` is the pipeline entry point.
- `src/config.ts` and `src/config.test.ts` hold runtime configuration and config tests.
- `src/assets/` contains image, audio, and SFX helpers.
- `src/render/` contains template composition, schema, and video tooling.
- `src/tts/` contains OmniVoice/TTS clients.
- `src/utils/` contains shared utilities such as slug generation and logging.
- `templates/` stores HyperFrames templates, each typically with `index.html`, `meta.json`, `hyperframes.json`, and optional `compositions/`.
- `scripts/` contains maintenance utilities such as SFX download/filter scripts.
- `tests/fixtures/` stores reusable test media. Unit tests currently live next to source files as `*.test.ts`.
- `.agents/skills/` and `.codex/skills/` contain agent-specific workflow instructions.

## Build, Test, and Development Commands

- `npm install` installs project dependencies.
- `npm run pipeline -- output/my-video/script.json` runs the video generation pipeline with a prepared script.
- `npm test` runs Vitest once with `--passWithNoTests`.
- `npm run test:watch` starts Vitest in watch mode.
- `npm run coverage` runs Vitest with V8 coverage.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run build` compiles TypeScript.
- `npm run sfx:download` and `npm run sfx:filter` manage sound-effect assets.

Run a local OmniVoice server before pipeline generation when TTS is required.

## Coding Style & Naming Conventions

Use TypeScript ES modules. Prefer small, focused modules under the existing domain folders. Keep file names lowercase kebab-case where possible, for example `image-fetcher.ts` and `template-pipeline.ts`. Use two-space indentation and explicit exported types for public module boundaries. Keep generated media under `output/`, not in source folders.

## Testing Guidelines

Use Vitest for tests. Place tests beside the implementation as `name.test.ts` unless a shared fixture belongs in `tests/fixtures/`. Mock external HTTP calls and TTS dependencies where practical. Run `npm test` and `npm run typecheck` before submitting changes that touch pipeline logic, schemas, or clients.

## Commit & Pull Request Guidelines

Recent commits use the format `AI Coding: Short imperative summary` such as `AI Coding: Update guideline`. Keep commits focused and descriptive. Pull requests should include a short purpose statement, commands run, linked issues when applicable, and screenshots or sample output paths for visual/template changes.

## Security & Configuration Tips

Keep secrets and local endpoints in `.env.local`; do not commit credentials. Treat `output/` as generated artifacts. When changing templates, preserve deterministic rendering: the same `script.json` should produce the same video.
