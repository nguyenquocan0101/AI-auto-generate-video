# Phase 02: Server Orchestration and HyperFrames Compatibility

## Objective

Move Studio server logic behind testable services, persist durable state, and make existing targeted HyperFrames renders authoritative on the server.

## Planned Changes

- Add `src/studio/server.ts` with a server factory accepting output root, renderer adapters, and generation adapter for tests.
- Add focused modules:
  - `src/studio/project-store.ts` — safe paths, atomic JSON writes, legacy adoption, list/load/save;
  - `src/studio/render-jobs.ts` — one active job per project, progress, failure, redacted logs;
  - `src/studio/adapters/hyperframes-adapter.ts` — inspect units, validate script, map render modes, resolve artifacts;
  - `src/studio/http-routes.ts` — current endpoints plus additive fields.
- Keep `npm run studio` and port `4173`; change only the internal entry command if TypeScript execution is required.
- Preserve existing payloads used by `studio/app/services/studio-api.js`.
- On project save, compare previous/current scripts, persist new sidecar fingerprints, and return calculated states.
- On render success, record the current successful fingerprint; on failure, store scoped error and retain unrelated states.
- Serialize save/render state mutations per project. Capture the requested artifact fingerprint when the child starts and compare it again when the child exits before recording `ready`.
- Reject project save with HTTP 409 while that project owns an active render job; expose the active lock in project/job responses so the frontend can disable editing.
- On server startup/load, reconcile orphaned persisted `rendering` states to `stale` because no child process can still own them.
- Block compose server-side when any required voice/video unit is missing, stale, rendering, or failed.

## HyperFrames Details

- Continue using `src/cli.ts --mode audio|video|scene|compose --scene <id>`.
- Treat scene mode as voice plus fitted video.
- Treat visual-only mode as video; existing cached voice may be used only to calculate duration.
- Ensure a voice change marks video stale because fitted duration can change.
- Graph position changes remain presentation-only; scene order changes affect composition state.

## Tests to Write First

- API compatibility tests for list/get/create/save/render/jobs.
- Legacy HyperFrames project loads without a sidecar and reports all existing artifacts stale.
- Save voice-only change invalidates exactly voice, scene video, and composition for that scene.
- Visual-only change leaves voice ready.
- Render one scene does not modify unrelated artifact timestamps.
- Compose returns a clear prerequisite list while stale units remain.
- Failed child-process output is redacted and scoped to the target unit.
- Save during an active project render returns 409 and leaves script/sidecar unchanged.
- An external script change during render cannot mark the old render ready when the child exits.
- Restart recovery clears orphaned `rendering` state without deleting the prior artifact.

## Acceptance

- Current HyperFrames Studio workflow remains usable with no manual project migration.
- Refreshing Studio preserves stale/ready/failed state.
- Server, not frontend inference, is the source of artifact freshness.

## Implementation Status

- [x] Testable `createStudioServer` with safe project store and additive HTTP routes.
- [x] Durable sidecar persistence, legacy adoption, atomic writes, and restart recovery.
- [x] HyperFrames adapter and targeted render job manager with per-project locking.
- [x] Snapshot-safe completion, compose prerequisite blocking, scoped/redacted failures.
- [x] TDD verification: 8 Phase 02 server tests pass; full suite, typecheck, and build pass.

## P1 Coverage

Inspect durable status; edit/rerender only affected HyperFrames artifacts.
