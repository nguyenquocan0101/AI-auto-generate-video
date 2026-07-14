#!/usr/bin/env node
import axios from "axios";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { config } from "dotenv";
import { readdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join } from "node:path";
config({ path: ".env.local" });

import { runTemplatePipeline } from "./render/template-pipeline.js";
import { log } from "./utils/logger.js";

type MenuChoice = {
  label: string;
  value: string;
};

type VoiceRegion = "all" | "bac" | "nam" | "trung";

let startedVieNeuServer: ChildProcessWithoutNullStreams | undefined;

async function findScriptJsonFiles(dir = "output"): Promise<string[]> {
  const out: string[] = [];

  async function walk(current: string) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.isFile() && entry.name === "script.json") {
        out.push(path);
      }
    }
  }

  await walk(dir);
  return out.sort();
}

async function choose(rl: ReturnType<typeof createInterface>, title: string, choices: MenuChoice[]): Promise<string> {
  if (choices.length === 0) throw new Error(`${title}: no choices available`);

  console.log(`\n${title}`);
  choices.forEach((choice, idx) => {
    console.log(`  ${idx + 1}. ${choice.label}`);
  });

  while (true) {
    const answer = (await rl.question("Choose number: ")).trim();
    const idx = Number.parseInt(answer, 10) - 1;
    if (Number.isInteger(idx) && choices[idx]) {
      return choices[idx].value;
    }
    console.log(`Enter a number from 1 to ${choices.length}.`);
  }
}

async function fetchVieneuVoices(endpoint: string): Promise<MenuChoice[]> {
  const resp = await axios.get<Array<{ id?: string; name?: string }>>(`${endpoint}/voices`, {
    timeout: 10000,
  });
  return resp.data
    .map((v) => {
      const id = v.id ?? "";
      const name = v.name ?? id;
      return id ? { label: `${name} (${id})`, value: id } : undefined;
    })
    .filter((v): v is MenuChoice => Boolean(v));
}

function filterVoicesByRegion(voices: MenuChoice[], region: VoiceRegion): MenuChoice[] {
  if (region === "all") return voices;

  const regionPatterns: Record<Exclude<VoiceRegion, "all">, RegExp> = {
    bac: /(^|\s)(Bắc|Bac)(\s|$)/i,
    nam: /(^|\s)(Nam)(\s|$)/i,
    trung: /(^|\s)(Trung)(\s|$)/i,
  };

  return voices.filter((voice) => regionPatterns[region].test(voice.label));
}

function shouldAutoStartVieneu(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return ["127.0.0.1", "localhost"].includes(url.hostname);
  } catch {
    return false;
  }
}

