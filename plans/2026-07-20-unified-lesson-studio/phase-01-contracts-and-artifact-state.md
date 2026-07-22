# Phase 01: Contracts and Artifact State

## Objective

Create renderer-neutral Studio contracts and deterministic freshness rules without changing renderer behavior.

## Planned Changes

- Add `src/studio/contracts.ts` with:
  - supported renderer discriminator (`hyperframes`, `ct-short-clip`);
  - versioned `StudioJobSchema` for `studio-job.json`;
  - render unit, artifact, composition, source, error, and status types;
  - request/response schemas for project create/save/generate/render.
- Reuse `TemplateScriptSchema` and `ShortClipSpecSchema` through a discriminated union; do not duplicate their field definitions.
- Add `src/studio/fingerprints.ts` with stable normalization and SHA-256 hashes for:
  - HyperFrames voice inputs;
  - HyperFrames visual inputs;
  - composition inputs/order/SFX;
  - short-clip input spec.
- Add `src/studio/artifact-state.ts` with pure invalidation and reconciliation functions.
- Define `studio-job.json` as orchestration state only; explicitly reject credential-like fields.

## State Rules

- `missing`: expected file is absent.
- `ready`: file exists and `successfulFingerprint === currentFingerprint`.
- `stale`: file exists but fingerprints differ, or a required dependency is stale.
- `rendering`: an active job owns this artifact.
- `failed`: the most recent render attempt failed; preserve the prior file but do not call it ready for current inputs.

`ct-short-clip` has one video unit and `composition: null`; the schema must not manufacture voice, scene, or compose artifacts for it. A persisted `rendering` state with no matching active job is reconciled to `stale` after restart.

## Legacy Adoption

When no sidecar exists, preserve all current files but construct every expected artifact as `stale` (or `missing` when absent). Persist the sidecar on the next save or render. The user must explicitly rerender before final composition. No timestamp heuristic may promote a legacy artifact to ready.

## Tests to Write First

- Same normalized inputs produce identical fingerprints despite object key order.
- Voice-only, visual-only, SFX, ordering, and global voice changes match the invalidation matrix.
- A stale dependency prevents composition from becoming ready.
- Missing files override stored `ready` state.
- Sidecar schema rejects raw credential fields and invalid renderer/unit combinations.
- Short-clip rejects non-null composition state; interrupted render state is recovered conservatively.
- A legacy project with existing files but no sidecar reconciles to stale, never ready.

## Acceptance

- Pure tests prove all state transitions.
- Existing renderer schemas remain unchanged.
- No filesystem deletion occurs during reconciliation.

## Implementation Status

- [x] Renderer-neutral contracts and request/response schemas.
- [x] Stable SHA-256 fingerprints for voice, visual, composition, and short-clip inputs.
- [x] Pure invalidation and reconciliation, including legacy and interrupted-render recovery.
- [x] TDD verification: focused Phase 01 tests pass; full project tests and typecheck pass.

## P1 Coverage

Foundation for all four P1 stories.
