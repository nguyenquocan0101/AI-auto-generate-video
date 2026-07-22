import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ProjectStore } from "./project-store.js";

const roots: string[] = [];

function script(title = "Demo") {
  return {
    version: "1.0",
    renderer: "hyperframes",
    metadata: { title, source: { url: "", domain: "", image: null }, channel: "ChuyenTin" },
    voice: { provider: "omnivoice", speed: 1 },
    aspect: "9:16",
    scenes: [
      { id: "s1", type: "hook", voiceText: "Hook", templateId: "frame", inputs: {} },
      { id: "s2", type: "body", voiceText: "Body", templateId: "frame", inputs: {} },
      { id: "s3", type: "outro", voiceText: "Outro", templateId: "frame", inputs: {} },
    ],
  };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("ProjectStore save recovery", () => {
  it("restores the previous script when a later graph write fails", () => {
    const root = mkdtempSync(join(tmpdir(), "studio-store-"));
    roots.push(root);
    const store = new ProjectStore({ outputRoot: root });
    store.create("demo", script());
    store.save({ project: "demo", script: script(), graph: { layout: "original" } });
    const projectRoot = join(root, "demo");
    const originalGraph = readFileSync(join(projectRoot, "studio-graph.json"), "utf8");
    const originalSidecar = readFileSync(join(projectRoot, "studio-job.json"), "utf8");

    expect(() => store.save({ project: "demo", script: script("Changed"), graph: { invalid: BigInt(1) } })).toThrow();
    expect(JSON.parse(readFileSync(join(projectRoot, "script.json"), "utf8")).metadata.title).toBe("Demo");
    expect(readFileSync(join(projectRoot, "studio-graph.json"), "utf8")).toBe(originalGraph);
    expect(readFileSync(join(projectRoot, "studio-job.json"), "utf8")).toBe(originalSidecar);
    expect(existsSync(join(projectRoot, "script.json.tmp"))).toBe(false);
    expect(existsSync(join(projectRoot, "studio-graph.json.tmp"))).toBe(false);
    expect(existsSync(join(projectRoot, "studio-job.json.tmp"))).toBe(false);
  });
});
