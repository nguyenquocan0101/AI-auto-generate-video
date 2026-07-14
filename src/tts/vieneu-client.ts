import axios, { AxiosError } from "axios";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type { TtsClient } from "./tts-client.js";

export interface VieNeuOpts {
  endpoint: string; // e.g. "http://127.0.0.1:8001"
  voice?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let err = "";
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} failed (exit ${code}): ${err}`));
    });
    proc.on("error", reject);
  });
}

// VieNeu-TTS local FastAPI streaming demo:
//   cd W:\VieNeu-TTS
//   uv run python -m apps.web_stream
//
// POST /stream { text, voice_id } returns 48 kHz mono WAV bytes. The pipeline
// normalizes provider output to MP3 so downstream concat/mux steps stay unchanged.
export class VieNeuClient implements TtsClient {
  constructor(private cfg: VieNeuOpts) {}

  async generate(
    text: string,
    audioOutPath: string,
    _srtOutPath?: string,
    opts?: { voice?: string }
  ): Promise<void> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      const tmp = await mkdtemp(join(tmpdir(), "vieneu-tts-"));
      const wavPath = join(tmp, `${basename(audioOutPath)}.wav`);
      try {
        const resp = await axios.post<ArrayBuffer>(
          `${this.cfg.endpoint}/stream`,
          { text, voice_id: opts?.voice ?? this.cfg.voice },
          {
            headers: { "Content-Type": "application/json", Accept: "audio/wav" },
            responseType: "arraybuffer",
            timeout: 300000,
          },
        );
        await writeFile(wavPath, Buffer.from(resp.data));
        await run("ffmpeg", [
          "-y", "-i", wavPath,
          "-ar", "44100", "-ac", "1",
          "-c:a", "libmp3lame", "-b:a", "192k",
          audioOutPath,
        ]);
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        if (status !== undefined && status < 500 && status !== 429) {
          throw new Error(`VieNeu TTS failed (status ${status})`);
        }
        if (attempt < delays.length) await sleep(delays[attempt]);
      } finally {
        await rm(tmp, { recursive: true, force: true });
      }
    }

    throw lastErr;
  }
}
