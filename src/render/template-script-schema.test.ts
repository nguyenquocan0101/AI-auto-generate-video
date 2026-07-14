import { describe, expect, it } from "vitest";
import { TemplateScriptSchema } from "./template-script-schema.js";

const baseScript = {
  version: "1.0",
  renderer: "hyperframes",
  metadata: {
    title: "Test",
    source: {
      url: "https://example.com/story",
      domain: "example.com",
      image: null,
    },
    channel: "test",
    audience: "cap2",
  },
  voice: {
    provider: "mixed",
    speed: 1,
    vieneuVoice: "Pham Tuyen",
  },
  aspect: "9:16",
  scenes: [
    {
      id: "hook",
      type: "hook",
      ttsProvider: "vieneu",
      voiceText: "Opening line.",
      templateId: "frame-bold-poster",
      inputs: {},
      camera: { focus: "code", zoom: 1 },
      frames: [{ duration: 1, active_line: 1, animation: "highlight" }],
      changed_variables: [{ name: "i", old: "0", new: "1" }],
    },
    {
      id: "body",
      type: "body",
      ttsProvider: "omnivoice",
      voiceText: "Body line.",
      templateId: "frame-bold-poster",
      inputs: {},
    },
    {
      id: "outro",
      type: "outro",
      ttsProvider: "vieneu",
      voiceText: "Outro line.",
      templateId: "frame-bold-poster",
      inputs: {},
    },
  ],
};

describe("TemplateScriptSchema TTS providers", () => {
  it("accepts mixed scripts with per-scene providers", () => {
    const parsed = TemplateScriptSchema.parse(baseScript);
    expect(parsed.voice.provider).toBe("mixed");
    expect(parsed.metadata.audience).toBe("cap2");
    expect(parsed.scenes[0].camera).toEqual({ focus: "code", zoom: 1 });
    expect(parsed.scenes[0].frames).toEqual([{ duration: 1, active_line: 1, animation: "highlight" }]);
    expect(parsed.scenes[0].changed_variables).toEqual([{ name: "i", old: "0", new: "1" }]);
    expect(parsed.scenes.map((s) => s.ttsProvider)).toEqual([
      "vieneu",
      "omnivoice",
      "vieneu",
    ]);
  });

  it("rejects unknown per-scene providers", () => {
    expect(() =>
      TemplateScriptSchema.parse({
        ...baseScript,
        scenes: [
          { ...baseScript.scenes[0], ttsProvider: "other" },
          ...baseScript.scenes.slice(1),
        ],
      }),
    ).toThrow();
  });
});
