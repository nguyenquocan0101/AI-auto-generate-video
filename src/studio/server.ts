import { spawn } from "node:child_process";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { createHyperFramesAdapter, type HyperFramesAdapter } from "./adapters/hyperframes-adapter.js";
import { createShortClipAdapter, type ShortClipAdapter } from "./adapters/short-clip-adapter.js";
import { createHttpRoutes, type RouteResult } from "./http-routes.js";
import { RenderJobManager, type RenderExecutionContext, type StudioRenderJob } from "./render-jobs.js";
import { ProjectStore, type ProjectRecord } from "./project-store.js";
import { StudioProjectGenerateRequestSchema } from "./contracts.js";
import {
  createClaudeGenerationAdapter,
  createGeminiGenerationAdapter,
  createOpenAIGenerationAdapter,
  redactSecrets,
} from "./generation/provider-adapters.js";
import { createDisabledGenerationAdapter, createLocalProcessGenerationAdapter } from "./generation/local-process-adapter.js";
import { GenerationMetadataSchema, type GenerationProvider, type LessonGenerationAdapter } from "./generation/types.js";

export interface RenderRunnerContext extends RenderExecutionContext {
  command: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

export type RenderRunner = (context: RenderRunnerContext) => Promise<void> | void;

export interface StudioServerOptions {
  outputRoot: string;
  studioRoot: string;
  cwd?: string;
  hyperframesAdapter?: HyperFramesAdapter;
  shortClipAdapter?: ShortClipAdapter;
  generationAdapters?: Partial<Record<GenerationProvider, LessonGenerationAdapter>>;
  runner?: RenderRunner;
}

const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

function mediaUrl(project: string, ...parts: string[]): string {
  return `/media/${[project, ...parts].map(encodeURIComponent).join("/")}`;
}

function safeFile(root: string, requestPath: string): string | null {
  const file = normalize(join(root, requestPath));
  return relative(root, file).startsWith("..") ? null : file;
}

function sendStatic(root: string, requestPath: string, request: IncomingMessage, response: ServerResponse, media = false): void {
  const file = safeFile(root, requestPath);
  if (!file || !existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  const size = statSync(file).size;
  const type = contentTypes[extname(file)] ?? "application/octet-stream";
  const range = request.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : 0;
    const end = match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (!match || start > end || start >= size) {
      response.writeHead(416, { "Content-Range": `bytes */${size}` }).end();
      return;
    }
    response.writeHead(206, {
      "Content-Type": type,
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
    });
    createReadStream(file, { start, end }).pipe(response);
    return;
  }
  response.writeHead(200, {
    "Content-Type": type,
    "Content-Length": size,
    "Accept-Ranges": "bytes",
    "Cache-Control": media ? "public, max-age=31536000, immutable" : "no-store",
  });
  createReadStream(file).pipe(response);
}

function requestError(error: unknown, fallback: string): RouteResult {
  const issues = error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)
    ? error.issues.map((issue: { path?: unknown[]; message?: string }) => ({ path: issue.path ?? [], message: issue.message ?? "Invalid value" }))
    : undefined;
  return { status: 400, body: { error: error instanceof Error ? error.message : fallback, ...(issues ? { fields: issues } : {}) } };
}

function localGenerationAdapter(cwd: string): LessonGenerationAdapter {
  const executable = process.env.STUDIO_GENERATOR_EXECUTABLE;
  if (!executable) return createDisabledGenerationAdapter();
  try {
    const argsValue = process.env.STUDIO_GENERATOR_ARGS ? JSON.parse(process.env.STUDIO_GENERATOR_ARGS) : [];
    if (!Array.isArray(argsValue) || argsValue.some((value) => typeof value !== "string")) {
      return createDisabledGenerationAdapter("STUDIO_GENERATOR_ARGS must be a JSON string array");
    }
    return createLocalProcessGenerationAdapter({ executable, args: argsValue, cwd });
  } catch {
    return createDisabledGenerationAdapter("STUDIO_GENERATOR_ARGS contains invalid JSON");
  }
}

