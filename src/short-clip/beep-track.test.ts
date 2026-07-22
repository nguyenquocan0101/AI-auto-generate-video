import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeBeepTrack } from "./beep-track.js";
import { ShortClipSpecSchema } from "./schema.js";
import { prepareShortClip } from "./trace.js";

describe("short clip beep track", () => {
  it("writes a PCM WAV with the requested duration", async () => {
    const dir = await mkdtemp(join(tmpdir(), "short-clip-beep-"));
    try {
      const output = join(dir, "beeps.wav");
      const prepared = prepareShortClip(ShortClipSpecSchema.parse({
        algorithm: "bubble-sort",
        title: "Bubble Sort",
        subtitle: "test",
        duration_sec: 20,
      }));
      await writeBeepTrack(prepared, output);
      const wav = await readFile(output);
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF");
      expect(wav.toString("ascii", 8, 12)).toBe("WAVE");
      expect(wav.length).toBe(44 + 20 * 44100 * 2);
      expect(wav.subarray(44).some((value) => value !== 0)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
