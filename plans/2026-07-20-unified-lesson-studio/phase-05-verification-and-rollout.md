# Phase 05: Verification and Rollout

## Objective

Prove compatibility, targeted rerender correctness, and recovery behavior before treating the unified Studio as the default local workflow.

## Planned Changes

- Add migration/reconciliation documentation to `studio/README.md` and user commands to the root README.
- Document `studio-job.json`, status meanings, invalidation rules, and recovery from stale/failed state.
- Add API integration fixtures under temporary output roots; never use or rewrite real `output/` projects in tests.
- Add one legacy HyperFrames fixture, one stateful HyperFrames fixture, and one short-clip fixture.
- Add explicit error messages for unsupported renderer versions and missing generation configuration.
- Verify Windows child-process launch uses `windowsHide: true`, explicit argv, and no shell interpolation.

## Tests to Write First

- Legacy project fixture with existing media and no sidecar reports stale and cannot compose.
- Active render fixture rejects save and exposes a frontend edit lock.
- External source mutation during render fails the completion fingerprint check.
- Local process generator fixture covers success, timeout, malformed JSON, non-zero exit, and secret redaction.
- Short-clip fixture exposes one video unit and no composition artifact.

## Full Verification

1. `npm test`
2. `npm run typecheck`
3. `npm run build`
4. Start `npm run studio` and load a legacy HyperFrames project.
5. Edit one voice, render only that scene, verify unrelated timestamps are unchanged, then compose.
6. Import and render one 12-element short-clip project from Studio.
7. Exercise topic and URL generation with a fake/development adapter; repeat with adapter disabled.
8. Search test output and persisted fixtures for a secret canary.
9. Verify Studio locks scene editing and the server rejects save while a project render is active; separately mutate the script externally and verify the old render remains stale.
10. Restart the Studio server with a persisted `rendering` fixture and verify it recovers to stale/interrupted.

## Rollout Guardrails

- Do not rewrite all legacy projects eagerly.
- Do not delete stale artifacts automatically; a successful render may replace its own target only.
- Keep both existing CLI commands documented as recovery paths.
- If sidecar parsing fails, load the script read-only with an actionable error rather than assuming ready state.

## Acceptance

- All spec success criteria have test evidence.
- Existing tests pass and both CLI entry points remain operational.
- Studio can complete the two renderer smoke flows without manual file edits.

## P1 Coverage

Verification of all P1 stories and compatibility requirements.

## Implementation Status

- [x] Root and Studio READMEs document commands, sidecar states, invalidation, BYOK/local generation, recovery, and CLI fallback paths.
- [x] Legacy, stateful HyperFrames, short-clip, generation, sidecar corruption, save rollback, and lock behavior use temporary output roots in tests.
- [x] Unsupported renderer/version and disabled generator errors are actionable.
- [x] Windows local generator launch verifies explicit argv, `shell: false`, and `windowsHide: true`.
- [x] HyperFrames full-flow integration renders all scenes and composes a ready final video with a fake runner.
- [x] Targeted rerender preserves an unrelated scene file and timestamp.
- [x] Short-clip integration renders a 12-element project as one video unit and persists scoped failures.
- [x] Topic/URL generation, disabled adapter, API key redaction, duplicate request protection, restart recovery, invalid-sidecar read-only, and sub-two-second render acceptance are covered.
- [x] Studio HTTP smoke returned `200` for `/` and `/api/projects` on the running local instance.

Automated browser interaction was unavailable because this Codex session exposed no browser backend. Paid providers, OmniVoice, Chromium, and real media rendering were intentionally not invoked; deterministic integration tests use fake adapters/runners and temporary roots. Final verification: `npm run build`, `npm test` (21 files / 108 tests), and `npm run typecheck` passed; final code review APPROVED at 9/10 with no Critical/High findings.
