import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStudioServer } from "./server.js";

const roots: string[] = [];
const document = {
  version: "1.0" as const,
  renderer: "ct-short-clip" as const,
  algorithm: "selection-sort" as const,
  title: "Generated Selection Sort",
  subtitle: "Chọn phần tử nhỏ nhất",
};

async function setup(adapter: { generate: (...args: any[]) => Promise<any> }, provider: "local" | "openai" = "openai") {
  const root = mkdtempSync(join(tmpdir(), "studio-generation-"));
  roots.push(root);
  const outputRoot = join(root, "output");
  mkdirSync(outputRoot, { recursive: true });
  const server = createStudioServer({
    outputRoot,
    studioRoot: join(root, "studio"),
    generationAdapters: { [provider]: { provider, ...adapter } },
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  return { server, outputRoot, baseUrl: `http://127.0.0.1:${address.port}` };
}

async function post(baseUrl: string, body: unknown) {
  return fetch(`${baseUrl}/api/project/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

function allProjectText(root: string): string {
  if (!existsSync(root)) return "";
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    try { return [readFileSync(path, "utf8")]; } catch { return allProjectText(path); }
  }).join("\n");
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("Studio project generation API", () => {
  it("creates a validated project and persists only non-secret provider metadata", async () => {
    let receivedKey = "";
    const adapter = { generate: async (_input: unknown, credentials: { apiKey: string }) => {
      receivedKey = credentials.apiKey;
      return { document, metadata: { provider: "openai", model: "gpt-test", requestId: "req-1" } };
    } };
    const { server, outputRoot, baseUrl } = await setup(adapter);
    const response = await post(baseUrl, {
      project: "generated",
      source: { kind: "topic", value: "Selection Sort" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "secret-canary" },
      renderer: "ct-short-clip",
    });
    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(receivedKey).toBe("secret-canary");
    expect(JSON.stringify(payload)).not.toContain("secret-canary");
    expect(allProjectText(join(outputRoot, "generated"))).not.toContain("secret-canary");
    const sidecar = JSON.parse(readFileSync(join(outputRoot, "generated", "studio-job.json"), "utf8"));
    expect(sidecar.source).toMatchObject({ provider: "openai", model: "gpt-test" });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("redacts failed credentials and leaves no partial project directory", async () => {
    const adapter = { generate: async () => { throw new Error("provider rejected secret-canary"); } };
    const { server, outputRoot, baseUrl } = await setup(adapter);
    const response = await post(baseUrl, {
      project: "failed",
      source: { kind: "url", value: "https://example.com/lesson" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "secret-canary" },
      renderer: "hyperframes",
    });
    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain("secret-canary");
    expect(existsSync(join(outputRoot, "failed"))).toBe(false);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects a generated renderer that does not match the request", async () => {
    const adapter = { generate: async () => ({ document, metadata: { provider: "openai", model: "gpt-test" } }) };
    const { server, outputRoot, baseUrl } = await setup(adapter);
    const response = await post(baseUrl, {
      project: "mismatch",
      source: { kind: "topic", value: "Selection Sort" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "secret-canary" },
      renderer: "hyperframes",
    });

    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain("secret-canary");
    expect(existsSync(join(outputRoot, "mismatch"))).toBe(false);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects credential-like adapter metadata before writing or echoing it", async () => {
    const adapter = { generate: async () => ({ document, metadata: { provider: "openai", model: "gpt-test", apiKey: "secret-canary" } }) };
    const { server, outputRoot, baseUrl } = await setup(adapter);
    const response = await post(baseUrl, {
      project: "unsafe-metadata",
      source: { kind: "topic", value: "Selection Sort" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "request-key" },
      renderer: "ct-short-clip",
    });

    expect(response.status).toBe(400);
    expect(JSON.stringify(await response.json())).not.toContain("request-key");
    expect(existsSync(join(outputRoot, "unsafe-metadata"))).toBe(false);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("checks duplicate project names before calling a paid provider", async () => {
    let calls = 0;
    const adapter = { generate: async () => {
      calls += 1;
      return { document, metadata: { provider: "openai", model: "gpt-test" } };
    } };
    const { server, baseUrl } = await setup(adapter);
    const body = {
      project: "duplicate",
      source: { kind: "topic", value: "Selection Sort" },
      generation: { provider: "openai", model: "gpt-test", apiKey: "request-key" },
      renderer: "ct-short-clip",
    };
    expect((await post(baseUrl, body)).status).toBe(201);
    expect((await post(baseUrl, body)).status).toBe(400);
    expect(calls).toBe(1);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("routes both topic and URL sources through a configured local adapter", async () => {
    const sourceKinds: string[] = [];
    const adapter = { generate: async (input: { source: { kind: string } }) => {
      sourceKinds.push(input.source.kind);
      return { document, metadata: { provider: "local" } };
    } };
    const { server, baseUrl } = await setup(adapter, "local");
    const base = { generation: { provider: "local" }, renderer: "ct-short-clip" };
    const topic = await post(baseUrl, { ...base, project: "local-topic", source: { kind: "topic", value: "Selection Sort" } });
    const url = await post(baseUrl, { ...base, project: "local-url", source: { kind: "url", value: "https://example.com/selection-sort" } });

    expect(topic.status).toBe(201);
    expect(url.status).toBe(201);
    expect(sourceKinds).toEqual(["topic", "url"]);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("returns a clear disabled-local error without creating a project", async () => {
    const { server, outputRoot, baseUrl } = await setup({ generate: async () => ({ document, metadata: { provider: "openai" } }) });
    const response = await post(baseUrl, {
      project: "local-disabled",
      source: { kind: "topic", value: "Selection Sort" },
      generation: { provider: "local" },
      renderer: "ct-short-clip",
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Local generation is not configured");
    expect(existsSync(join(outputRoot, "local-disabled"))).toBe(false);
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
});
