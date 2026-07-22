# Phase 04: Project Creation and Source Generation

## Objective

Support both requested entry paths: validated JSON import and topic/URL generation through local or request-scoped BYOK providers.

## Planned Changes

- Upgrade the project dialog with two tabs/modes:
  - Import `script.json` for either supported renderer.
  - Enter a topic or URL and request script generation.
- Make import transactional:
  - parse and validate before creating the project directory;
  - reject duplicate scene IDs and unsupported renderer versions;
  - write script plus initial sidecar atomically per file;
  - remove no existing project on failure.
- Add `src/studio/generation/types.ts` with a provider-neutral `LessonGenerationAdapter` contract.
- Add a disabled adapter, a local process adapter selected from server environment, and HTTP adapters for OpenAI, Claude, and Gemini.
- Configure the process adapter with an explicit executable plus JSON argv; spawn with `shell: false`, send the topic/URL request as JSON, and accept one JSON script response.
- Validate generated output through the same renderer union before any project write.
- Accept provider API keys only in the generation request; keep them in memory for that request and never persist or echo them.
- Store only non-secret generator metadata (`provider`, `model`, request/source ID if available) in the sidecar.
- Redact authorization headers, common key prefixes, and configured secret values from errors/logs.

## Adapter Decision

Keep local process/skill as the server-configured option and add request-scoped BYOK HTTP providers:

- Spawn an explicit executable with `shell: false`.
- Pass fixed argv from parsed JSON configuration rather than shell text.
- Send source/provider metadata through JSON and parse one JSON script response.
- Keep the interface transport-neutral so additional providers can be added later without changing Studio APIs or project schemas.
- OpenAI uses the Responses API with Bearer authentication.
- Claude uses the Messages API with `x-api-key` and `anthropic-version`.
- Gemini uses Generate Content with `x-goog-api-key`.
- Provider/model selection is user-visible; API keys are password inputs and are never stored in browser storage.
- For P1 safety, HTTP adapters pass a URL as source context but do not server-fetch arbitrary URLs; a configured local process may resolve the URL itself. URL retrieval/normalization can be added behind a controlled adapter in a later phase.

## Tests to Write First

- Import valid HyperFrames and short-clip scripts.
- Reject malformed JSON, schema errors, duplicate project names, and unsupported renderers without partial directories.
- A fake local process adapter handles topic and URL inputs and returns a validated project.
- Process launch uses explicit argv and `shell: false`; malformed stdout, timeout, and non-zero exit are surfaced safely.
- Disabled/malformed/failed generator returns a user-visible error without project creation.
- Secret canary does not appear in API response, sidecar, script, output, or captured logs.
- Fake HTTP adapters verify provider-specific headers/body extraction without making paid API calls.

## Acceptance

- Both entry paths work through Studio.
- Generated/imported projects enter the same project list and renderer-specific workspace.
- Raw credentials cross only the active browser-to-local-server request boundary and never cross into project files, logs, API responses, or browser storage.

## Implementation Status

- [x] Import and generation tabs share the Studio project creation flow.
- [x] Import/generation validates the complete renderer document before project creation.
- [x] Local process adapter uses explicit executable/argv, `shell: false`, timeout, and JSON stdin/stdout.
- [x] OpenAI, Claude, and Gemini adapters use request-scoped BYOK credentials and provider-specific authentication headers.
- [x] Sidecar and response security checks exclude raw credentials; diagnostics redact active values and common provider-key prefixes.
- [x] Duplicate scene IDs and malformed/failed/timed-out local generation are covered by regression tests.

P1 project creation is complete. The provider-neutral gateway remains extensible for future providers and scene-revision workflows; persistent credential management, approval diffs, and natural-language scene patching remain out of scope.
