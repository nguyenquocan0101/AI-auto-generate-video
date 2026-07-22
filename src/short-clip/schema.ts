import { z } from "zod";

export const SHORT_CLIP_ALGORITHMS = [
  "bubble-sort",
  "selection-sort",
  "insertion-sort",
  "quick-sort",
  "merge-sort",
  "heap-sort",
  "shell-sort",
  "cocktail-sort",
] as const;

export const ShortClipAlgorithmSchema = z.enum(SHORT_CLIP_ALGORITHMS);

export type ShortClipAlgorithm = z.infer<typeof ShortClipAlgorithmSchema>;

export const SHORT_CLIP_MIN_DURATION_SEC = 20;
export const SHORT_CLIP_MAX_DURATION_SEC = 60;
export const SHORT_CLIP_MIN_VALUES = 12;
export const SHORT_CLIP_MAX_VALUES = 50;

const SoundSchema = z.object({
  enabled: z.boolean().default(true),
  compare_hz: z.number().min(120).max(2000).default(500),
  compare_ms: z.number().min(8).max(120).default(28),
  swap_hz: z.number().min(120).max(2400).default(900),
  swap_ms: z.number().min(8).max(160).default(48),
  gain: z.number().min(0).max(0.5).default(0.16),
});

export const ShortClipSpecSchema = z.object({
  version: z.literal("1.0").default("1.0"),
  renderer: z.literal("ct-short-clip").default("ct-short-clip"),
  algorithm: ShortClipAlgorithmSchema,
  title: z.string().min(1),
  subtitle: z.string().min(1),
  source: z.string().optional(),
  seed: z.number().int().min(0).max(0x7fffffff).default(42),
  duration_sec: z.number()
    .min(SHORT_CLIP_MIN_DURATION_SEC)
    .max(SHORT_CLIP_MAX_DURATION_SEC)
    .optional(),
  initial_values: z.array(z.number().finite())
    .min(SHORT_CLIP_MIN_VALUES)
    .max(SHORT_CLIP_MAX_VALUES)
    .optional(),
  sound: SoundSchema.default({
    enabled: true,
    compare_hz: 500,
    compare_ms: 28,
    swap_hz: 900,
    swap_ms: 48,
    gain: 0.16,
  }),
});

export type ShortClipSpec = z.infer<typeof ShortClipSpecSchema>;

export type ShortClipOperationType =
  | "compare"
  | "swap"
  | "move"
  | "pivot"
  | "mark_sorted"
  | "done";

export interface ShortClipOperation {
  time_ms: number;
  type: ShortClipOperationType;
  indices: number[];
  values: number[];
  order: number[];
  active_line_num: number;
  sorted_indices: number[];
  status: string;
}

export interface ShortClipCodeLine {
  n: number;
  t: string;
}

export interface PreparedShortClip extends Omit<ShortClipSpec, "duration_sec"> {
  duration_sec: number;
  initial_values: number[];
  time_complexity: string;
  space_complexity: string;
  code_lines: ShortClipCodeLine[];
  operations: ShortClipOperation[];
}
