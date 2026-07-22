import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStudioServer } from "./server.js";

const roots: string[] = [];

function script(title = "Demo") {
  return {
    version: "1.0",
    renderer: "hyperframes",
    metadata: {
      title,
      source: { url: "", domain: "", image: null },
      channel: "ChuyenTin",
    },
    voice: { provider: "omnivoice", speed: 1 },
    aspect: "9:16",
    scenes: [
      { id: "s1", type: "hook", voiceText: "Hook", templateId: "frame", inputs: {} },
      { id: "s2", type: "body", voiceText: "Body", templateId: "frame", inputs: { text: "body" } },
      { id: "s3", type: "outro", voiceText: "Outro", templateId: "frame", inputs: {} },
    ],
  };
}

async function setup(options: Record<string, unknown> = {}) {
  const root = mkdtempSync(join(tmpdir(), "studio-phase-02-"));
  roots.push(root);
  const outputRoot = join(root, "output");
  const studioRoot = join(root, "studio");
  mkdirSync(outputRoot, { recursive: true });
  const server = createStudioServer({ outputRoot, studioRoot, ...options });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  return { server, baseUrl: `http://127.0.0.1:${address.port}`, outputRoot };
}

async function request(baseUrl: string, path: string, init?: RequestInit) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
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

describe("Studio server orchestration", () => {
  it("keeps create/get/list compatibility and returns durable artifact state", async () => {
    const { server, baseUrl } = await setup();
    const create = await request(baseUrl, "/api/project/create", {
      method: "POST",
      body: JSON.stringify({ project: "demo", script: script() }),
    });
    expect(create.status).toBe(201);

    const project = await request(baseUrl, "/api/project?name=demo");
    const payload = await project.json();
    expect(project.status).toBe(200);
    expect(payload.script.renderer).toBe("hyperframes");
    expect(payload.renderer).toBe("hyperframes");
    expect(payload.job.units).toHaveLength(3);
    expect(payload.job.units[0].artifacts.voice.status).toBe("missing");

    const projects = await request(baseUrl, "/api/projects");
    expect((await projects.json()).projects[0].id).toBe("demo");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects malformed and unsupported imports without creating partial projects", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    const malformed = await request(baseUrl, "/api/project/create", {
      method: "POST",
      body: JSON.stringify({ project: "malformed", script: { renderer: "hyperframes" } }),
    });
    const unsupported = await request(baseUrl, "/api/project/create", {
      method: "POST",
      body: JSON.stringify({ project: "unsupported", script: { version: "1.0", renderer: "unknown" } }),
    });

    expect(malformed.status).toBe(400);
    expect(unsupported.status).toBe(400);
    expect((await unsupported.json()).error).toContain("Unsupported renderer");
    expect(() => readFileSync(join(outputRoot, "malformed", "script.json"))).toThrow();
    expect(() => readFileSync(join(outputRoot, "unsupported", "script.json"))).toThrow();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("returns an actionable error for unsupported script versions", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    const unsupported = script();
    unsupported.version = "2.0";
    const response = await request(baseUrl, "/api/project/create", {
      method: "POST",
      body: JSON.stringify({ project: "future-version", script: unsupported }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain("Unsupported hyperframes script version");
    expect(() => readFileSync(join(outputRoot, "future-version", "script.json"))).toThrow();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects credential-like import source fields before writing a sidecar", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    const response = await request(baseUrl, "/api/project/create", {
      method: "POST",
      body: JSON.stringify({ project: "unsafe-source", script: script(), source: { kind: "import", value: "manual", apiKey: "secret-canary" } }),
    });

    expect(response.status).toBe(400);
    expect(() => readFileSync(join(outputRoot, "unsafe-source", "studio-job.json"))).toThrow();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("adopts a legacy HyperFrames project as stale without using timestamps", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    const projectRoot = join(outputRoot, "legacy");
    mkdirSync(join(projectRoot, "voice"), { recursive: true });
    mkdirSync(join(projectRoot, "clips"), { recursive: true });
    writeFileSync(join(projectRoot, "script.json"), JSON.stringify(script("Legacy")));
    writeFileSync(join(projectRoot, "voice", "scene-s1-old.mp3"), "voice");
    writeFileSync(join(projectRoot, "clips", "scene-s1.mp4"), "video");
    writeFileSync(join(projectRoot, "video.mp4"), "final");

    const response = await request(baseUrl, "/api/project?name=legacy");
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.job.units[0].artifacts.voice.status).toBe("stale");
    expect(payload.job.units[0].artifacts.video.status).toBe("stale");
    expect(payload.job.composition.status).toBe("stale");
    const compose = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "legacy", mode: "compose" }) });
    expect(compose.status).toBe(409);
    expect((await compose.json()).prerequisites).toContain("s1:voice");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("persists orphaned rendering recovery after a server restart", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "restart", script: script() }) });
    const sidecarPath = join(outputRoot, "restart", "studio-job.json");
    const sidecar = JSON.parse(readFileSync(sidecarPath, "utf8"));
    sidecar.units[1].artifacts.video.status = "rendering";
    writeFileSync(sidecarPath, JSON.stringify(sidecar));
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

    const restarted = await setup({ outputRoot, studioRoot: join(outputRoot, "..", "studio") });
    const project = await request(restarted.baseUrl, "/api/project?name=restart");
    const payload = await project.json();
    expect(payload.job.units[1].artifacts.video.status).toBe("stale");
    expect(JSON.parse(readFileSync(sidecarPath, "utf8")).units[1].artifacts.video.status).toBe("stale");
    await new Promise<void>((resolve, reject) => restarted.server.close((error) => error ? reject(error) : resolve()));
  });

  it("opens an invalid sidecar read-only with an actionable recovery warning", async () => {
    const { server, baseUrl, outputRoot } = await setup();
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "invalid-sidecar", script: script() }) });
    const sidecarPath = join(outputRoot, "invalid-sidecar", "studio-job.json");
    writeFileSync(sidecarPath, "{ invalid json", "utf8");

    const projectResponse = await request(baseUrl, "/api/project?name=invalid-sidecar");
    const project = await projectResponse.json();
    expect(projectResponse.status).toBe(200);
    expect(project.readOnly).toBe(true);
    expect(project.warnings[0]).toContain("studio-job.json is invalid");

    const save = await request(baseUrl, "/api/project/save", {
      method: "POST",
      body: JSON.stringify({ project: "invalid-sidecar", script: script("Do not save") }),
    });
    const render = await request(baseUrl, "/api/render", {
      method: "POST",
      body: JSON.stringify({ project: "invalid-sidecar", mode: "video", sceneId: "s2" }),
    });
    expect(save.status).toBe(409);
    expect((await save.json()).error).toContain("repair or move");
    expect(render.status).toBe(409);
    expect(readFileSync(sidecarPath, "utf8")).toBe("{ invalid json");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("rejects save while a project render is active and leaves script unchanged", async () => {
    let release!: () => void;
    const renderGate = new Promise<void>((resolve) => { release = resolve; });
    const { server, baseUrl, outputRoot } = await setup({ runner: () => renderGate });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "locked", script: script() }) });
    const renderStartedAt = Date.now();
    const render = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "locked", mode: "scene", sceneId: "s2" }) });
    expect(render.status).toBe(202);
    expect(Date.now() - renderStartedAt).toBeLessThan(2_000);
    const sidecarBeforeSecondRender = readFileSync(join(outputRoot, "locked", "studio-job.json"), "utf8");
    const secondRender = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "locked", mode: "video", sceneId: "s2" }) });
    expect(secondRender.status).toBe(409);
    expect(readFileSync(join(outputRoot, "locked", "studio-job.json"), "utf8")).toBe(sidecarBeforeSecondRender);

    const save = await request(baseUrl, "/api/project/save", {
      method: "POST",
      body: JSON.stringify({ project: "locked", script: script("Should Not Save") }),
    });
    expect(save.status).toBe(409);
    expect(JSON.parse(readFileSync(join(outputRoot, "locked", "script.json"), "utf8")).metadata.title).toBe("Demo");

    release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("blocks compose with scoped prerequisites while units are not ready", async () => {
    const { server, baseUrl } = await setup();
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "blocked", script: script() }) });
    const compose = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "blocked", mode: "compose" }) });
    const payload = await compose.json();
    expect(compose.status).toBe(409);
    expect(payload.prerequisites).toContain("s1:voice");
    expect(payload.prerequisites).toContain("s2:video");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("renders all HyperFrames scenes and then composes a ready final video", async () => {
    const { server, baseUrl } = await setup({ runner: async ({ projectRoot, mode, sceneId }: { projectRoot: string; mode: string; sceneId?: string }) => {
      if (mode === "compose") {
        writeFileSync(join(projectRoot, "video.mp4"), "composed-video");
        return;
      }
      mkdirSync(join(projectRoot, "voice"), { recursive: true });
      mkdirSync(join(projectRoot, "clips"), { recursive: true });
      writeFileSync(join(projectRoot, "voice", `scene-${sceneId}-render.mp3`), "voice");
      writeFileSync(join(projectRoot, "clips", `scene-${sceneId}.mp4`), "video");
    } });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "full-flow", script: script() }) });
    for (const sceneId of ["s1", "s2", "s3"]) {
      const render = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "full-flow", mode: "scene", sceneId }) });
      expect((await waitForJob(baseUrl, (await render.json()).jobId)).status).toBe("done");
    }
    const compose = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "full-flow", mode: "compose" }) });
    expect(compose.status).toBe(202);
    expect((await waitForJob(baseUrl, (await compose.json()).jobId)).status).toBe("done");

    const project = await (await request(baseUrl, "/api/project?name=full-flow")).json();
    expect(project.job.units.every((unit: { artifacts: { voice: { status: string }; video: { status: string } } }) => unit.artifacts.voice.status === "ready" && unit.artifacts.video.status === "ready")).toBe(true);
    expect(project.job.composition.status).toBe("ready");
    expect(project.assets.finalVideo).toContain("/media/full-flow/video.mp4");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("invalidates only voice and fitted video for a voice-only save", async () => {
    const { server, baseUrl } = await setup({ runner: async ({ projectRoot, sceneId }: { projectRoot: string; sceneId?: string }) => {
      mkdirSync(join(projectRoot, "voice"), { recursive: true });
      mkdirSync(join(projectRoot, "clips"), { recursive: true });
      writeFileSync(join(projectRoot, "voice", `scene-${sceneId}-render.mp3`), "voice");
      writeFileSync(join(projectRoot, "clips", `scene-${sceneId}.mp4`), "video");
    } });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "invalidate-voice", script: script() }) });
    const render = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "invalidate-voice", mode: "scene", sceneId: "s2" }) });
    await waitForJob(baseUrl, (await render.json()).jobId);
    const changed = script();
    changed.scenes[1].voiceText = "Changed narration";
    const save = await request(baseUrl, "/api/project/save", { method: "POST", body: JSON.stringify({ project: "invalidate-voice", script: changed }) });
    const payload = await save.json();
    const scene = payload.job.units.find((unit: { id: string }) => unit.id === "s2");
    expect(save.status).toBe(200);
    expect(scene.artifacts.voice.status).toBe("stale");
    expect(scene.artifacts.video.status).toBe("stale");
    expect(payload.job.composition.status).toBe("stale");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("renders one requested scene without touching an unrelated scene file", async () => {
    let renderedScene = "";
    const { server, baseUrl, outputRoot } = await setup({ runner: async ({ projectRoot, sceneId }: { projectRoot: string; sceneId?: string }) => {
      renderedScene = sceneId ?? "";
      mkdirSync(join(projectRoot, "clips"), { recursive: true });
      writeFileSync(join(projectRoot, "clips", `scene-${sceneId}.mp4`), "target-render");
    } });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "targeted", script: script() }) });
    const unrelatedPath = join(outputRoot, "targeted", "clips", "scene-s1.mp4");
    mkdirSync(join(outputRoot, "targeted", "clips"), { recursive: true });
    writeFileSync(unrelatedPath, "unrelated");
    const unrelatedMtime = statSync(unrelatedPath).mtimeMs;

    const render = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "targeted", mode: "video", sceneId: "s2" }) });
    await waitForJob(baseUrl, (await render.json()).jobId);

    expect(renderedScene).toBe("s2");
    expect(statSync(unrelatedPath).mtimeMs).toBe(unrelatedMtime);
    expect(readFileSync(unrelatedPath, "utf8")).toBe("unrelated");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("keeps voice ready for a visual-only save and scopes failed errors", async () => {
    let shouldFail = false;
    const { server, baseUrl } = await setup({ runner: async ({ projectRoot, sceneId }: { projectRoot: string; sceneId?: string }) => {
      if (shouldFail) throw new Error("apiKey=secret Bearer abc123");
      mkdirSync(join(projectRoot, "voice"), { recursive: true });
      mkdirSync(join(projectRoot, "clips"), { recursive: true });
      writeFileSync(join(projectRoot, "voice", `scene-${sceneId}-render.mp3`), "voice");
      writeFileSync(join(projectRoot, "clips", `scene-${sceneId}.mp4`), "video");
    } });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "invalidate-visual", script: script() }) });
    const first = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "invalidate-visual", mode: "scene", sceneId: "s2" }) });
    await waitForJob(baseUrl, (await first.json()).jobId);
    const visual = script();
    visual.scenes[1].inputs = { text: "changed visual" };
    const save = await request(baseUrl, "/api/project/save", { method: "POST", body: JSON.stringify({ project: "invalidate-visual", script: visual }) });
    const scene = (await save.json()).job.units.find((unit: { id: string }) => unit.id === "s2");
    expect(scene.artifacts.voice.status).toBe("ready");
    expect(scene.artifacts.video.status).toBe("stale");

    shouldFail = true;
    const failed = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "invalidate-visual", mode: "video", sceneId: "s2" }) });
    const failedJob = await waitForJob(baseUrl, (await failed.json()).jobId);
    expect(failedJob.status).toBe("error");
    expect(failedJob.error).not.toContain("secret");
    const afterFailure = await (await request(baseUrl, "/api/project?name=invalidate-visual")).json();
    const failedArtifact = afterFailure.job.units.find((unit: { id: string }) => unit.id === "s2").artifacts.video;
    expect(failedArtifact.status).toBe("failed");
    expect(failedArtifact.error.message).not.toContain("secret");
    expect(afterFailure.job.units.find((unit: { id: string }) => unit.id === "s1").artifacts.video.status).toBe("missing");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  it("does not mark a captured render ready after an external script change", async () => {
    let release!: () => void;
    const renderGate = new Promise<void>((resolve) => { release = resolve; });
    const { server, baseUrl, outputRoot } = await setup({ runner: async ({ projectRoot }: { projectRoot: string }) => {
      mkdirSync(join(projectRoot, "clips"), { recursive: true });
      writeFileSync(join(projectRoot, "clips", "scene-s2.mp4"), "video");
      await renderGate;
    } });
    await request(baseUrl, "/api/project/create", { method: "POST", body: JSON.stringify({ project: "race", script: script() }) });
    const render = await request(baseUrl, "/api/render", { method: "POST", body: JSON.stringify({ project: "race", mode: "video", sceneId: "s2" }) });
    expect(render.status).toBe(202);
    writeFileSync(join(outputRoot, "race", "script.json"), JSON.stringify(script("Changed Externally")));
    await new Promise((resolve) => setTimeout(resolve, 10));
    const project = await request(baseUrl, "/api/project?name=race");
    const beforeFinish = await project.json();
    expect(beforeFinish.job.units.find((unit: { id: string }) => unit.id === "s2").artifacts.video.status).toBe("rendering");
    release();
    await new Promise((resolve) => setTimeout(resolve, 30));
    const after = await (await request(baseUrl, "/api/project?name=race")).json();
    expect(after.job.units.find((unit: { id: string }) => unit.id === "s2").artifacts.video.status).not.toBe("ready");
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
});
