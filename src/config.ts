import "dotenv/config";

export type TtsProvider = "omnivoice" | "vieneu" | "mixed";
export type ConcreteTtsProvider = Exclude<TtsProvider, "mixed">;

export interface Config {
    ttsProvider: TtsProvider;

    // OmniVoice (local TTS server)
    omnivoiceEndpoint: string;

    // VieNeu-TTS (local FastAPI streaming server from W:\VieNeu-TTS)
    vieneuStreamEndpoint: string;
    vieneuVoice?: string;

    ttsConcurrency: number;
}

function intDefault(name: string, def: number): number {
    const v = process.env[name];
    if (!v) return def;
    const n = parseInt(v, 10);
    if (isNaN(n))
        throw new Error(`Env var ${name} must be integer, got "${v}"`);
    return n;
}

export function loadConfig(): Config {
    const provider = (process.env.TTS_PROVIDER ?? "omnivoice") as TtsProvider;
    if (!["omnivoice", "vieneu", "mixed"].includes(provider)) {
        throw new Error(
            `TTS_PROVIDER must be "omnivoice", "vieneu", or "mixed", got "${provider}"`,
        );
    }

    return {
        ttsProvider: provider,
        omnivoiceEndpoint:
            process.env.OMNIVOICE_ENDPOINT ?? "http://127.0.0.1:8123",
        vieneuStreamEndpoint:
            process.env.VIENEU_STREAM_ENDPOINT ?? "http://127.0.0.1:8001",
        vieneuVoice: process.env.VIENEU_VOICE || undefined,
        ttsConcurrency: intDefault("TTS_CONCURRENCY", 1),
    };
}
