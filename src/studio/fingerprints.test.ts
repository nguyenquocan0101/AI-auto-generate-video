import { describe, expect, it } from "vitest";
import { ShortClipSpecSchema } from "../short-clip/schema.js";
import {
  fingerprint,
  fingerprintComposition,
  fingerprintHyperFramesVideo,
  fingerprintHyperFramesVoice,
  fingerprintShortClip,
  stableNormalize,
} from "./fingerprints.js";

const script = {
  version: "1.0" as const,
  renderer: "hyperframes" as const,
  metadata: {
    title: "Selection Sort",
    source: { url: "", domain: "", image: null },
    channel: "ChuyenTin",
  },
  voice: { provider: "omnivoice" as const, speed: 1, instruct: "clear" },
  aspect: "9:16" as const,
  scenes: [
    { id: "scene-1", type: "hook" as const, voiceText: "Hook", templateId: "a", inputs: {}, sfx: { name: "hit", volume: 0.4, startOffsetSec: 0 } },
    { id: "scene-2", type: "body" as const, voiceText: "Body", templateId: "b", inputs: { text: "one" } },
    { id: "scene-3", type: "outro" as const, voiceText: "Outro", templateId: "c", inputs: {} },
  ],
};

describe("studio fingerprints", () => {
  it("normalizes object keys recursively but preserves array order", () => {
    expect(stableNormalize({ z: 1, a: { y: 2, x: 3 } })).toEqual(
      stableNormalize({ a: { x: 3, y: 2 }, z: 1 }),
    );
    expect(fingerprint({ b: 2, a: 1 })).toBe(fingerprint({ a: 1, b: 2 }));
    expect(fingerprint(["a", "b"])).not.toBe(fingerprint(["b", "a"]));
  });

  it("separates voice and visual inputs", () => {
    const voice = fingerprintHyperFramesVoice(script, "scene-2");
    const visual = fingerprintHyperFramesVideo(script, "scene-2");
    expect(voice).not.toBe(visual);

    const changedVoice = { ...script, scenes: script.scenes.map((scene) => scene.id === "scene-2" ? { ...scene, voiceText: "Changed" } : scene) };
    expect(fingerprintHyperFramesVoice(changedVoice, "scene-2")).not.toBe(voice);
    expect(fingerprintHyperFramesVideo(changedVoice, "scene-2")).toBe(visual);

    const changedVisual = { ...script, scenes: script.scenes.map((scene) => scene.id === "scene-2" ? { ...scene, inputs: { text: "two" } } : scene) };
    expect(fingerprintHyperFramesVideo(changedVisual, "scene-2")).not.toBe(visual);
    expect(fingerprintHyperFramesVoice(changedVisual, "scene-2")).toBe(voice);
  });

  it("includes order and SFX in composition but not in per-scene voice", () => {
    const base = fingerprintComposition(script);
    const reordered = { ...script, scenes: [script.scenes[0], script.scenes[2], script.scenes[1]] };
    expect(fingerprintComposition(reordered)).not.toBe(base);
    const changedSfx = { ...script, scenes: script.scenes.map((scene) => scene.id === "scene-2" ? { ...scene, sfx: { name: "whoosh", volume: 0.2, startOffsetSec: 0 } } : scene) };
    expect(fingerprintComposition(changedSfx)).not.toBe(base);
    expect(fingerprintHyperFramesVoice(changedSfx, "scene-2")).toBe(fingerprintHyperFramesVoice(script, "scene-2"));
  });

  it("fingerprints short-clip input as one video unit", () => {
    const spec = ShortClipSpecSchema.parse({ algorithm: "selection-sort", title: "Selection", subtitle: "test" });
    expect(fingerprintShortClip(spec)).toBe(fingerprintShortClip({ ...spec }));
    expect(fingerprintShortClip({ ...spec, seed: spec.seed + 1 })).not.toBe(fingerprintShortClip(spec));
  });
});
