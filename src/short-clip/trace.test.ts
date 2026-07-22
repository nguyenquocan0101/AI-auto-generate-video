import { describe, expect, it } from "vitest";
import { SHORT_CLIP_ALGORITHMS, ShortClipSpecSchema } from "./schema.js";
import { detectAlgorithm } from "./source-loader.js";
import { deriveDurationSec, generateInitialValues, prepareShortClip } from "./trace.js";

function bubbleSpec() {
  return ShortClipSpecSchema.parse({
    algorithm: "bubble-sort",
    title: "Bubble Sort",
    subtitle: "Đổi chỗ phần tử kề nhau",
    seed: 17,
  });
}

describe("short clip trace", () => {
  it("generates deterministic shuffled values", () => {
    expect(generateInitialValues(17)).toEqual(generateInitialValues(17));
    expect(generateInitialValues(17)).not.toEqual(generateInitialValues(18));
  });

  it("derives duration from the number of values", () => {
    expect(deriveDurationSec(12)).toBe(24);
    expect(deriveDurationSec(50)).toBe(43);
    expect(deriveDurationSec(200)).toBe(60);
  });

  it("keeps an explicit duration override", () => {
    const prepared = prepareShortClip(ShortClipSpecSchema.parse({
      algorithm: "selection-sort",
      title: "Selection Sort",
      subtitle: "test",
      duration_sec: 50,
      initial_values: Array.from({ length: 50 }, (_, index) => 50 - index),
    }));
    expect(prepared.duration_sec).toBe(50);
  });

  it("accepts an explicit array of up to 50 values", () => {
    const initialValues = Array.from({ length: 50 }, (_, index) => 50 - index);
    const spec = ShortClipSpecSchema.parse({
      algorithm: "insertion-sort",
      title: "Insertion Sort",
      subtitle: "test",
      initial_values: initialValues,
    });
    const prepared = prepareShortClip(spec);
    expect(prepared.initial_values).toHaveLength(50);
    expect(prepared.duration_sec).toBe(43);
    expect(prepared.operations.at(-1)?.values).toEqual([...initialValues].sort((a, b) => a - b));
  });

  it("generates the requested source count", async () => {
    const { specFromSource } = await import("./source-loader.js");
    const spec = await specFromSource("Selection Sort", { count: 50 });
    expect(spec.initial_values).toHaveLength(50);
    expect(spec.duration_sec).toBe(43);
  });

  it("runs bubble sort and schedules a deterministic complete trace", () => {
    const prepared = prepareShortClip(bubbleSpec());
    const done = prepared.operations.at(-1);
    expect(prepared.operations.some((item) => item.type === "compare")).toBe(true);
    expect(prepared.operations.some((item) => item.type === "swap")).toBe(true);
    expect(done?.type).toBe("done");
    expect(done?.values).toEqual([...prepared.initial_values].sort((a, b) => a - b));
    expect(done?.sorted_indices).toHaveLength(prepared.initial_values.length);
    for (let index = 1; index < prepared.operations.length; index++) {
      expect(prepared.operations[index].time_ms).toBeGreaterThan(prepared.operations[index - 1].time_ms);
    }
    expect(prepared.operations.at(-1)!.time_ms).toBeLessThan(prepared.duration_sec * 1000);
  });

  it.each(SHORT_CLIP_ALGORITHMS)(
    "sorts a full trace with %s",
    (algorithm) => {
      const spec = ShortClipSpecSchema.parse({
        algorithm,
        title: algorithm,
        subtitle: "test",
        seed: 31,
      });
      const prepared = prepareShortClip(spec);
      expect(prepared.operations.at(-1)?.values).toEqual(
        [...prepared.initial_values].sort((a, b) => a - b),
      );
      expect(prepared.operations.some((item) => item.type === "compare")).toBe(true);
      expect(prepared.operations.some((item) => item.type === "swap" || item.type === "move")).toBe(true);
      const codeLines = new Set(prepared.code_lines.map((line) => line.n));
      for (const item of prepared.operations) {
        expect(codeLines.has(item.active_line_num)).toBe(true);
        expect([...item.order].sort((a, b) => a - b)).toEqual(
          prepared.initial_values.map((_, index) => index),
        );
        expect(item.indices.every((index) => index >= 0 && index < prepared.initial_values.length)).toBe(true);
      }
    },
  );

  it("keeps every swap snapshot semantically valid", () => {
    const prepared = prepareShortClip(bubbleSpec());
    let previous = prepared.initial_values;
    for (const item of prepared.operations) {
      if (item.type === "swap") {
        const [left, right] = item.indices;
        const expected = [...previous];
        [expected[left], expected[right]] = [expected[right], expected[left]];
        expect(item.values).toEqual(expected);
      }
      previous = item.values;
    }
  });

  it("keeps every merge move snapshot semantically valid", () => {
    const prepared = prepareShortClip(ShortClipSpecSchema.parse({
      algorithm: "merge-sort",
      title: "Merge Sort",
      subtitle: "test",
      seed: 23,
    }));
    let previous = prepared.initial_values;
    for (const item of prepared.operations) {
      if (item.type === "move") {
        const [from, to] = item.indices;
        const expected = [...previous];
        const [moved] = expected.splice(from, 1);
        expected.splice(to, 0, moved);
        expect(item.values).toEqual(expected);
      }
      previous = item.values;
    }
  });

  it("detects the supported algorithms in Vietnamese or English", () => {
    expect(detectAlgorithm("Hướng dẫn sắp xếp nổi bọt")).toBe("bubble-sort");
    expect(detectAlgorithm("Selection Sort tutorial")).toBe("selection-sort");
    expect(detectAlgorithm("Thuật toán sắp xếp chèn")).toBe("insertion-sort");
    expect(detectAlgorithm("Quick Sort tutorial")).toBe("quick-sort");
    expect(detectAlgorithm("Thuật toán sắp xếp trộn")).toBe("merge-sort");
    expect(detectAlgorithm("Heap Sort visualization")).toBe("heap-sort");
    expect(detectAlgorithm("Hướng dẫn sắp xếp Shell")).toBe("shell-sort");
    expect(detectAlgorithm("Cocktail Shaker Sort animation")).toBe("cocktail-sort");
  });

  it("prefers the algorithm mentioned first in a source title", () => {
    expect(detectAlgorithm("Quick Sort guide. Compared with Bubble Sort later.")).toBe("quick-sort");
  });
});
