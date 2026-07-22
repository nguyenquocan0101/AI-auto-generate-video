#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { log } from "../utils/logger.js";
import { toSlug } from "../utils/slug.js";
import { readShortClipSpec, renderShortClip } from "./renderer.js";
import type { ShortClipAlgorithm, ShortClipSpec } from "./schema.js";
import { ShortClipAlgorithmSchema, ShortClipSpecSchema } from "./schema.js";
import { specFromSource } from "./source-loader.js";

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function timestamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
}

function usage(): string {
  return [
    "Short Clip renderer",
    "",
    "  npm run short-clip -- path/to/script.json",
    "  npm run short-clip -- https://example.com/quick-sort",
    "  npm run short-clip -- article.txt",
    "",
    "Options: --algorithm quick-sort --output output/video.mp4 --count 50 --duration 43 --seed 42 --draft --force",
  ].join("\n");
}

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const args = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  if (args.length === 0 || args.includes("--help")) {
    console.log(usage());
    return;
  }

  const positional = args.find((arg, index) =>
    !arg.startsWith("--") && (index === 0 || !args[index - 1]?.startsWith("--")),
  );
  const sourceArg = valueAfter(args, "--source");
  const algorithmArg = valueAfter(args, "--algorithm");
  const countArg = valueAfter(args, "--count");
  const durationArg = valueAfter(args, "--duration");
  const seedArg = valueAfter(args, "--seed");
  const outputArg = valueAfter(args, "--output");

  let spec: ShortClipSpec;
  let specPath: string | undefined;
  if (positional && extname(positional).toLowerCase() === ".json" && existsSync(positional)) {
    specPath = resolve(positional);
    spec = await readShortClipSpec(specPath);
    if (durationArg !== undefined) {
      spec = ShortClipSpecSchema.parse({ ...spec, duration_sec: Number(durationArg) });
    }
  } else {
    const source = sourceArg ?? positional;
    if (!source) throw new Error("Thiếu URL, file, nội dung hoặc đường dẫn script.json.");
    const algorithm = algorithmArg
      ? ShortClipAlgorithmSchema.parse(algorithmArg) as ShortClipAlgorithm
      : undefined;
    spec = await specFromSource(source, {
      algorithm,
      count: countArg === undefined ? undefined : Number(countArg),
      durationSec: durationArg ? Number(durationArg) : undefined,
      seed: seedArg ? Number(seedArg) : undefined,
    });
  }

  const defaultDir = specPath
    ? dirname(specPath)
    : join("output", `${toSlug(spec.title)}-${timestamp()}`);
  const outputPath = resolve(outputArg ?? join(defaultDir, "video.mp4"));
  await mkdir(dirname(outputPath), { recursive: true });
  if (!specPath) {
    specPath = join(dirname(outputPath), "script.json");
    await writeFile(specPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
    log.info(`Generated script: ${specPath}`);
  }

  await renderShortClip(spec, {
    outputPath,
    force: args.includes("--force"),
    quality: args.includes("--draft") ? "draft" : "standard",
  });
  console.log(`\nVideo: ${outputPath}`);
  console.log(`Script: ${specPath}`);
}

main().catch((error) => {
  log.error("Short clip failed", error);
  process.exit(1);
});
