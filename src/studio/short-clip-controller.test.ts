import { describe, expect, it } from "vitest";
// @ts-expect-error The Studio frontend is plain browser JavaScript and is covered by Vitest through its public helpers.
import { canEditShortClip, serializeShortClipDraft } from "../../studio/app/controllers/short-clip-controller.js";

describe("short-clip controller pure helpers", () => {
  it("serializes only schema-supported short-clip fields", () => {
    const payload = serializeShortClipDraft({
      version: "1.0",
      renderer: "ct-short-clip",
      algorithm: "selection-sort",
      title: "Selection Sort",
      subtitle: "Chọn phần tử nhỏ nhất",
      source: "lesson.txt",
      seed: "17",
      duration_sec: "45",
      initial_values: "12, 8, 4, 20, 16, 2, 10, 6, 18, 14, 1, 9",
      sound: { enabled: false, compare_hz: "500", compare_ms: "28", swap_hz: "900", swap_ms: "48", gain: "0.16" },
      apiKey: "must-not-be-serialized",
    });
    expect(payload).toEqual({
      version: "1.0",
      renderer: "ct-short-clip",
      algorithm: "selection-sort",
      title: "Selection Sort",
      subtitle: "Chọn phần tử nhỏ nhất",
      source: "lesson.txt",
      seed: 17,
      duration_sec: 45,
      initial_values: [12, 8, 4, 20, 16, 2, 10, 6, 18, 14, 1, 9],
      sound: { enabled: false, compare_hz: 500, compare_ms: 28, swap_hz: 900, swap_ms: 48, gain: 0.16 },
    });
  });

  it("locks all edit controls while a render job is active", () => {
    expect(canEditShortClip({ renderLock: null })).toBe(true);
    expect(canEditShortClip({ renderLock: { jobId: "job-1" } })).toBe(false);
  });
});
