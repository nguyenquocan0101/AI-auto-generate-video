import { parseStudioDocument } from "../contracts.js";
import type {
  EphemeralCredentials,
  GenerationInput,
  GenerationProvider,
  GenerationResult,
  LessonGenerationAdapter,
} from "./types.js";

type FetchImplementation = typeof fetch;

interface ProviderAdapterOptions {
  fetchImpl?: FetchImplementation;
  timeoutMs?: number;
}

export function redactSecrets(value: string, secrets: Array<string | undefined> = []): string {
  let redacted = value
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, "$1[REDACTED]")
    .replace(/((?:api[_-]?key|x-api-key|x-goog-api-key|token|secret)\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]")
    .replace(/\bAIza[A-Za-z0-9_-]{20,}\b/g, "[REDACTED]");
  for (const secret of secrets.filter((item): item is string => Boolean(item))) {
    redacted = redacted.split(secret).join("[REDACTED]");
  }
  return redacted.slice(-3000);
}

function promptFor(input: GenerationInput): string {
  const rendererShape = input.renderer === "ct-short-clip"
    ? `Return a ct-short-clip JSON object with version "1.0", renderer "ct-short-clip", a supported sorting algorithm, Vietnamese title/subtitle, seed, optional duration_sec (20-60), optional initial_values (12-50 numbers), and sound settings.`
    : `Return a HyperFrames JSON object with version "1.0", renderer "hyperframes", metadata, voice, aspect, and 3-24 scenes. The first scene must be type "hook", the last "outro", and every scene needs a unique id, voiceText, templateId, and inputs.`;
  return [
    "You generate deterministic Vietnamese lesson-video scripts.",
    rendererShape,
    `Source kind: ${input.source.kind}`,
    `Source value: ${input.source.value}`,
    "Return exactly one JSON object. Do not use Markdown or explanatory text.",
  ].join("\n");
}

function jsonText(value: string): string {
  const trimmed = value.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced?.[1] ?? trimmed;
}

function parseGenerated(value: string) {
  return parseStudioDocument(JSON.parse(jsonText(value)));
}

function requireCredentials(credentials: EphemeralCredentials, defaultModel: string): { apiKey: string; model: string } {
  if (!credentials.apiKey?.trim()) throw new Error("API key is required for this provider");
  return { apiKey: credentials.apiKey, model: credentials.model?.trim() || defaultModel };
}

async function readProviderResponse(response: Response, apiKey: string): Promise<any> {
  const text = await response.text();
  if (!response.ok) throw new Error(`Provider request failed (${response.status}): ${redactSecrets(text, [apiKey])}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Provider returned malformed JSON");
  }
}

function requestSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function adapter(
  provider: GenerationProvider,
  defaultModel: string,
  options: ProviderAdapterOptions,
  invoke: (fetchImpl: FetchImplementation, input: GenerationInput, auth: { apiKey: string; model: string }, signal: AbortSignal) => Promise<{ text: string; requestId?: string }>,
): LessonGenerationAdapter {
  const fetchImpl = options.fetchImpl ?? fetch;
  const timeoutMs = options.timeoutMs ?? 90_000;
  return {
    provider,
    async generate(input, credentials): Promise<GenerationResult> {
      const auth = requireCredentials(credentials, defaultModel);
      try {
        const output = await invoke(fetchImpl, input, auth, requestSignal(timeoutMs));
        return {
          document: parseGenerated(output.text),
          metadata: { provider, model: auth.model, ...(output.requestId ? { requestId: output.requestId } : {}) },
        };
      } catch (error) {
        const message = redactSecrets(error instanceof Error ? error.message : String(error), [auth.apiKey]);
        throw new Error(message);
      }
    },
  };
}

function openAIText(payload: any): string {
  if (typeof payload.output_text === "string") return payload.output_text;
  const values = payload.output?.flatMap((item: any) => item.content ?? []).map((item: any) => item.text).filter((item: unknown) => typeof item === "string") ?? [];
  if (!values.length) throw new Error("OpenAI response did not contain text output");
  return values.join("\n");
}

export function createOpenAIGenerationAdapter(options: ProviderAdapterOptions = {}): LessonGenerationAdapter {
  return adapter("openai", "gpt-5.6-terra", options, async (fetchImpl, input, auth, signal) => {
    const response = await fetchImpl("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${auth.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: auth.model, input: promptFor(input) }),
      signal,
    });
    const payload = await readProviderResponse(response, auth.apiKey);
    return { text: openAIText(payload), requestId: response.headers.get("x-request-id") ?? undefined };
  });
}

export function createClaudeGenerationAdapter(options: ProviderAdapterOptions = {}): LessonGenerationAdapter {
  return adapter("claude", "claude-opus-4-8", options, async (fetchImpl, input, auth, signal) => {
    const response = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": auth.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: auth.model, max_tokens: 8192, messages: [{ role: "user", content: promptFor(input) }] }),
      signal,
    });
    const payload = await readProviderResponse(response, auth.apiKey);
    const text = payload.content?.filter((item: any) => item.type === "text").map((item: any) => item.text).join("\n");
    if (!text) throw new Error("Claude response did not contain text output");
    return { text, requestId: response.headers.get("request-id") ?? undefined };
  });
}

export function createGeminiGenerationAdapter(options: ProviderAdapterOptions = {}): LessonGenerationAdapter {
  return adapter("gemini", "gemini-3.5-flash", options, async (fetchImpl, input, auth, signal) => {
    const model = encodeURIComponent(auth.model);
    const response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "x-goog-api-key": auth.apiKey, "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: promptFor(input) }] }] }),
      signal,
    });
    const payload = await readProviderResponse(response, auth.apiKey);
    const text = payload.candidates?.[0]?.content?.parts?.map((part: any) => part.text).filter(Boolean).join("\n");
    if (!text) throw new Error("Gemini response did not contain text output");
    return { text, requestId: response.headers.get("x-request-id") ?? undefined };
  });
}
