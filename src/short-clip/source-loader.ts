import axios from "axios";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { ShortClipAlgorithm, ShortClipSpec } from "./schema.js";
import {
  SHORT_CLIP_ALGORITHMS,
  SHORT_CLIP_MAX_VALUES,
  SHORT_CLIP_MIN_VALUES,
  ShortClipSpecSchema,
} from "./schema.js";
import { defaultsForAlgorithm, deriveDurationSec, generateInitialValues } from "./trace.js";

export interface SourceOverrides {
  algorithm?: ShortClipAlgorithm;
  count?: number;
  durationSec?: number;
  seed?: number;
}

interface LoadedSource {
  source: string;
  title: string;
  text: string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'");
}

function htmlToText(html: string): string {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromHtml(html: string): string | undefined {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? htmlToText(match[1]).trim() : undefined;
}

async function loadSource(input: string): Promise<LoadedSource> {
  if (/^https?:\/\//i.test(input)) {
    const response = await axios.get<string>(input, {
      timeout: 20000,
      responseType: "text",
      headers: { "User-Agent": "lecture-short-clip/1.0" },
    });
    const html = String(response.data);
    return {
      source: input,
      title: titleFromHtml(html) ?? "Algorithm Short Clip",
      text: htmlToText(html),
    };
  }

  const path = resolve(input);
  if (existsSync(path)) {
    const content = await readFile(path, "utf8");
    const isHtml = /<html|<article|<body/i.test(content);
    const text = isHtml ? htmlToText(content) : content;
    const firstLine = text.split(/\r?\n/).find((line) => line.trim())?.trim();
    return { source: path, title: firstLine ?? "Algorithm Short Clip", text };
  }

  return { source: "inline", title: input.slice(0, 80), text: input };
}

export function detectAlgorithm(text: string): ShortClipAlgorithm | undefined {
  const normalized = text.toLowerCase();
  const candidates: Array<[ShortClipAlgorithm, RegExp]> = [
    ["bubble-sort", /bubble\s*sort|sắp\s*xếp\s*nổi\s*bọt|sap\s*xep\s*noi\s*bot/],
    ["selection-sort", /selection\s*sort|sắp\s*xếp\s*chọn|sap\s*xep\s*chon/],
    ["insertion-sort", /insertion\s*sort|sắp\s*xếp\s*chèn|sap\s*xep\s*chen/],
    ["quick-sort", /quick\s*sort|quicksort|sắp\s*xếp\s*nhanh|sap\s*xep\s*nhanh/],
    ["merge-sort", /merge\s*sort|mergesort|sắp\s*xếp\s*trộn|sap\s*xep\s*tron/],
    ["heap-sort", /heap\s*sort|heapsort|sắp\s*xếp\s*vun\s*đống|sap\s*xep\s*vun\s*dong/],
    ["shell-sort", /shell\s*sort|shellsort|sắp\s*xếp\s*shell|sap\s*xep\s*shell/],
    ["cocktail-sort", /cocktail(?:\s*shaker)?\s*sort|sắp\s*xếp\s*(?:cocktail|lắc)|sap\s*xep\s*(?:cocktail|lac)/],
  ];
  return candidates
    .map(([algorithm, pattern]) => ({ algorithm, index: normalized.search(pattern) }))
    .filter((candidate) => candidate.index >= 0)
    .sort((left, right) => left.index - right.index)[0]?.algorithm;
}

export async function specFromSource(input: string, overrides: SourceOverrides = {}): Promise<ShortClipSpec> {
  const loaded = await loadSource(input);
  const algorithm = overrides.algorithm ?? detectAlgorithm(`${loaded.title}\n${loaded.text}`);
  if (!algorithm) {
    throw new Error(
      `Chưa nhận diện được thuật toán. Hiện hỗ trợ ${SHORT_CLIP_ALGORITHMS.join(", ")}; dùng --algorithm để chọn.`,
    );
  }
  const defaults = defaultsForAlgorithm(algorithm);
  const seed = overrides.seed ?? 42;
  const count = overrides.count ?? 12;
  if (!Number.isInteger(count) || count < SHORT_CLIP_MIN_VALUES || count > SHORT_CLIP_MAX_VALUES) {
    throw new Error(
      `Số phần tử phải là số nguyên từ ${SHORT_CLIP_MIN_VALUES} đến ${SHORT_CLIP_MAX_VALUES}.`,
    );
  }
  const initialValues = generateInitialValues(seed, count);
  return ShortClipSpecSchema.parse({
    version: "1.0",
    renderer: "ct-short-clip",
    algorithm,
    title: defaults.title,
    subtitle: defaults.subtitle,
    source: loaded.source,
    seed,
    duration_sec: overrides.durationSec ?? deriveDurationSec(initialValues.length),
    initial_values: initialValues,
    sound: {},
  });
}