function defaultRunner(context: RenderRunnerContext, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(context.command, context.args, {
      cwd,
      windowsHide: true,
      env: context.env,
    });
    let output = "";
    let lineBuffer = "";
    const consume = (chunk: Buffer) => {
      const text = chunk.toString();
      output = (output + text).slice(-8000);
      lineBuffer += text;
      const lines = lineBuffer.split(/\r?\n/);
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("@@STUDIO_PROGRESS@@")) continue;
        try {
          const update = JSON.parse(line.slice("@@STUDIO_PROGRESS@@".length));
          context.job.progress = Number(update.percent) || context.job.progress;
          context.job.message = String(update.message || context.job.message);
        } catch {
          // The process exit remains authoritative when a progress line is malformed.
        }
      }
    };
    child.stdout.on("data", consume);
    child.stderr.on("data", consume);
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(output.trim().slice(-3000) || `Pipeline exited with code ${code}`)));
  });
}

function targetKeys(renderer: string, mode: string, sceneId: string | null): string[] {
  if (renderer === "ct-short-clip") return mode === "video" ? ["short-clip:video"] : [];
  if (mode === "compose") return ["composition"];
  if (!sceneId) return [];
  if (mode === "audio") return [`${sceneId}:voice`];
  if (mode === "video") return [`${sceneId}:video`];
  return [`${sceneId}:voice`, `${sceneId}:video`];
}

function composePrerequisites(record: ProjectRecord): string[] {
  if (record.script.renderer === "ct-short-clip") return [];
  const missing: string[] = [];
  for (const unit of record.job.units) {
    if (unit.kind !== "scene") continue;
    if (unit.artifacts.voice.status !== "ready") missing.push(`${unit.id}:voice`);
    if (unit.artifacts.video.status !== "ready") missing.push(`${unit.id}:video`);
  }
  return missing;
}

function markFinish(record: ProjectRecord, job: StudioRenderJob): void {
  const matchesSnapshot = record.job.scriptFingerprint === job.snapshotScriptFingerprint;
  if (job.status === "done" && matchesSnapshot) {
    for (const key of job.artifactKeys) {
      if (key === "composition" && record.job.composition) {
        if (record.job.composition.status === "missing") continue;
        record.job.composition.successfulFingerprint = record.job.composition.currentFingerprint;
        record.job.composition.status = "ready";
        continue;
      }
      if (record.script.renderer === "ct-short-clip" && key === "short-clip:video") {
        const unit = record.job.units[0];
        if (unit?.kind === "short-clip") {
          if (unit.artifacts.video.status !== "missing") {
            unit.artifacts.video.successfulFingerprint = unit.artifacts.video.currentFingerprint;
            unit.artifacts.video.status = "ready";
          }
        }
        continue;
      }
      const [sceneId, kind] = key.split(":");
      const unit = record.job.units.find((item) => item.id === sceneId);
      if (!unit || unit.kind !== "scene" || (kind !== "voice" && kind !== "video")) continue;
      const artifact = unit.artifacts[kind];
      if (artifact.status === "missing") continue;
      artifact.successfulFingerprint = artifact.currentFingerprint;
      artifact.status = "ready";
    }
  } else if (job.status === "error") {
    for (const key of job.artifactKeys) {
      if (key === "composition" && record.job.composition) {
        record.job.composition.status = "failed";
        record.job.composition.error = { code: "RENDER_FAILED", message: job.error };
        continue;
      }
      if (record.script.renderer === "ct-short-clip" && key === "short-clip:video") {
        const unit = record.job.units[0];
        if (unit?.kind === "short-clip") {
          unit.artifacts.video.status = "failed";
          unit.artifacts.video.error = { code: "RENDER_FAILED", message: job.error };
        }
        continue;
      }
      const [sceneId, kind] = key.split(":");
      const unit = record.job.units.find((item) => item.id === sceneId);
      if (!unit || unit.kind !== "scene" || (kind !== "voice" && kind !== "video")) continue;
      unit.artifacts[kind].status = "failed";
      unit.artifacts[kind].error = { code: "RENDER_FAILED", message: job.error };
    }
  }
}

