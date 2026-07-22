import { join } from "node:path";
import { renderShortClip } from "../../short-clip/renderer.js";
import { ShortClipSpecSchema, type ShortClipSpec } from "../../short-clip/schema.js";

export interface ShortClipRenderContext {
  projectRoot: string;
  spec: ShortClipSpec;
  force?: boolean;
  reportProgress: (percent: number, message: string) => void;
}

export interface ShortClipAdapter {
  renderer: "ct-short-clip";
  validate(value: unknown): ShortClipSpec;
  inspect(spec: ShortClipSpec): { id: "short-clip"; title: string; algorithm: string; valueCount: number; durationSec: number | undefined };
  render(context: ShortClipRenderContext): Promise<void>;
}

export function createShortClipAdapter(): ShortClipAdapter {
  return {
    renderer: "ct-short-clip",
    validate(value) {
      return ShortClipSpecSchema.parse(value);
    },
    inspect(spec) {
      return {
        id: "short-clip",
        title: spec.title,
        algorithm: spec.algorithm,
        valueCount: spec.initial_values?.length ?? 12,
        durationSec: spec.duration_sec,
      };
    },
    async render({ projectRoot, spec, force, reportProgress }) {
      reportProgress(5, "Đang chuẩn bị short clip");
      await renderShortClip(spec, {
        outputPath: join(projectRoot, "video.mp4"),
        force: force ?? true,
        onProgress: ({ step, total, message }) => reportProgress(Math.round((step / total) * 100), message),
      });
      reportProgress(100, "Short clip đã sẵn sàng");
    },
  };
}
