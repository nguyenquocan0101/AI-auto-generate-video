# Plan: Unified Lesson Studio

**Date:** 2026-07-20  
**Mode:** hard  
**Test:** --tdd  
**Risk:** high-risk — introduces a versioned job/state schema and new generation/render APIs while preserving two existing render flows.  
**Spec:** `plans/unified-lesson-studio/spec.md`  
**Status:** Complete — all five phases verified

## Goal

Extend the existing Studio rather than replace it. Keep `script.json` canonical for both renderers, preserve `npm run pipeline`, `npm run short-clip`, and `npm run studio`, then add durable artifact freshness, renderer adapters, short-clip editing/rendering, and two project creation paths.

## Research Verdict

### Primary: sidecar job state (selected)

Keep existing renderer scripts unchanged and add `studio-job.json` beside them. The sidecar stores the renderer discriminator, source metadata, per-artifact input fingerprints, statuses, errors, and final composition state. A server-side reconciler combines this state with files on disk.

- Lowest migration risk: existing CLI schemas remain authoritative.
- Freshness survives reloads and is not guessed only from file existence.
- Existing projects without a sidecar can be enrolled lazily, preserving files but marking all expected artifacts stale until rerendered.

### Alternative: embed all state in a new lesson manifest (not selected for P1)

A single manifest could own script plus artifact state, but it would either duplicate renderer schemas or force both CLIs to accept a new wrapper immediately. That expands migration scope and creates two sources of truth during rollout.

The useful part of this alternative is retained: `studio-job.json` is versioned and renderer-neutral, but it references the canonical `script.json` rather than replacing it.

## Architecture Decisions

1. **Canonical content:** `output/<project>/script.json` remains the input consumed by existing renderers.
2. **Durable Studio state:** `output/<project>/studio-job.json` stores only orchestration metadata and fingerprints; no API key or generated media is embedded.
3. **Renderer adapters:** server code dispatches through `hyperframes` and `ct-short-clip` adapters with common `inspect`, `validate`, `save`, `render`, and `artifacts` operations.
4. **Freshness by fingerprint:** status is derived from the current normalized inputs, the last successful fingerprint, file existence, and active/failed job state.
5. **Additive API compatibility:** keep existing project and render request shapes working. Add renderer/source fields and short-clip/generation operations without breaking current Studio clients.
6. **Generation boundary:** use a provider-neutral `LessonGenerationAdapter` with a server-configured local process adapter plus request-scoped BYOK adapters for OpenAI, Claude, and Gemini. Credentials remain memory-only and are never serialized.
7. **Render-time edit lock:** Studio disables project/scene editing while that project has an active render. The server also rejects save requests during the active job. After completion, editing is enabled and normal invalidation marks affected artifacts stale.
8. **Snapshot-safe render completion:** every render job still captures its target fingerprint at start as defense in depth. A successful process updates an artifact to `ready` only if the current project fingerprint still matches; external file changes therefore cannot produce false-ready state.
9. **Serialized project mutation:** save, render-start, and render-completion state changes use one per-project mutation queue so sidecar updates cannot overwrite each other.

## Validated Choices

- Legacy projects without `studio-job.json`: preserve files but mark all expected artifacts `stale`; require explicit rerender before compose.
- P1 generation transport: local process/skill and request-scoped BYOK HTTP adapters behind the provider-neutral adapter interface.
- Editing during render: locked in the UI and rejected by the server until the active project job finishes.
- Delivery method: TDD for contracts, fingerprints, invalidation, server APIs, and adapter dispatch; smoke/interaction verification for Studio UI.
- Phase 04 scope update: add request-scoped BYOK adapters for OpenAI, Claude, and Gemini alongside local process generation. Keys remain memory-only and are never persisted or echoed.

## Artifact Invalidation Matrix

| Change | Voice | Scene video | Final composition |
|---|---:|---:|---:|
| Scene `voiceText`, TTS provider, voice, speed, instruct | stale | stale | stale |
| Scene template, visual inputs, aspect | unchanged | stale | stale |
| Scene SFX settings | unchanged | unchanged | stale |
| Scene order | unchanged | refit/stale where duration role changes | stale |
| Short-clip algorithm, values, seed, duration, sound, title/subtitle | n/a | single unit stale | same output unit |
| Graph position only | unchanged | unchanged | unchanged |

## API Shape

