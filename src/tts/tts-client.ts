/**
 * Common TTS client interface. Provider implementations normalize their output
 * to the requested audio path so the render pipeline stays provider-agnostic.
 */
export interface TtsClient {
  /**
   * Generate speech audio for `text` and write to `audioOutPath` (mp3 or wav).
   * If `srtOutPath` is provided AND the provider supports subtitles,
   * write the SRT to that path. Otherwise silently skip.
   */
  generate(
    text: string,
    audioOutPath: string,
    srtOutPath?: string,
    opts?: { speed?: number; instruct?: string; voice?: string }
  ): Promise<void>;
}

import type { ConcreteTtsProvider, Config } from "../config.js";
import { OmniVoiceClient } from "./omnivoice-client.js";
import { VieNeuClient } from "./vieneu-client.js";

export function createTtsClient(cfg: Config, provider: ConcreteTtsProvider = "omnivoice"): TtsClient {
  if (provider === "omnivoice") {
    return new OmniVoiceClient({ endpoint: cfg.omnivoiceEndpoint });
  }
  return new VieNeuClient({
    endpoint: cfg.vieneuStreamEndpoint,
    voice: cfg.vieneuVoice,
  });
}
