import { writeFile } from "node:fs/promises";
import type { PreparedShortClip } from "./schema.js";

const SAMPLE_RATE = 44100;

function writeWavHeader(buffer: Buffer, sampleCount: number): void {
  const dataSize = sampleCount * 2;
  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);
}

export async function writeBeepTrack(clip: PreparedShortClip, outputPath: string): Promise<void> {
  const sampleCount = Math.ceil(clip.duration_sec * SAMPLE_RATE);
  const samples = new Float64Array(sampleCount);
  const sound = clip.sound;

  if (sound.enabled) {
    for (const operation of clip.operations) {
      if (operation.type !== "compare" && operation.type !== "swap" && operation.type !== "move") continue;
      const isMovement = operation.type === "swap" || operation.type === "move";
      const frequency = isMovement ? sound.swap_hz : sound.compare_hz;
      const durationMs = isMovement ? sound.swap_ms : sound.compare_ms;
      const start = Math.round((operation.time_ms / 1000) * SAMPLE_RATE);
      const length = Math.max(1, Math.round((durationMs / 1000) * SAMPLE_RATE));
      for (let offset = 0; offset < length && start + offset < samples.length; offset++) {
        const phase = offset / SAMPLE_RATE;
        const position = offset / length;
        const envelope = Math.sin(Math.PI * position) ** 2;
        samples[start + offset] += Math.sin(2 * Math.PI * frequency * phase) * sound.gain * envelope;
      }
    }
  }

  const buffer = Buffer.alloc(44 + sampleCount * 2);
  writeWavHeader(buffer, sampleCount);
  for (let index = 0; index < sampleCount; index++) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + index * 2);
  }
  await writeFile(outputPath, buffer);
}
