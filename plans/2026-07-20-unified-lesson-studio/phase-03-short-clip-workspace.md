# Phase 03: Short-Clip Studio Workspace

## Objective

Expose `ct-short-clip` as one render unit in the same project list and Studio shell while preserving its dedicated renderer and CLI.

## Planned Changes

- Add `src/studio/adapters/short-clip-adapter.ts` using `ShortClipSpecSchema`, `readShortClipSpec`, and `renderShortClip` directly.
- Add optional progress reporting to `renderShortClip` at its existing three deterministic steps; keep the option backward compatible.
- Extend project list/manifest responses with renderer label, unit count, and final video URL for short clips.
- Add frontend renderer dispatch in `studio/app/main.js` so HyperFrames keeps the graph workspace and short-clip mounts a dedicated single-unit workspace.
- Disable all renderer-specific edit controls while the current project has an active render job; re-enable them after terminal job status.
- Add focused frontend modules:
  - `studio/app/controllers/short-clip-controller.js`;
  - `studio/app/components/short-clip-card.js`;
  - corresponding scoped styles.
- Expose only schema-supported fields: algorithm, title, subtitle, source, seed, duration override, initial values, and sound settings.
- Validate 12–50 values and 20–60 seconds through the server schema; display field-level errors without overwriting the saved script.
- Render to the existing project `video.mp4`; no fake voice or compose steps are introduced.
- Represent short-clip with one video unit and `composition: null`; the output node reflects that unit directly.

## Tests to Write First

- Short-clip project appears in list/get responses and never enters HyperFrames scene code paths.
- Valid edit marks the single unit stale; invalid edit writes nothing.
- Render dispatch calls the dedicated renderer, reports progress, and records ready fingerprint on success.
- Existing `npm run short-clip` tests and CLI behavior remain unchanged.
- Frontend controller tests cover renderer dispatch and serialized save payloads using pure functions/fakes.
- Active render state disables short-clip edits and prevents save submission until completion.

## Acceptance

- A user can open, edit, render, and play a short clip entirely from Studio.
- HyperFrames controls are hidden for short clips, and short-clip controls are absent for HyperFrames projects.

## Implementation Status

- [x] Renderer-aware short-clip adapter with deterministic progress reporting and direct `video.mp4` output.
- [x] Server create/list/get/save/render support for one short-clip video unit and `composition: null`.
- [x] Dedicated Studio form, preview, serializer whitelist, validation field highlighting, and active-render edit lock.
- [x] Existing short-clip CLI/trace tests remain green.
- [x] TDD verification: short-clip API and frontend helper tests pass; full suite, typecheck, and build pass.

## P1 Coverage

Open, configure, render, and play `ct-short-clip` in Studio.