Existing endpoints remain available. Responses gain `renderer`, `units`, and `composition` fields.

- `POST /api/project/create`: import validated HyperFrames or short-clip JSON atomically.
- `POST /api/project/generate`: create from `{ project, source: { kind: "topic" | "url", value } }` through the configured generation adapter.
- `POST /api/project/save`: validate, compare fingerprints, write script plus sidecar atomically enough to recover by reconciliation.
- `POST /api/render`: preserve current modes and add renderer-adapter dispatch for the short-clip unit.
- `GET /api/project` and `GET /api/projects`: list both renderer types and durable artifact state.
- `GET /api/jobs/:id`: preserve polling contract and add renderer/unit/artifact identifiers.

## Phases

1. [x] [Phase 01 — Contracts and artifact state](phase-01-contracts-and-artifact-state.md)
2. [x] [Phase 02 — Server orchestration and HyperFrames compatibility](phase-02-server-and-hyperframes.md)
3. [x] [Phase 03 — Short-clip Studio workspace](phase-03-short-clip-workspace.md)
4. [x] [Phase 04 — Import and source generation](phase-04-project-creation-and-generation.md)
5. [x] [Phase 05 — Verification and rollout](phase-05-verification-and-rollout.md)

## Session Notes
<!-- Updated by cook automatically — do not edit manually -->

**Last active:** 2026-07-20 03:10
**Phase in progress:** phase-05-verification-and-rollout
**Status:** Complete — build/typecheck pass, 21 test files / 108 tests pass, final review APPROVED 9/10.

### Decisions made this session

- Invalid `studio-job.json` opens conservatively in read-only mode; save, render, and graph mutations are blocked until the sidecar is repaired or moved.
- Save is transactional across script/graph/sidecar recovery, and atomic writers remove temporary files on failure.
- Duplicate render requests are rejected before sidecar mutation; failed HyperFrames and short-clip artifacts retain scoped errors.
- Browser and paid/real media providers were not invoked; integration smoke uses temporary roots and deterministic fake adapters/runners, while the running Studio passed read-only HTTP smoke on `/` and `/api/projects`.

### Next immediate action

Use `npm run studio` for the local workflow; optionally perform a manual real-provider/OmniVoice/Chromium smoke in the target machine environment.

## Verification Strategy

- Unit-test normalization, fingerprinting, invalidation, reconciliation, secret redaction, and adapter dispatch.
- Integration-test Studio APIs against temporary output directories and fake renderer/generator adapters.
- Preserve current schema, pipeline, short-clip, and beep-track test suites.
- Verify unrelated scene artifact timestamps remain unchanged after targeted rerender.
- Run `npm test`, `npm run typecheck`, and `npm run build`; perform one HyperFrames and one short-clip Studio smoke test.

## Risks

- **False freshness:** file existence alone is insufficient. Never mark an artifact ready unless its successful fingerprint matches the current input fingerprint.
- **Legacy adoption:** projects without sidecars have no historical fingerprint. Preserve their files but mark all expected artifacts stale until explicitly rerendered; never infer ready from timestamps.
- **Partial writes:** script and sidecar are separate files. Use atomic writes per file and reconcile mismatched script fingerprints on load by conservatively marking affected artifacts stale.
- **Edit-during-render race:** lock Studio edits and reject saves during the active job; additionally compare captured/current fingerprints before recording `ready` to protect against external file edits.
- **Restart recovery:** persisted `rendering` without a matching in-memory child job is invalid after server restart; reconciliation converts it to `stale` with an interrupted-job note.
- **Voice/video coupling:** a voice change can alter duration, so the fitted scene video must become stale even if visual inputs are unchanged.
- **Credential leakage:** redact known secret patterns from child-process diagnostics and never serialize process environment or adapter credentials. BYOK keys are request-scoped and memory-only.
- **Scope control:** natural-language scene rewrite, approval diffs, authentication, and remote queues remain P2/P3. Provider selection and BYOK entry are now included in Phase 04 because the user explicitly requested them; persistent key management remains out of scope.

## P1 Story Mapping

| P1 story | Phases |
|---|---|
| Create from topic/URL or existing script | 01, 04, 05 |
| Inspect units and durable artifact status | 01, 02, 03, 05 |
| Edit/rerender only affected HyperFrames artifacts | 01, 02, 05 |
| Open/configure/render short-clip in Studio | 01, 03, 05 |
