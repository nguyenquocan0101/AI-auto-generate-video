# Spec: Unified Lesson Studio

**Date:** 2026-07-19
**Status:** Ready

---

## Problem Statement

The current Studio only manages HyperFrames scripts with scenes, while algorithm short clips use a separate CLI and neither flow has a common lesson-job lifecycle. Lesson creators need one workspace that can start from a topic/URL or an existing script, edit renderable units, and rerender only the voice, scene, or final composition that became stale.

---

## User Stories

- **[P1]** As a lesson creator, I want to create a lesson job from either a topic/URL or an existing `script.json` so that I can begin from generated content or previously prepared content.
  Accepted when: Studio offers both entry points, persists a valid lesson job under `output/`, and rejects malformed imports without writing partial project data.

- **[P1]** As a lesson creator, I want to inspect a lesson job's render units, voice, clips, final output, and status so that I know exactly which artifact is missing, ready, failed, or stale.
  Accepted when: every job exposes a status for each render unit and final composition, and refreshing the page preserves the recorded status derived from available artifacts plus source changes.

- **[P1]** As a lesson creator, I want to edit a HyperFrames scene directly and rerender only the affected artifact so that a wording, visual, or timing correction does not rerender unaffected scenes.
  Accepted when: editing voice-only input marks only voice plus the owning scene and final composition stale; editing visual scene input marks only that scene and final composition stale; rendering one scene leaves unaffected scene artifacts untouched.

- **[P1]** As a lesson creator, I want to open and render a `ct-short-clip` project in the same Studio so that algorithm videos no longer require a separate command-line-only workflow.
  Accepted when: Studio lists a short-clip project, exposes its supported configuration fields, renders it through the dedicated short-clip renderer, and displays its final MP4 as one render unit.

- **[P2]** As a lesson creator, I want to provide a natural-language request for a scene revision so that an AI can propose a structured scene patch for me to apply.
  Accepted when: a proposed patch identifies affected fields and render artifacts before it is applied; this capability is not required in the P1 release.

- **[P1]** As a lesson creator, I want to choose a local, OpenAI, Claude, or Gemini generator and provide a key for one request so that I can create a lesson without configuring a server secret.
  Accepted when: provider/model metadata is represented without storing raw credentials in project files, the key is cleared after the request, and failures do not create a partial project.

- **[P3]** _(out of scope — noted for future)_ As a lesson creator, I want automated visual and narrative review to identify scenes that should be regenerated before final export.

---

## Functional Requirements

1. **FR-01:** Introduce a versioned lesson-job manifest with a renderer discriminator, source metadata, render units, artifact state, and final composition state. Existing HyperFrames scripts must remain loadable without manual migration.
2. **FR-02:** Studio must provide two creation paths: import a supported script JSON, or submit a topic/URL to a server-side lesson-generation adapter. The adapter interface and request-scoped local/OpenAI/Claude/Gemini provider selection are P1; raw keys must never be persisted.
3. **FR-03:** Studio must list and open both `hyperframes` jobs and `ct-short-clip` jobs. HyperFrames exposes its existing scene units; short-clip exposes one dedicated render unit and supported configuration fields only.
4. **FR-04:** Direct edits must be schema-validated before save. The server must calculate and persist affected artifact states as `ready`, `stale`, `rendering`, `failed`, or `missing`.
5. **FR-05:** Studio must support targeted render requests for a HyperFrames scene's voice, scene clip, or final composition, and a dedicated render request for a short-clip render unit.
6. **FR-06:** A final composition request must fail with a clear list of stale or missing prerequisites instead of silently composing inconsistent output.
7. **FR-07:** All render jobs must expose progress and a terminal result in Studio. A failed job must retain a readable error scoped to the requested render unit.
8. **FR-08:** Project manifests, output files, API responses, and render logs must not contain raw API keys. Local generation reads server configuration; BYOK HTTP generation accepts a key only for the active request and clears it from the Studio form afterward.

---

## Non-Functional Requirements

- **Performance:** Studio must return an accepted render job response within 2 seconds and report a terminal status within 2 seconds after the child renderer exits.
- **Security:** No raw credential may be written under `output/`, `studio/`, project manifests, browser local storage, or render logs.
- **Availability:** A failed render unit must not prevent inspection, editing, or targeted rerender of a different unit in the same job.
- **Compatibility:** Existing HyperFrames Studio projects and the existing `npm run short-clip` CLI must continue to work unchanged.

---

## Success Criteria

- [x] An imported HyperFrames project can be opened, one scene can be edited, and only that scene plus final composition become stale.
- [x] A supported topic/URL request can produce a valid lesson-job script through the configured generation adapter, or returns a user-visible adapter error without a partial project.
- [x] A `ct-short-clip` project can be configured and rendered in Studio without invoking the short-clip command manually.
- [x] Rendering a scene leaves all unrelated scene files unchanged, verified by artifact paths and timestamps.
- [x] Final composition is blocked when any required unit is stale or missing and succeeds after required targeted renders complete.
- [x] Automated checks confirm no raw credential value appears in project manifests, Studio API payloads, output files, or captured render diagnostics.

---

## Out of Scope

- Browser UI for entering, persisting, rotating, or selecting API keys.
- Persistent credential management, key rotation, shared server secrets, and remote provider administration.
- Natural-language scene rewrite, patch approval UI, and automated scene-review agents.
- Collaborative multi-user editing, authentication, cloud deployment, or remote job queues.

---

## Assumptions

- P1 uses local Studio and local render execution, matching the current project architecture.
- Local generation can be configured through an explicit executable and JSON argv; BYOK HTTP generation can be supplied per request without a server-persisted credential.
- A short-clip is modelled as one render unit because its deterministic operation trace is generated internally and is not a collection of independently renderable scenes.
- Provider/model selection metadata may be stored as non-secret configuration, but credentials are server-only references.
