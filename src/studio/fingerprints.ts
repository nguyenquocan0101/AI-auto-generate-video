import { createHash } from "node:crypto";
import type { TemplateScript, TemplateSceneType } from "../render/template-script-schema.js";
import type { ShortClipSpec } from "../short-clip/schema.js";

export function stableNormalize(value: unknown): unknown {
  if (value === undefined) return "[undefined]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stableNormalize);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, stableNormalize(entry)]),
  );
}

export function fingerprint(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableNormalize(value)))
    .digest("hex");
}

function sceneById(script: TemplateScript, sceneId: string): TemplateSceneType {
  const scene = script.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
  return scene;
}

export function fingerprintHyperFramesVoice(script: TemplateScript, sceneId: string): string {
  const scene = sceneById(script, sceneId);
  return fingerprint({
    voice: script.voice,
    scene: {
      id: scene.id,
      voiceText: scene.voiceText,
      ttsProvider: scene.ttsProvider,
    },
  });
}

export function fingerprintHyperFramesVideo(script: TemplateScript, sceneId: string): string {
  const scene = sceneById(script, sceneId);
  return fingerprint({
    aspect: script.aspect,
    scene: {
      id: scene.id,
      type: scene.type,
      templateId: scene.templateId,
      inputs: scene.inputs,
    },
  });
}

export function fingerprintComposition(script: TemplateScript): string {
  return fingerprint({
    aspect: script.aspect,
    order: script.scenes.map((scene) => scene.id),
    scenes: script.scenes.map((scene) => ({
      id: scene.id,
      voice: fingerprintHyperFramesVoice(script, scene.id),
      video: fingerprintHyperFramesVideo(script, scene.id),
      sfx: scene.sfx,
    })),
  });
}

export function fingerprintShortClip(spec: ShortClipSpec): string {
  return fingerprint(spec);
}
