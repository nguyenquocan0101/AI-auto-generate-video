import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { composeTemplate } from "../render/template-composer.js";
import { muxAudioOntoVideo } from "../render/video-tools.js";
import { log } from "../utils/logger.js";
import { writeBeepTrack } from "./beep-track.js";
import { ShortClipSpecSchema, type ShortClipSpec } from "./schema.js";
import { deriveDurationSec, prepareShortClip } from "./trace.js";

export interface RenderShortClipOptions {
  outputPath: string;
  force?: boolean;
  quality?: "draft" | "standard" | "high";
  onProgress?: (progress: { step: number; total: number; message: string }) => void;
}

export async function readShortClipSpec(path: string): Promise<ShortClipSpec> {
  const raw = JSON.parse(await readFile(path, "utf8"));
  const spec = ShortClipSpecSchema.parse(raw);
  return spec.duration_sec === undefined
    ? { ...spec, duration_sec: deriveDurationSec(spec.initial_values?.length ?? 12) }
    : spec;
}

export async function renderShortClip(
  input: ShortClipSpec,
  options: RenderShortClipOptions,
): Promise<string> {
  const spec = ShortClipSpecSchema.parse(input);
  const prepared = prepareShortClip(spec);
  const outputPath = resolve(options.outputPath);
  const outputDir = dirname(outputPath);
  const silentPath = join(outputDir, "video-silent.mp4");
  const beepPath = join(outputDir, "beeps.wav");
  const tracePath = join(outputDir, "trace.json");
  const cachePath = join(outputDir, ".short-clip-cache.json");
  const hash = createHash("sha1").update(JSON.stringify(prepared)).digest("hex");
  await mkdir(outputDir, { recursive: true });

  let cacheHash: string | undefined;
  if (existsSync(cachePath)) {
    try {
      cacheHash = JSON.parse(await readFile(cachePath, "utf8")).hash;
    } catch {
      cacheHash = undefined;
    }
  }

  if (!options.force && cacheHash === hash && existsSync(outputPath)) {
    log.info(`REUSE short clip: ${outputPath}`);
    options.onProgress?.({ step: 3, total: 3, message: "Reuse short clip cache" });
    return outputPath;
  }

  await writeFile(tracePath, `${JSON.stringify(prepared, null, 2)}\n`, "utf8");
  options.onProgress?.({ step: 1, total: 3, message: `Render timeline ${prepared.algorithm} (${prepared.operations.length} operations)` });
  log.step(1, 3, `Render timeline ${prepared.algorithm} (${prepared.operations.length} operations)`);
  await composeTemplate({
    templateId: "ct-short-clip",
    inputs: prepared as unknown as Record<string, unknown>,
    aspect: "9:16",
    outputPath: silentPath,
    fps: 30,
    quality: options.quality ?? "standard",
    durationSec: prepared.duration_sec,
  });

  options.onProgress?.({ step: 2, total: 3, message: "Generate deterministic beep track" });
  log.step(2, 3, "Generate deterministic beep track");
  await writeBeepTrack(prepared, beepPath);

  options.onProgress?.({ step: 3, total: 3, message: "Mux video and beep track" });
  log.step(3, 3, "Mux video and beep track");
  await muxAudioOntoVideo(silentPath, beepPath, outputPath);
  await writeFile(cachePath, `${JSON.stringify({ hash }, null, 2)}\n`, "utf8");
  log.info(`Short clip ready: ${outputPath}`);
  return outputPath;
}
