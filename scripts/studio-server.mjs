import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";

const studioRoot = join(process.cwd(), "studio");
const outputRoot = join(process.cwd(), "output");
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};
const jobs = new Map();

function fileWithin(root, requestPath) {
  const file = normalize(join(root, requestPath));
  return relative(root, file).startsWith("..") ? null : file;
}

function mediaUrl(project, ...parts) {
  return `/media/${[project, ...parts].map(encodeURIComponent).join("/")}`;
}

function projectManifest(project) {
  if (!/^[a-zA-Z0-9_-]+$/.test(project)) return null;
  const projectRoot = fileWithin(outputRoot, project);
  const scriptPath = projectRoot && join(projectRoot, "script.json");
  if (!scriptPath || !existsSync(scriptPath)) return null;
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  const graphPath = join(projectRoot, "studio-graph.json");
  const rawGraph = existsSync(graphPath) ? JSON.parse(readFileSync(graphPath, "utf8")) : null;
  const graphNodes = ["storyboard", ...(script.scenes ?? []).map((scene) => scene.id), "output"];
  const graphSignature = graphNodes.slice().sort().join("|");
  const graph = rawGraph ? { ...rawGraph, signature: graphSignature } : null;
  const voiceRoot = join(projectRoot, "voice");
  const voiceFiles = existsSync(voiceRoot) ? readdirSync(voiceRoot).filter((file) => file.endsWith(".mp3")) : [];
  const latestVoice = (sceneId) => voiceFiles
    .filter((file) => file.startsWith(`scene-${sceneId}-`))
    .map((file) => ({ file, mtime: statSync(join(voiceRoot, file)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0]?.file;
  const clips = {};
  const voices = {};
  for (const scene of script.scenes ?? []) {
    const clipName = `scene-${scene.id}.mp4`;
    const clip = join(projectRoot, "clips", clipName);
    if (existsSync(clip)) clips[scene.id] = mediaUrl(project, "clips", clipName);
    const voice = latestVoice(scene.id);
    if (voice) voices[scene.id] = mediaUrl(project, "voice", voice);
  }
  return {
    script,
    graph,
    assets: {
      clips,
      voices,
      finalVideo: existsSync(join(projectRoot, "video.mp4")) ? mediaUrl(project, "video.mp4") : "",
      finalVoice: existsSync(join(projectRoot, "voice.mp3")) ? mediaUrl(project, "voice.mp3") : "",
    },
  };
}

function listProjects() {
  if (!existsSync(outputRoot)) return [];
  return readdirSync(outputRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && validProjectName(entry.name))
    .map((entry) => {
      const id = entry.name;
      const scriptPath = join(outputRoot, id, "script.json");
      if (!existsSync(scriptPath)) return null;
      try {
        const script = JSON.parse(readFileSync(scriptPath, "utf8"));
        return {
          id,
          title: script.metadata?.title || id,
          sceneCount: Array.isArray(script.scenes) ? script.scenes.length : 0,
          updatedAt: statSync(scriptPath).mtimeMs,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" }).end(JSON.stringify(value));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function validProjectName(project) {
  return typeof project === "string" && /^[a-zA-Z0-9_-]+$/.test(project);
}

function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(temporary, path);
}

function startRenderJob({ project, mode, sceneId }) {
  const projectRoot = fileWithin(outputRoot, project);
  const scriptPath = join(projectRoot, "script.json");
  const script = JSON.parse(readFileSync(scriptPath, "utf8"));
  const job = {
    id: randomUUID(),
    project,
    mode,
    sceneId: sceneId ?? null,
    status: "running",
    progress: 2,
    message: "Đang khởi động pipeline",
    error: "",
  };
  jobs.set(job.id, job);

  const command = process.execPath;
  const args = [join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs"), "src/cli.ts", scriptPath, "--mode", mode, "--studio-progress"];
  if (sceneId) args.push("--scene", sceneId);
  if (mode === "audio" || mode === "video" || mode === "scene") args.push("--force");
  const provider = script.voice?.provider ?? "omnivoice";
  const child = spawn(command, args, {
    cwd: process.cwd(),
    windowsHide: true,
    env: {
      ...process.env,
      TTS_PROVIDER: provider,
      ...(script.voice?.vieneuVoice ? { VIENEU_VOICE: script.voice.vieneuVoice } : {}),
    },
  });

  let output = "";
  let lineBuffer = "";
  const consume = (chunk) => {
    const text = chunk.toString();
    output = (output + text).slice(-8000);
    lineBuffer += text;
    const lines = lineBuffer.split(/\r?\n/);
    lineBuffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("@@STUDIO_PROGRESS@@")) continue;
      try {
        const update = JSON.parse(line.slice("@@STUDIO_PROGRESS@@".length));
        job.progress = Number(update.percent) || job.progress;
        job.message = String(update.message || job.message);
      } catch {
        // Ignore malformed progress lines; process completion remains authoritative.
      }
    }
  };
  child.stdout.on("data", consume);
  child.stderr.on("data", consume);
  child.on("error", (error) => {
    job.status = "error";
    job.error = error.message;
    job.message = "Không thể khởi động pipeline";
  });
  child.on("close", (code) => {
    if (code === 0) {
      job.status = "done";
      job.progress = 100;
      job.message = "Render hoàn tất";
      return;
    }
    job.status = "error";
    job.error = output.trim().slice(-3000) || `Pipeline exited with code ${code}`;
    job.message = "Render thất bại";
  });
  return job;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === "/api/project") {
    const manifest = projectManifest(url.searchParams.get("name") ?? "");
    if (!manifest) {
      sendJson(response, 404, { error: "Project not found" });
      return;
    }
    sendJson(response, 200, manifest);
    return;
  }
  if (url.pathname === "/api/projects" && request.method === "GET") {
    sendJson(response, 200, { projects: listProjects() });
    return;
  }
  if (url.pathname === "/api/project/create" && request.method === "POST") {
    try {
      const body = await readJson(request);
      if (!validProjectName(body.project)) throw new Error("Tên project chỉ được gồm chữ, số, _ hoặc -");
      if (!body.script || body.script.renderer !== "hyperframes" || !Array.isArray(body.script.scenes)) {
        throw new Error("Script cần có renderer=hyperframes và danh sách scenes.");
      }
      const ids = body.script.scenes.map((scene) => scene?.id);
      if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) {
        throw new Error("Scene ids phải là chuỗi duy nhất.");
      }
      const projectRoot = fileWithin(outputRoot, body.project);
      if (!projectRoot) throw new Error("Project path không hợp lệ");
      if (existsSync(projectRoot)) throw new Error("Project đã tồn tại.");
      mkdirSync(projectRoot, { recursive: true });
      writeJsonAtomic(join(projectRoot, "script.json"), body.script);
      sendJson(response, 201, { ok: true, project: body.project });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Create project failed" });
    }
    return;
  }
  if (url.pathname === "/api/project/save" && request.method === "POST") {
    try {
      const body = await readJson(request);
      if (!validProjectName(body.project)) throw new Error("Invalid project name");
      if (!body.script || body.script.renderer !== "hyperframes" || !Array.isArray(body.script.scenes)) {
        throw new Error("Invalid storyboard");
      }
      const ids = body.script.scenes.map((scene) => scene?.id);
      if (ids.some((id) => typeof id !== "string") || new Set(ids).size !== ids.length) {
        throw new Error("Scene ids must be unique strings");
      }
      const projectRoot = fileWithin(outputRoot, body.project);
      if (!projectRoot || !existsSync(join(projectRoot, "script.json"))) throw new Error("Project not found");
      writeJsonAtomic(join(projectRoot, "script.json"), body.script);
      if (body.graph) writeJsonAtomic(join(projectRoot, "studio-graph.json"), body.graph);
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Save failed" });
    }
    return;
  }
  if (url.pathname === "/api/render" && request.method === "POST") {
    try {
      const body = await readJson(request);
      if (!validProjectName(body.project)) throw new Error("Invalid project name");
      if (!["audio", "video", "scene", "compose"].includes(body.mode)) throw new Error("Invalid render mode");
      const manifest = projectManifest(body.project);
      if (!manifest) throw new Error("Project not found");
      if (body.mode !== "compose" && !manifest.script.scenes.some((scene) => scene.id === body.sceneId)) {
        throw new Error("Scene not found");
      }
      const active = [...jobs.values()].find((job) => job.project === body.project && job.status === "running");
      if (active) {
        sendJson(response, 409, { error: "Project is already rendering", jobId: active.id });
        return;
      }
      const job = startRenderJob({ project: body.project, mode: body.mode, sceneId: body.sceneId });
      sendJson(response, 202, { jobId: job.id });
    } catch (error) {
      sendJson(response, 400, { error: error instanceof Error ? error.message : "Render failed" });
    }
    return;
  }
  if (url.pathname.startsWith("/api/jobs/") && request.method === "GET") {
    const job = jobs.get(url.pathname.slice("/api/jobs/".length));
    if (!job) sendJson(response, 404, { error: "Job not found" });
    else sendJson(response, 200, job);
    return;
  }
  const isMedia = url.pathname.startsWith("/media/");
  const requestPath = decodeURIComponent(isMedia ? url.pathname.slice("/media/".length) : url.pathname === "/" ? "index.html" : url.pathname.slice(1));
  const file = fileWithin(isMedia ? outputRoot : studioRoot, requestPath);
  if (!file || !existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  const type = types[extname(file)] ?? "application/octet-stream";
  const size = statSync(file).size;
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
    if (request.method !== "HEAD") createReadStream(file, { start, end }).pipe(response);
    else response.end();
    return;
  }
  const cacheHeaders = isMedia
    ? { "Cache-Control": "public, max-age=31536000, immutable" }
    : { "Cache-Control": "no-store, no-cache, must-revalidate" };
  response.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes", ...cacheHeaders });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
});

server.listen(4173, () => console.log("Video pipeline studio: http://localhost:4173"));
