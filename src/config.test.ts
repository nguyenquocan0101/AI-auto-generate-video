import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = [
  "TTS_PROVIDER",
  "OMNIVOICE_ENDPOINT",
  "VIENEU_STREAM_ENDPOINT",
  "VIENEU_VOICE",
  "TTS_CONCURRENCY",
];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  it("defaults to omnivoice with sensible defaults", () => {
    const cfg = loadConfig();
    expect(cfg.ttsProvider).toBe("omnivoice");
    expect(cfg.omnivoiceEndpoint).toBe("http://127.0.0.1:8123");
    expect(cfg.vieneuStreamEndpoint).toBe("http://127.0.0.1:8001");
    expect(cfg.ttsConcurrency).toBe(1);
  });

  it("respects OMNIVOICE_ENDPOINT override", () => {
    process.env.OMNIVOICE_ENDPOINT = "http://localhost:9000";
    const cfg = loadConfig();
    expect(cfg.omnivoiceEndpoint).toBe("http://localhost:9000");
  });

  it("respects VieNeu config overrides", () => {
    process.env.TTS_PROVIDER = "vieneu";
    process.env.VIENEU_STREAM_ENDPOINT = "http://localhost:8002";
    process.env.VIENEU_VOICE = "Phạm Tuyên";
    const cfg = loadConfig();
    expect(cfg.ttsProvider).toBe("vieneu");
    expect(cfg.vieneuStreamEndpoint).toBe("http://localhost:8002");
    expect(cfg.vieneuVoice).toBe("Phạm Tuyên");
  });

  it("accepts mixed provider", () => {
    process.env.TTS_PROVIDER = "mixed";
    const cfg = loadConfig();
    expect(cfg.ttsProvider).toBe("mixed");
  });

  it("rejects unknown providers", () => {
    process.env.TTS_PROVIDER = "elevenlabs";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
