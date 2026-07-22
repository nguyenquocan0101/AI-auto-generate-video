import { describe, expect, it } from "vitest";
import { createStudioJob } from "./contracts.js";
import {
  invalidateStudioJob,
  reconcileStudioJob,
} from "./artifact-state.js";

function job() {
  return createStudioJob({
    renderer: "hyperframes",
    source: { kind: "import", value: "output/demo/script.json" },
    scriptFingerprint: "a".repeat(64),
    units: [
      {
        id: "scene-1",
        kind: "scene",
        fingerprints: { voice: "b".repeat(64), video: "c".repeat(64) },
        artifacts: {
          voice: { status: "ready", path: "voice/scene-1.mp3", successfulFingerprint: "b".repeat(64) },
          video: { status: "ready", path: "clips/scene-1.mp4", successfulFingerprint: "c".repeat(64) },
        },
      },
      {
        id: "scene-2",
        kind: "scene",
        fingerprints: { voice: "d".repeat(64), video: "e".repeat(64) },
        artifacts: {
          voice: { status: "ready", path: "voice/scene-2.mp3", successfulFingerprint: "d".repeat(64) },
          video: { status: "ready", path: "clips/scene-2.mp4", successfulFingerprint: "e".repeat(64) },
        },
      },
    ],
    composition: {
      status: "ready",
      currentFingerprint: "c".repeat(64),
      successfulFingerprint: "c".repeat(64),
      path: "video.mp4",
    },
  });
}

describe("studio artifact state", () => {
  it("invalidates only the affected dependency graph for a voice edit", () => {
    const next = invalidateStudioJob(job(), { type: "scene-voice", sceneId: "scene-1" });
    expect(next.units[0].kind).toBe("scene");
    if (next.units[0].kind !== "scene") throw new Error("expected scene");
    expect(next.units[0].artifacts.voice.status).toBe("stale");
    expect(next.units[0].artifacts.video.status).toBe("stale");
    if (next.units[1].kind !== "scene") throw new Error("expected scene");
    expect(next.units[1].artifacts.voice.status).toBe("ready");
    expect(next.composition?.status).toBe("stale");
  });

  it("invalidates video and composition for visual changes, but keeps voice", () => {
    const next = invalidateStudioJob(job(), { type: "scene-visual", sceneId: "scene-1" });
    expect(next.units[0].kind).toBe("scene");
    if (next.units[0].kind !== "scene") throw new Error("expected scene");
    expect(next.units[0].artifacts.voice.status).toBe("ready");
    expect(next.units[0].artifacts.video.status).toBe("stale");
    expect(next.composition?.status).toBe("stale");
  });

  it("invalidates every voice and fitted video unit for a global voice change", () => {
    const next = invalidateStudioJob(job(), { type: "voice-global" });
    for (const unit of next.units) {
      if (unit.kind !== "scene") throw new Error("expected scene");
      expect(unit.artifacts.voice.status).toBe("stale");
      expect(unit.artifacts.video.status).toBe("stale");
    }
    expect(next.composition?.status).toBe("stale");
  });

  it("invalidates composition only for SFX changes and globally for ordering", () => {
    const sfx = invalidateStudioJob(job(), { type: "sfx" });
    if (sfx.units[0].kind !== "scene") throw new Error("expected scene");
    expect(sfx.units[0].artifacts.video.status).toBe("ready");
    expect(sfx.composition?.status).toBe("stale");

    const order = invalidateStudioJob(job(), { type: "order" });
    if (order.units[0].kind !== "scene") throw new Error("expected scene");
    expect(order.units[0].artifacts.voice.status).toBe("stale");
    expect(order.units[0].artifacts.video.status).toBe("stale");
    expect(order.composition?.status).toBe("stale");
  });

  it("keeps an actively owned artifact rendering before its file exists", () => {
    const next = reconcileStudioJob(job(), {
      files: {
        "scene-1": { voice: false, video: false },
        "scene-2": { voice: true, video: true },
      },
      activeArtifacts: ["scene-1:voice"],
    });
    if (next.units[0].kind !== "scene") throw new Error("expected scene");
    expect(next.units[0].artifacts.voice.status).toBe("rendering");
    expect(next.units[0].artifacts.video.status).toBe("missing");
  });

  it("does not promote a ready artifact when its file is missing or dependency is stale", () => {
    const next = reconcileStudioJob(job(), {
      files: {
        "scene-1": { voice: true, video: false },
        "scene-2": { voice: true, video: true },
        composition: true,
      },
      activeArtifacts: [],
    });
    if (next.units[0].kind !== "scene") throw new Error("expected scene");
    expect(next.units[0].artifacts.video.status).toBe("missing");
    expect(next.composition?.status).toBe("stale");
  });

  it("recovers orphaned rendering state conservatively", () => {
    const rendering = invalidateStudioJob(job(), { type: "scene-voice", sceneId: "scene-1" });
    if (rendering.units[0].kind !== "scene") throw new Error("expected scene");
    rendering.units[0].artifacts.voice.status = "rendering";
    const recovered = reconcileStudioJob(rendering, {
      files: { "scene-1": { voice: true, video: true }, "scene-2": { voice: true, video: true }, composition: true },
      activeArtifacts: [],
    });
    if (recovered.units[0].kind !== "scene") throw new Error("expected scene");
    expect(recovered.units[0].artifacts.voice.status).toBe("stale");
  });

  it("adopts a legacy project as stale even when files exist", () => {
    const adopted = reconcileStudioJob(null, {
      renderer: "hyperframes",
      unitIds: ["scene-1"],
      files: { "scene-1": { voice: true, video: true }, composition: true },
      activeArtifacts: [],
    });
    if (adopted.units[0].kind !== "scene") throw new Error("expected scene");
    expect(adopted.units[0].artifacts.voice.status).toBe("stale");
    expect(adopted.units[0].artifacts.video.status).toBe("stale");
    expect(adopted.composition?.status).toBe("stale");
  });
});
