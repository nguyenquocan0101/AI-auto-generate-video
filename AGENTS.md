# Repository Guidelines

## Project Structure

This TypeScript/ESM repository generates deterministic Vietnamese 9:16 short videos from scripts, HyperFrames templates, media assets, and optional TTS.

- `src/cli.ts` is the pipeline entry point.
- `src/assets/`, `src/render/`, `src/tts/`, and `src/utils/` contain focused media, rendering, TTS, and shared helpers.
- `src/short-clip/` contains the dedicated no-TTS algorithm renderer; each runtime lives in `src/short-clip/algorithms/` and is registered centrally.
- `templates/` contains reusable templates, usually with `index.html`, `meta.json`, `hyperframes.json`, and optional `compositions/`.
- `scripts/` contains maintenance tools such as SFX download/filter commands.
- `tests/fixtures/` stores reusable media; unit tests live beside source files as `*.test.ts`.
- `.agents/skills/` contains repository workflow instructions for agents; `.codex/` contains Codex configuration and support files.
- `output/` is reserved for generated videos, audio, and render artifacts.

## Codex Skills

Repository skills live in `.agents/skills/<skill-name>/SKILL.md`, which is the directory Codex discovers automatically. Each skill must have `name` and `description` frontmatter; optional `scripts/`, `references/`, `assets/`, and `agents/openai.yaml` stay inside that skill directory. `.codex/` is reserved for Codex configuration and migration support, not skill discovery. Claude-specific commands, agents, and hooks under `.claude/` are not loaded automatically by Codex. When a portable Claude skill changes, run `node scripts/migrate-claude-skills-to-codex.mjs`, then validate the resulting skills and restart Codex if the update is not detected. Keep only one repository skill directory for each skill name.

## Build, Test, and Development

```text
npm install
npm run pipeline -- output/my-video/script.json
npm run build
npm run typecheck
npm test
npm run test:watch
npm run coverage
npm run sfx:download
npm run sfx:filter
```

Run OmniVoice locally before a TTS-enabled pipeline. Use `.env.local` for local service endpoints.

## Coding Style

Use TypeScript ES modules, two-space indentation, and explicit exported types at public module boundaries. Keep modules small and domain-focused. Name files in lowercase kebab-case, such as `image-fetcher.ts` and `template-pipeline.ts`. Prefer deterministic, readable code over hidden state or environment-specific behavior.

## Testing

Use Vitest. Name tests `name.test.ts` and colocate them with the implementation; put shared media in `tests/fixtures/`. Mock HTTP, TTS, and external media services where practical. Run `npm test` and `npm run typecheck` for changes to pipeline logic, schemas, or clients.

## Commits and Pull Requests

Use focused imperative commits following the existing style: `AI Coding: Short imperative summary`. Pull requests should explain the purpose, list validation commands, link relevant issues, and include screenshots or output paths for template/UI changes.

## Configuration and Media Safety

Never commit credentials. Keep generated artifacts under `output/`. Preserve reproducibility: identical script and configuration inputs should produce equivalent output. Avoid changing retained template assets unless the change is intentional and documented.
