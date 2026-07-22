import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { parseStudioDocument } from "../contracts.js";
import { redactSecrets } from "./provider-adapters.js";
import type { LessonGenerationAdapter } from "./types.js";

export interface LocalProcessAdapterOptions {
  executable: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  spawnImpl?: typeof spawn;
}

export function createDisabledGenerationAdapter(message = "Local generation is not configured"): LessonGenerationAdapter {
  return {
    provider: "local",
    async generate() {
      throw new Error(message);
    },
  };
}

export function createLocalProcessGenerationAdapter(options: LocalProcessAdapterOptions): LessonGenerationAdapter {
  if (!options.executable?.trim()) return createDisabledGenerationAdapter();
  const spawnImpl = options.spawnImpl ?? spawn;
  const args = [...(options.args ?? [])];
  const timeoutMs = options.timeoutMs ?? 90_000;
  return {
    provider: "local",
    generate(input) {
      return new Promise((resolve, reject) => {
        let child: ChildProcessWithoutNullStreams;
        try {
          child = spawnImpl(options.executable, args, {
            cwd: options.cwd,
            shell: false,
            windowsHide: true,
            stdio: "pipe",
          }) as ChildProcessWithoutNullStreams;
        } catch (error) {
          reject(error);
          return;
        }
        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
          child.kill();
          reject(new Error(`Local generator timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        child.stdout.on("data", (chunk) => { stdout = (stdout + chunk.toString()).slice(-2_000_000); });
        child.stderr.on("data", (chunk) => { stderr = (stderr + chunk.toString()).slice(-8000); });
        child.on("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.stdin.on("error", () => {
          clearTimeout(timer);
          reject(new Error("Local generator stdin failed"));
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          if (code !== 0) {
            reject(new Error(redactSecrets(stderr || `Local generator exited with code ${code}`)));
            return;
          }
          try {
            const document = parseStudioDocument(JSON.parse(stdout.trim()));
            resolve({ document, metadata: { provider: "local" } });
          } catch {
            reject(new Error("Local generator returned malformed or invalid script JSON"));
          }
        });
        child.stdin.end(JSON.stringify(input));
      });
    },
  };
}