async function waitForVieneuVoices(endpoint: string, timeoutMs: number): Promise<MenuChoice[]> {
  const deadline = Date.now() + timeoutMs;
  let lastErr: unknown;

  while (Date.now() < deadline) {
    try {
      return await fetchVieneuVoices(endpoint);
    } catch (e) {
      lastErr = e;
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error(`VieNeu server did not start at ${endpoint}`);
}

async function ensureVieneuServer(endpoint: string): Promise<MenuChoice[]> {
  try {
    return await fetchVieneuVoices(endpoint);
  } catch {
    if (!shouldAutoStartVieneu(endpoint)) {
      throw new Error(`VieNeu server is not reachable at ${endpoint}`);
    }
  }

  const vieneuDir = process.env.VIENEU_PROJECT_DIR ?? "W:\\VieNeu-TTS";
  console.log(`\nStarting VieNeu-TTS server in ${vieneuDir} ...`);
  startedVieNeuServer = spawn("uv", ["run", "python", "-m", "apps.web_stream"], {
    cwd: vieneuDir,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
    },
    windowsHide: true,
  });

  let startupLog = "";
  startedVieNeuServer.stdout.on("data", (d) => {
    startupLog += d.toString();
    if (startupLog.length > 4000) startupLog = startupLog.slice(-4000);
  });
  startedVieNeuServer.stderr.on("data", (d) => {
    startupLog += d.toString();
    if (startupLog.length > 4000) startupLog = startupLog.slice(-4000);
  });
  const exited = new Promise<never>((_, reject) => {
    startedVieNeuServer?.on("error", (e) => {
      reject(e);
    });
    startedVieNeuServer?.on("exit", (code) => {
      if (code !== null && code !== 0) {
        const details = startupLog.trim() ? `\nVieNeu startup log:\n${startupLog.trim()}` : "";
        reject(new Error(`VieNeu-TTS server exited with code ${code}.${details}`));
      }
    });
  });

  try {
    return await Promise.race([waitForVieneuVoices(endpoint, 180000), exited]);
  } catch (e) {
    startedVieNeuServer.kill();
    startedVieNeuServer = undefined;
    const details = startupLog.trim() ? `\nVieNeu startup log:\n${startupLog.trim()}` : "";
    throw new Error(`Could not start VieNeu-TTS server at ${endpoint}.${details}`, { cause: e });
  }
}

async function interactiveScriptPath(): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const scripts = await findScriptJsonFiles();
    const scriptChoices = scripts.map((path) => ({ label: path, value: path }));
    scriptChoices.push({ label: "Enter script path manually", value: "__manual__" });

    const selectedScript = await choose(rl, "Script", scriptChoices);
    const scriptPath = selectedScript === "__manual__"
      ? (await rl.question("Script path: ")).trim()
      : selectedScript;

    const provider = await choose(rl, "TTS engine", [
      { label: "OmniVoice for all scenes", value: "omnivoice" },
      { label: "VieNeu-TTS for all scenes", value: "vieneu" },
      { label: "Mixed, follow scene.ttsProvider in script", value: "mixed" },
    ]);
    process.env.TTS_PROVIDER = provider;

    if (provider === "vieneu" || provider === "mixed") {
      const endpoint = process.env.VIENEU_STREAM_ENDPOINT ?? "http://127.0.0.1:8001";
      let voiceChoices: MenuChoice[];
      try {
        voiceChoices = await ensureVieneuServer(endpoint);
      } catch (e) {
        log.error(`Could not fetch VieNeu voices from ${endpoint}/voices`, e);
        const manualVoice = (await rl.question("VieNeu voice name/id: ")).trim();
        if (manualVoice) process.env.VIENEU_VOICE = manualVoice;
        return scriptPath;
      }

      const region = await choose(rl, "VieNeu region", [
        { label: "All regions", value: "all" },
        { label: "Bac / Northern", value: "bac" },
        { label: "Nam / Southern", value: "nam" },
        { label: "Trung / Central", value: "trung" },
      ]) as VoiceRegion;

      const regionVoices = filterVoicesByRegion(voiceChoices, region);
      if (regionVoices.length > 0) {
        voiceChoices = regionVoices;
      } else {
        console.log("No voices matched that region; showing all voices.");
      }

      voiceChoices.push({ label: "Enter voice manually", value: "__manual__" });
      const selectedVoice = await choose(rl, "VieNeu voice", voiceChoices);
      const voice = selectedVoice === "__manual__"
        ? (await rl.question("VieNeu voice name/id: ")).trim()
        : selectedVoice;
      if (voice) process.env.VIENEU_VOICE = voice;
    }

    return scriptPath;
  } finally {
    rl.close();
  }
}

async function main() {
  const scriptPath = process.argv[2] ?? await interactiveScriptPath();
  try {
    // Single pipeline: vendored HyperFrames templates (renderer "hyperframes").
    await runTemplatePipeline(scriptPath);
  } catch (e) {
    log.error("Pipeline failed", e);
    process.exit(1);
  } finally {
    if (startedVieNeuServer) {
      startedVieNeuServer.kill();
    }
  }
}

main();
