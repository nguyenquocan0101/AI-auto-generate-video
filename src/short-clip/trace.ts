import { getAlgorithmRuntime } from "./algorithms/registry.js";
import type { RawOperation } from "./algorithms/types.js";
import type {
  PreparedShortClip,
  ShortClipAlgorithm,
  ShortClipOperation,
  ShortClipSpec,
} from "./schema.js";
import {
  SHORT_CLIP_MAX_DURATION_SEC,
  SHORT_CLIP_MIN_DURATION_SEC,
} from "./schema.js";

function seededRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function generateInitialValues(seed: number, count = 12): number[] {
  const random = seededRandom(seed);
  const values = Array.from({ length: count }, (_, index) => 12 + index * 6);
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }
  if (values.every((value, index) => index === 0 || values[index - 1] <= value)) {
    [values[0], values[1]] = [values[1], values[0]];
  }
  return values;
}

export function deriveDurationSec(valueCount: number): number {
  const safeCount = Math.max(1, Math.floor(valueCount));
  const extraValues = Math.max(0, safeCount - 12);
  return Math.min(
    SHORT_CLIP_MAX_DURATION_SEC,
    Math.max(SHORT_CLIP_MIN_DURATION_SEC, 24 + Math.ceil(extraValues * 0.5)),
  );
}

function scheduleOperations(raw: RawOperation[], durationSec: number): ShortClipOperation[] {
  const introMs = 1500;
  const finalHoldMs = 1500;
  const traceEndMs = durationSec * 1000 - finalHoldMs;
  const intervalMs = (traceEndMs - introMs) / Math.max(1, raw.length);
  return raw.map((item, index) => ({
    ...item,
    time_ms: Math.round(introMs + intervalMs * index),
  }));
}

export function prepareShortClip(spec: ShortClipSpec): PreparedShortClip {
  const runtime = getAlgorithmRuntime(spec.algorithm);
  const initialValues = spec.initial_values ?? generateInitialValues(spec.seed);
  const durationSec = spec.duration_sec ?? deriveDurationSec(initialValues.length);
  const raw = runtime.trace(initialValues);
  if (!raw.some((item) => item.type === "swap" || item.type === "move")) {
    throw new Error("Mảng đầu vào không tạo ra chuyển động. Hãy dùng một mảng chưa được sắp xếp.");
  }
  return {
    ...spec,
    duration_sec: durationSec,
    initial_values: initialValues,
    title: spec.title || runtime.title,
    subtitle: spec.subtitle || runtime.subtitle,
    time_complexity: runtime.timeComplexity,
    space_complexity: runtime.spaceComplexity,
    code_lines: runtime.codeLines,
    operations: scheduleOperations(raw, durationSec),
  };
}

export function defaultsForAlgorithm(
  algorithm: ShortClipAlgorithm,
): Pick<ShortClipSpec, "title" | "subtitle"> {
  const runtime = getAlgorithmRuntime(algorithm);
  return { title: runtime.title, subtitle: runtime.subtitle };
}
