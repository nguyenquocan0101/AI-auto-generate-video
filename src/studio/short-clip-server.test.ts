import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStudioServer } from "./server.js";
import type { ShortClipSpec } from "../short-clip/schema.js";

const roots: string[] = [];

function spec(): ShortClipSpec {
  return {
    version: "1.0",
    renderer: "ct-short-clip",
    algorithm: "selection-sort",
    title: "Selection Sort",
    subtitle: "Chọn phần tử nhỏ nhất",
    seed: 42,
    initial_values: Array.from({ length: 12 }, (_, index) => 12 - index),
    sound: { enabled: true, compare_hz: 500, compare_ms: 28, swap_hz: 900, swap_ms: 48, gain: 0.16 },
  };
}

async function setup(render = async ({ projectRoot, reportProgress }: { projectRoot: string; reportProgress: (percent: number, message: string) => void }) => {
  reportProgress(40, "short clip timeline");
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(join(projectRoot, "video.mp4"), "short-video");
  reportProgress(100, "short clip ready");
}) {
  const root = mkdtempSync(join(tmpdir(), "studio-short-clip-"));
  roots.push(root);
  const outputRoot = join(root, "output");
  mkdirSync(outputRoot, { recursive: true });
  const server = createStudioServer({
    outputRoot,
    studioRoot: join(root, "studio"),
    shortClipAdapter: {
      renderer: "ct-short-clip",
      validate: (value: unknown) => value as ReturnType<typeof spec>,
      inspect: (value: ReturnType<typeof spec>) => ({ id: "short-clip", title: value.title, algorithm: value.algorithm, valueCount: value.initial_values?.length ?? 12, durationSec: value.duration_sec }),
      render,
    },
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  return { server, baseUrl: `http://127.0.0.1:${address.port}`, outputRoot };
}

async function request(baseUrl: string, path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
}

async function waitForJob(baseUrl: string, jobId: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    const job = await (await request(baseUrl, `/api/jobs/${jobId}`)).json();
    if (job.status !== "running") return job;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("job did not finish in time");
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("short-clip Studio workspace API", () => {
  it("lists and loads short-clip as one video unit without HyperFrames composition", async () => {
    const { server, baseUrl } = await setup();
    const create = await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "selection", script: spec() }) });
    expect(create.status).toBe(201);
    const project = await (await request(baseUrl, "/api/project?name=selection")).json();
    expect(project.renderer).toBe("ct-short-clip");
    expect(project.job.units).toHaveLength(1);
    expect(project.job.units[0].kind).toBe("short-clip");
    expect(project.job.composition).toBeNull();
    expect(project.assets.finalVideo).toBe("");
    const list = await (await request(baseUrl, "/api/projects")).json();
    expect(list.projects[0]).toMatchObject({ renderer: "ct-short-clip", unitCount: 1, finalVideo: "" });
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("marks a valid edit stale and rejects invalid values without overwriting script", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "edit", script: spec() }) });
    const changed = { ...spec(), title: "Selection Sort Updated" };
    const saved = await request(baseUrl, "/api/project/save", { method: "POST", body: JSON.stringify({ project: "edit", script: changed }) });
    expect(saved.status).toBe(200);
    expect((await saved.json()).job.units[0].artifacts.video.status).toBe("stale");
    const invalid = { ...changed, duration_sec: 19 };
    const rejected = await request(baseUrl, "/api/project/save", { method: "POST", body: JSON.stringify({ project: "edit", script: invalid }) });
    expect(rejected.status).toBe(400);
    expect((await rejected.json()).fields.some((issue: { path: string[] }) => issue.path.includes("duration_sec"))).toBe(true);
    expect(JSON.parse(readFileSync(join(outputRoot, "edit", "script.json"), "utf8")).title).toBe("Selection Sort Updated");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("dispatches render to the short-clip adapter and records ready output", async () => {
    const { server, baseUrl } = await setup();
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "render", script: spec() }) });
    const response = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "render", mode: "video" }) });
    expect(response.status).toBe(202);
    const job = await waitForJob(baseUrl, (await response.json()).jobId);
    expect(job.status).toBe("done");
    expect(job.progress).toBe(100);
    const project = await (await request(baseUrl, "/api/project?name=render")).json();
    expect(project.job.units[0].artifacts.video.status).toBe("ready");
    expect(project.job.composition).toBeNull();
    expect(project.assets.finalVideo).toContain("/media/render/video.mp4");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("records a failed short-clip unit when its renderer throws", async () => {
    const { server, baseUrl } = await setup(async () => { throw new Error("short clip failed"); });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "failed", script: spec() }) });
    const response = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "failed", mode: "video" }) });
    const job = await waitForJob(baseUrl, (await response.json()).jobId);
    expect(job.status).toBe("error");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const project = await (await request(baseUrl, "/api/project?name=failed")).json();
    expect(project.job.units[0].artifacts.video.status).toBe("failed");
    expect(project.job.units[0].artifacts.video.error.message).toContain("short clip failed");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
});
