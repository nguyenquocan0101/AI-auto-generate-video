import { describe, expect, it, vi } from "vitest";
import {
  createClaudeGenerationAdapter,
  createGeminiGenerationAdapter,
  createOpenAIGenerationAdapter,
  redactSecrets,
} from "./provider-adapters.js";

const generated = {
  version: "1.0",
  renderer: "ct-short-clip",
  algorithm: "selection-sort",
  title: "Selection Sort",
  subtitle: "Chọn phần tử nhỏ nhất",
};

const input = {
  source: { kind: "topic" as const, value: "Selection Sort cho học sinh cấp 2" },
  renderer: "ct-short-clip" as const,
};

describe("BYOK generation provider adapters", () => {
  it("calls OpenAI Responses API with request-scoped bearer auth", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ output_text: JSON.stringify(generated) }), { status: 200 }));
    const adapter = createOpenAIGenerationAdapter({ fetchImpl });
    const result = await adapter.generate(input, { apiKey: "openai-canary", model: "gpt-test" });
    const [url, request] = (fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(new Headers(request?.headers).get("authorization")).toBe("Bearer openai-canary");
    expect(JSON.parse(String(request?.body))).toMatchObject({ model: "gpt-test" });
    expect(result.document.renderer).toBe("ct-short-clip");
  });

  it("calls Claude Messages API with x-api-key and version headers", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify(generated) }] }), { status: 200 }));
    const adapter = createClaudeGenerationAdapter({ fetchImpl });
    await adapter.generate(input, { apiKey: "claude-canary", model: "claude-test" });
    const [url, request] = (fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    const headers = new Headers(request?.headers);
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(headers.get("x-api-key")).toBe("claude-canary");
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
  });

  it("calls Gemini Generate Content with x-goog-api-key", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: `\u0060\u0060\u0060json\n${JSON.stringify(generated)}\n\u0060\u0060\u0060` }] } }] }), { status: 200 }));
    const adapter = createGeminiGenerationAdapter({ fetchImpl });
    const result = await adapter.generate(input, { apiKey: "gemini-canary", model: "gemini-test" });
    const [url, request] = (fetchImpl.mock.calls as unknown as Array<[string, RequestInit]>)[0];
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent");
    expect(new Headers(request?.headers).get("x-goog-api-key")).toBe("gemini-canary");
    expect(result.document.renderer).toBe("ct-short-clip");
    if (result.document.renderer !== "ct-short-clip") throw new Error("expected short clip");
    expect(result.document.title).toBe("Selection Sort");
  });

  it("redacts the active credential from provider errors", async () => {
    const fetchImpl = vi.fn(async () => new Response("invalid key secret-canary", { status: 401 }));
    const adapter = createOpenAIGenerationAdapter({ fetchImpl });
    await expect(adapter.generate(input, { apiKey: "secret-canary", model: "gpt-test" }))
      .rejects.not.toThrow("secret-canary");
  });

  it("redacts common provider key prefixes from local/provider diagnostics", () => {
    const message = "keys: sk-proj-abcdefghijklmnopqrstuvwxyz, sk-ant-abcdefghijklmnopqrstuvwxyz, AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ123456";
    const redacted = redactSecrets(message);
    expect(redacted).not.toContain("sk-proj-");
    expect(redacted).not.toContain("sk-ant-");
    expect(redacted).not.toContain("AIzaSy");
  });
});
