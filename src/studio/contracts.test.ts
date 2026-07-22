import { describe, expect, it } from "vitest";
import { ShortClipSpecSchema } from "../short-clip/schema.js";
import {
  ArtifactStatusSchema,
  StudioDocumentSchema,
  StudioJobSchema,
  createStudioJob,
} from "./contracts.js";

describe("studio contracts", () => {
  it("accepts a renderer-neutral HyperFrames job without embedding the script", () => {
    const result = StudioJobSchema.safeParse({
      version: "1.0",
      renderer: "hyperframes",
      source: { kind: "import", value: "output/demo/script.json" },
      scriptFingerprint: "a".repeat(64),
      units: [
        {
          id: "scene-1",
          kind: "scene",
          fingerprints: { voice: "b".repeat(64), video: "c".repeat(64) },
          artifacts: {
            voice: { status: "ready", path: "voice/scene-1-abc.mp3", successfulFingerprint: "b".repeat(64) },
            video: { status: "ready", path: "clips/scene-1.mp4", successfulFingerprint: "c".repeat(64) },
          },
        },
      ],
      composition: {
        status: "stale",
        successfulFingerprint: null,
        currentFingerprint: "d".repeat(64),
        path: "video.mp4",
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects credential-like fields instead of persisting them", () => {
    const result = StudioJobSchema.safeParse({
      version: "1.0",
      renderer: "hyperframes",
      source: { kind: "topic", value: "sorting" },
      scriptFingerprint: "a".repeat(64),
      apiKey: "secret",
      units: [],
      composition: null,
    });

    expect(result.success).toBe(false);
  });

  it("requires composition to be null for a short clip", () => {
    const spec = ShortClipSpecSchema.parse({
      algorithm: "selection-sort",
      title: "Selection Sort",
      subtitle: "test",
    });
    const job = createStudioJob({
      renderer: "ct-short-clip",
      source: { kind: "import", value: "output/selection/script.json" },
      scriptFingerprint: "a".repeat(64),
      units: [{ id: "short-clip", kind: "short-clip", fingerprints: { video: "b".repeat(64) } }],
      composition: null,
    });

    expect(job.composition).toBeNull();
    expect(() => StudioJobSchema.parse({ ...job, composition: { status: "missing" } })).toThrow();
    expect(spec.renderer).toBe("ct-short-clip");
  });

  it("exposes the finite artifact state vocabulary", () => {
    expect(ArtifactStatusSchema.options).toEqual([
      "missing",
      "ready",
      "stale",
      "rendering",
      "failed",
    ]);
  });

  it("rejects duplicate HyperFrames scene IDs", () => {
    const result = StudioDocumentSchema.safeParse({
      version: "1.0",
      renderer: "hyperframes",
      metadata: {
        title: "Duplicate scenes",
        source: { url: "", domain: "", image: null },
        channel: "ChuyenTin",
      },
      voice: { provider: "omnivoice", speed: 1 },
      aspect: "9:16",
      scenes: [
        { id: "same", type: "hook", voiceText: "Hook", templateId: "frame", inputs: {} },
        { id: "same", type: "body", voiceText: "Body", templateId: "frame", inputs: {} },
        { id: "outro", type: "outro", voiceText: "Outro", templateId: "frame", inputs: {} },
      ],
    });

    expect(result.success).toBe(false);
  });
});