export function createStudioServer(options: StudioServerOptions) {
  const cwd = options.cwd ?? process.cwd();
  const store = new ProjectStore({ outputRoot: options.outputRoot });
  const adapter = options.hyperframesAdapter ?? createHyperFramesAdapter();
  const shortClipAdapter = options.shortClipAdapter ?? createShortClipAdapter();
  const generationAdapters: Record<GenerationProvider, LessonGenerationAdapter> = {
    local: localGenerationAdapter(cwd),
    openai: createOpenAIGenerationAdapter(),
    claude: createClaudeGenerationAdapter(),
    gemini: createGeminiGenerationAdapter(),
    ...options.generationAdapters,
  };
  let manager: RenderJobManager;
  const runner = options.runner ?? ((context: RenderRunnerContext) => defaultRunner(context, cwd));
  manager = new RenderJobManager({
    execute: async (context) => {
      const record = store.load(context.job.project, context.job.artifactKeys);
      if (record.script.renderer === "ct-short-clip") {
        await shortClipAdapter.render({
          projectRoot: record.projectRoot,
          spec: record.script,
          force: true,
          reportProgress: (percent, message) => {
            context.job.progress = percent;
            context.job.message = message;
          },
        });
        return;
      }
      const command = adapter.command({
        projectRoot: record.projectRoot,
        scriptPath: join(record.projectRoot, "script.json"),
        mode: context.mode as "audio" | "video" | "scene" | "compose",
        sceneId: context.sceneId,
        cwd,
      });
      command.env.TTS_PROVIDER = record.script.voice.provider;
      if (record.script.voice.vieneuVoice) command.env.VIENEU_VOICE = record.script.voice.vieneuVoice;
      await runner({ ...context, command: command.command, args: command.args, env: command.env });
    },
    onFinish: (job) => {
      try {
        const record = store.load(job.project);
        markFinish(record, job);
        store.persist(record);
      } catch {
        // The job result remains available through /api/jobs even if its project was removed.
      }
    },
  });

  const manifest = (project: string): RouteResult => {
    try {
      const active = manager.active(project);
      const activeKeys = active?.artifactKeys ?? [];
      const record = store.load(project, activeKeys);
      return {
        status: 200,
        body: {
          script: record.script,
          graph: record.graph,
          renderer: record.script.renderer,
          job: record.job,
          units: record.job.units,
          composition: record.job.composition,
          renderLock: active ? { jobId: active.id, mode: active.mode, sceneId: active.sceneId } : null,
          readOnly: record.sidecarError !== null,
          warnings: record.sidecarError ? [record.sidecarError] : [],
          assets: {
            clips: Object.fromEntries(Object.entries(record.assets.clips).map(([id, path]) => [id, mediaUrl(project, ...path.split("/"))])),
            voices: Object.fromEntries(Object.entries(record.assets.voices).map(([id, path]) => [id, mediaUrl(project, ...path.split("/"))])),
            finalVideo: record.assets.finalVideo ? mediaUrl(project, "video.mp4") : "",
            finalVoice: record.assets.finalVoice ? mediaUrl(project, "voice.mp3") : "",
          },
        },
      };
    } catch (error) {
      return { status: 404, body: { error: error instanceof Error ? error.message : "Project not found" } };
    }
  };

  const api = createHttpRoutes({
    project: manifest,
    projects: () => ({
      status: 200,
      body: {
        projects: store.list().map(({ hasFinalVideo, ...project }) => ({
          ...project,
          finalVideo: hasFinalVideo ? mediaUrl(project.id, "video.mp4") : "",
        })),
      },
    }),
    create: (body) => {
      try {
        const record = store.create(body.project, body.script, body.source);
        return { status: 201, body: { ok: true, project: record.project, renderer: record.script.renderer, job: record.job } };
      } catch (error) {
        return requestError(error, "Create project failed");
      }
    },
    generate: async (body) => {
      const apiKey = typeof body?.generation?.apiKey === "string" ? body.generation.apiKey : undefined;
      try {
        const request = StudioProjectGenerateRequestSchema.parse(body);
        if (store.projectExists(request.project)) throw new Error("Project already exists");
        const selected = generationAdapters[request.generation.provider];
        const result = await selected.generate(
          { source: request.source, renderer: request.renderer },
          { apiKey: request.generation.apiKey, model: request.generation.model },
        );
        if (result.document.renderer !== request.renderer) {
          throw new Error(`Generated renderer mismatch: expected ${request.renderer}`);
        }
        const metadata = GenerationMetadataSchema.parse(result.metadata);
        if (metadata.provider !== request.generation.provider) {
          throw new Error("Generated provider metadata mismatch");
        }
        const record = store.create(request.project, result.document, {
          kind: request.source.kind,
          value: request.source.value,
          provider: metadata.provider,
          ...(metadata.model ? { model: metadata.model } : {}),
          ...(metadata.requestId ? { requestId: metadata.requestId } : {}),
        });
        return {
          status: 201,
          body: {
            ok: true,
            project: record.project,
            renderer: record.script.renderer,
            generation: metadata,
            job: record.job,
          },
        };
      } catch (error) {
        if (error && typeof error === "object" && "issues" in error) return requestError(error, "Generation request is invalid");
        const message = redactSecrets(error instanceof Error ? error.message : String(error), [apiKey]);
        return requestError(new Error(message), "Generation failed");
      }
    },
    save: (body) => {
      try {
        const active = manager.active(body.project);
        if (active) return { status: 409, body: { error: "Project is already rendering", jobId: active.id } };
        const current = store.load(body.project);
        if (current.sidecarError) return { status: 409, body: { error: current.sidecarError } };
        const record = store.save({ project: body.project, script: body.script, graph: body.graph, source: body.source });
        return { status: 200, body: { ok: true, renderer: record.script.renderer, job: record.job } };
      } catch (error) {
        return requestError(error, "Save failed");
      }
    },
    render: (body) => {
      try {
        if (!["audio", "video", "scene", "compose"].includes(body.mode)) throw new Error("Invalid render mode");
        const active = manager.active(body.project);
        if (active) return { status: 409, body: { error: "Project is already rendering", jobId: active.id } };
        const record = store.load(body.project);
        if (record.sidecarError) return { status: 409, body: { error: record.sidecarError } };
        if (body.mode === "compose") {
          const prerequisites = composePrerequisites(record);
          if (prerequisites.length) return { status: 409, body: { error: "Render prerequisites are not ready", prerequisites } };
        }
        const sceneId = body.sceneId ?? null;
        if (record.script.renderer === "ct-short-clip") {
          if (body.mode !== "video") throw new Error("Short clip chỉ hỗ trợ render video");
          if (sceneId) throw new Error("Short clip không nhận sceneId");
        } else {
          if (body.mode !== "compose" && !sceneId) throw new Error("Scene not found");
          if (sceneId && !record.script.scenes.some((scene) => scene.id === sceneId)) throw new Error("Scene not found");
        }
        const artifactKeys = targetKeys(record.script.renderer, body.mode, sceneId);
        const activeRecord = store.load(body.project, artifactKeys);
        store.persist(activeRecord);
        const job = manager.start({
          project: body.project,
          projectRoot: record.projectRoot,
          renderer: record.script.renderer,
          mode: body.mode,
          sceneId,
          artifactKeys,
          snapshotScriptFingerprint: record.job.scriptFingerprint,
        });
        return { status: 202, body: { jobId: job.id, renderer: record.script.renderer, artifactKeys } };
      } catch (error) {
        if (error instanceof Error && error.message === "Project is already rendering") return { status: 409, body: { error: error.message } };
        return { status: 400, body: { error: error instanceof Error ? error.message : "Render failed" } };
      }
    },
    job: (id) => {
      const job = manager.get(id);
      return job ? { status: 200, body: job } : { status: 404, body: { error: "Job not found" } };
    },
  });

  const server = createServer(async (request, response) => {
    if (await api(request, response)) return;
    const url = new URL(request.url ?? "/", "http://localhost");
    const isMedia = url.pathname.startsWith("/media/");
    const requestPath = decodeURIComponent(isMedia ? url.pathname.slice("/media/".length) : url.pathname === "/" ? "index.html" : url.pathname.slice(1));
    sendStatic(isMedia ? options.outputRoot : options.studioRoot, requestPath, request, response, isMedia);
  });
  return server;
}
