# Brainstorm: Unified Lesson Studio

**Date:** 2026-07-19

## Ideas Explored

- **Renderer-specific Studio:** retain the current HyperFrames-only scene editor. It is small, but cannot serve algorithm short clips or future skill outputs consistently.
- **Unified lesson job:** make a lesson job the primary unit. It owns a source script, renderer type, scenes or a single render unit, artifact state, and final output.
- **Two input modes:** create a lesson script from a topic/URL through a configured generation adapter, or import an existing `script.json` without regeneration.
- **Manual scene editing:** edit scene fields directly in Studio. Validation determines whether voice, a scene clip, or only final composition becomes stale.
- **AI scene rewrite:** accept natural-language requests such as “make scene 3 shorter”. This is valuable, but is deferred until the direct-edit and invalidation flows are reliable.
- **Provider-neutral model gateway:** standardise generation requests behind provider/model/credential references so Claude, OpenAI/Codex/ChatGPT, and Gemini can be added later without changing lesson scripts.

## User's Direction

The user wants Studio to become the control plane for lesson generation and rendering: one future API-key-backed generation flow creates a structured lesson script, skills prepare lesson content, and Studio renders scene plus voice independently. If a scene is wrong, it must be possible to edit it directly and render only the affected artifact. The initial Studio must accept both a topic/URL for script generation and an existing script import. Natural-language AI scene edits and provider-key management are explicitly deferred.

## Open Questions

- The first real generation provider/model is intentionally not selected. Phase 1 uses a server-configured generation adapter and never stores a credential in a project manifest.
- The provider selection and credential UI will be planned only after the lesson-job and targeted rerender workflow is stable.

## Risks

- Invalidating too much causes unnecessary full rerenders; invalidating too little creates inconsistent final videos. Artifact dependencies need explicit rules.
- `ct-short-clip` has an operation timeline rather than ordinary scenes; it needs a one-render-unit adapter so it fits the shared job model without pretending it has editable scenes.
- API keys must never be placed in `script.json`, browser storage, output directories, or render logs.
