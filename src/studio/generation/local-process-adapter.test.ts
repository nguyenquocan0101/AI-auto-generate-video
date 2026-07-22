import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { createDisabledGenerationAdapter, createLocalProcessGenerationAdapter } from "./local-process-adapter.js";

const output = {
  version: "1.0",
  renderer: "ct-short-clip",
  algorithm: "selection-sort",
  title: "Local Selection Sort",
  subtitle: "test",
};

function fakeChild() {
  const child = new EventEmitter() as any;
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = vi.fn();
  return child;
}

describe("local process generation adapter", () => {
  it("uses explicit argv, shell=false, and one JSON stdin/stdout exchange", async () => {
    const child = fakeChild();
    let stdin = "";
    child.stdin.on("data", (chunk: Buffer) => { stdin += chunk.toString(); });
    child.stdin.on("finish", () => {
      child.stdout.write(JSON.stringify(output));
      child.stdout.end();
      queueMicrotask(() => child.emit("close", 0));
    });
    const spawnImpl = vi.fn(() => child);
    const adapter = createLocalProcessGenerationAdapter({ executable: "node", args: ["generator.mjs", "--json"], spawnImpl: spawnImpl as any });
    const result = await adapter.generate({ source: { kind: "topic", value: "Selection Sort" }, renderer: "ct-short-clip" }, {});
    expect(spawnImpl).toHaveBeenCalledWith("node", ["generator.mjs", "--json"], expect.objectContaining({ shell: false, stdio: "pipe", windowsHide: true }));
    expect(JSON.parse(stdin)).toEqual({ source: { kind: "topic", value: "Selection Sort" }, renderer: "ct-short-clip" });
    expect(result.document.renderer).toBe("ct-short-clip");
  });

  it("returns a clear error when local generation is disabled", async () => {
    await expect(createDisabledGenerationAdapter().generate({ source: { kind: "topic", value: "x" }, renderer: "hyperframes" }, {}))
      .rejects.toThrow("not configured");
  });

  it("rejects malformed stdout", async () => {
    const child = fakeChild();
    child.stdin.on("finish", () => {
      child.stdout.end("not-json");
      queueMicrotask(() => child.emit("close", 0));
    });
    const adapter = createLocalProcessGenerationAdapter({ executable: "generator", spawnImpl: vi.fn(() => child) as any });

    await expect(adapter.generate({ source: { kind: "url", value: "https://example.com" }, renderer: "hyperframes" }, {}))
      .rejects.toThrow("malformed or invalid");
  });

  it("surfaces a non-zero exit without exposing common provider keys", async () => {
    const child = fakeChild();
    child.stdin.on("finish", () => {
      child.stderr.end("failed with sk-proj-abcdefghijklmnopqrstuvwxyz");
      queueMicrotask(() => child.emit("close", 2));
    });
    const adapter = createLocalProcessGenerationAdapter({ executable: "generator", spawnImpl: vi.fn(() => child) as any });

    const failure = adapter.generate({ source: { kind: "topic", value: "sorting" }, renderer: "ct-short-clip" }, {});
    await expect(failure).rejects.toThrow("failed with");
    await expect(failure).rejects.not.toThrow("sk-proj-");
  });

  it("kills and rejects a timed-out process", async () => {
    const child = fakeChild();
    const adapter = createLocalProcessGenerationAdapter({ executable: "generator", timeoutMs: 5, spawnImpl: vi.fn(() => child) as any });

    await expect(adapter.generate({ source: { kind: "topic", value: "sorting" }, renderer: "ct-short-clip" }, {}))
      .rejects.toThrow("timed out");
    expect(child.kill).toHaveBeenCalledOnce();
  });

  it("handles stdin errors without an uncaught stream exception", async () => {
    const child = fakeChild();
    const adapter = createLocalProcessGenerationAdapter({ executable: "generator", spawnImpl: vi.fn(() => child) as any });
    const failure = adapter.generate({ source: { kind: "topic", value: "sorting" }, renderer: "ct-short-clip" }, {});
    queueMicrotask(() => child.stdin.emit("error", new Error("EPIPE")));

    await expect(failure).rejects.toThrow("stdin failed");
  });
});
