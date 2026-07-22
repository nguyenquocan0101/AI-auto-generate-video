import { join } from "node:path";
import { TemplateScriptSchema, type TemplateScript } from "../../render/template-script-schema.js";

export type HyperFramesMode = "audio" | "video" | "scene" | "compose";

export interface HyperFramesCommandInput {
  projectRoot: string;
  scriptPath: string;
  mode: HyperFramesMode;
  sceneId?: string;
  cwd: string;
}

export interface HyperFramesAdapter {
  renderer: "hyperframes";
  validate(script: unknown): TemplateScript;
  inspect(script: TemplateScript): Array<{ id: string; type: string; voiceText: string; templateId: string }>;
  command(input: HyperFramesCommandInput): { command: string; args: string[]; cwd: string; env: NodeJS.ProcessEnv };
  prerequisites(script: TemplateScript, mode: HyperFramesMode, sceneId?: string): string[];
}

export function createHyperFramesAdapter(): HyperFramesAdapter {
  return {
    renderer: "hyperframes",
    validate(script) {
      return TemplateScriptSchema.parse(script);
    },
    inspect(script) {
      return script.scenes.map((scene) => ({
        id: scene.id,
        type: scene.type,
        voiceText: scene.voiceText,
        templateId: scene.templateId,
      }));
    },
    command({ scriptPath, mode, sceneId, cwd }) {
      const command = process.execPath;
      const args = [join(cwd, "node_modules", "tsx", "dist", "cli.mjs"), "src/cli.ts", scriptPath, "--mode", mode, "--studio-progress"];
      if (sceneId) args.push("--scene", sceneId);
      if (mode === "audio" || mode === "video" || mode === "scene") args.push("--force");
      return {
        command,
        args,
        cwd,
        env: { ...process.env },
      };
    },
    prerequisites(script, mode, sceneId) {
      if (mode === "compose") {
        return script.scenes.flatMap((scene) => [`${scene.id}:voice`, `${scene.id}:video`]);
      }
      if (mode === "audio" || mode === "video" || mode === "scene") {
        if (!sceneId) return ["sceneId"];
        return script.scenes.some((scene) => scene.id === sceneId) ? [] : [`${sceneId}:not-found`];
      }
      return [];
    },
  };
}
