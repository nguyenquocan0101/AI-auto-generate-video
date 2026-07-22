import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  unlinkSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, normalize, relative } from "node:path";
import {
  createStudioJob,
  StudioJobSchema,
  StudioSourceSchema,
  parseStudioDocument,
  type StudioJob,
  type StudioSource,
  type StudioDocument,
} from "./contracts.js";
import { invalidateStudioJob, reconcileStudioJob, type ArtifactFiles } from "./artifact-state.js";
import {
  fingerprint,
  fingerprintComposition,
  fingerprintHyperFramesVideo,
  fingerprintHyperFramesVoice,
  fingerprintShortClip,
} from "./fingerprints.js";

export interface ProjectStoreOptions {
  outputRoot: string;
}

export interface ProjectRecord {
  project: string;
  projectRoot: string;
  script: StudioDocument;
  graph: unknown;
  job: StudioJob;
  sidecarError: string | null;
  assets: {
    clips: Record<string, string>;
    voices: Record<string, string>;
    finalVideo: boolean;
    finalVoice: boolean;
  };
}

export interface SaveProjectInput {
  project: string;
  script: unknown;
  graph?: unknown;
  source?: StudioSource;
  activeArtifacts?: string[];
}

export interface ProjectListEntry {
  id: string;
  title: string;
  sceneCount: number;
  unitCount: number;
  renderer: "hyperframes" | "ct-short-clip";
  hasFinalVideo: boolean;
  updatedAt: number;
}

function validProjectName(project: string): boolean {
  return typeof project === "string" && /^[a-zA-Z0-9_-]+$/.test(project);
}

function fileWithin(root: string, requestPath: string): string | null {
  const file = normalize(join(root, requestPath));
  return relative(root, file).startsWith("..") ? null : file;
}

function writeJsonAtomic(path: string, value: unknown): void {
  const temporary = `${path}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function latestVoiceFile(projectRoot: string, sceneId: string): string | null {
  const voiceRoot = join(projectRoot, "voice");
  if (!existsSync(voiceRoot)) return null;
  return readdirSync(voiceRoot)
    .filter((file) => file.endsWith(".mp3") && file.startsWith(`scene-${sceneId}-`))
    .map((file) => ({ file, mtime: statSync(join(voiceRoot, file)).mtimeMs }))
    .sort((left, right) => right.mtime - left.mtime)[0]?.file ?? null;
}

function filesForScript(projectRoot: string, script: StudioDocument): {
  files: Record<string, ArtifactFiles | boolean>;
  voicePaths: Record<string, string>;
  clipPaths: Record<string, string>;
} {
  const files: Record<string, ArtifactFiles | boolean> = {};
  const voicePaths: Record<string, string> = {};
  const clipPaths: Record<string, string> = {};
  if (script.renderer === "ct-short-clip") {
    files["short-clip"] = { video: existsSync(join(projectRoot, "video.mp4")) };
    files.composition = existsSync(join(projectRoot, "video.mp4"));
    return { files, voicePaths, clipPaths };
  }
  for (const scene of script.scenes) {
    const voice = latestVoiceFile(projectRoot, scene.id);
    const clipPath = join(projectRoot, "clips", `scene-${scene.id}.mp4`);
    files[scene.id] = { voice: voice !== null, video: existsSync(clipPath) };
    if (voice) voicePaths[scene.id] = `voice/${voice}`;
    if (existsSync(clipPath)) clipPaths[scene.id] = `clips/scene-${scene.id}.mp4`;
  }
  files.composition = existsSync(join(projectRoot, "video.mp4"));
  return { files, voicePaths, clipPaths };
}

function currentJob(script: StudioDocument, previous: StudioJob | null, source: StudioSource, files: ReturnType<typeof filesForScript>, activeArtifacts: string[]): StudioJob {
  const scriptFingerprint = fingerprint(script);
  if (script.renderer === "ct-short-clip") {
    const old = previous?.renderer === "ct-short-clip" ? previous.units[0] : undefined;
    const oldClip = old?.kind === "short-clip" ? old : undefined;
    const video = fingerprintShortClip(script);
    let shortJob = createStudioJob({
      renderer: "ct-short-clip",
      source,
      scriptFingerprint,
      units: [{
        id: "short-clip",
        kind: "short-clip",
        fingerprints: { video },
        artifacts: {
          video: {
            status: oldClip?.artifacts.video.status ?? "missing",
            path: oldClip?.artifacts.video.path ?? "video.mp4",
            currentFingerprint: video,
            successfulFingerprint: oldClip?.artifacts.video.successfulFingerprint ?? null,
            error: oldClip?.artifacts.video.error,
          },
        },
      }],
      composition: null,
    });
    shortJob = reconcileStudioJob(shortJob, { files: files.files, activeArtifacts });
    if (oldClip && oldClip.fingerprints.video !== video) shortJob = invalidateStudioJob(shortJob, { type: "short-clip" });
    return shortJob;
  }
  const unitInputs = script.scenes.map((scene) => {
    const old = previous?.units.find((unit) => unit.id === scene.id);
    const oldScene = old?.kind === "scene" ? old : undefined;
    const voice = fingerprintHyperFramesVoice(script, scene.id);
    const video = fingerprintHyperFramesVideo(script, scene.id);
    return {
      id: scene.id,
      kind: "scene" as const,
      fingerprints: { voice, video },
      artifacts: {
        voice: {
          status: oldScene?.artifacts.voice.status ?? "missing" as const,
          path: oldScene?.artifacts.voice.path ?? files.voicePaths[scene.id] ?? `voice/scene-${scene.id}.mp3`,
          currentFingerprint: voice,
          successfulFingerprint: oldScene?.artifacts.voice.successfulFingerprint ?? null,
          error: oldScene?.artifacts.voice.error,
        },
        video: {
          status: oldScene?.artifacts.video.status ?? "missing" as const,
          path: oldScene?.artifacts.video.path ?? files.clipPaths[scene.id] ?? `clips/scene-${scene.id}.mp4`,
          currentFingerprint: video,
          successfulFingerprint: oldScene?.artifacts.video.successfulFingerprint ?? null,
          error: oldScene?.artifacts.video.error,
        },
      },
    };
  });
  const compositionFingerprint = fingerprintComposition(script);
  const oldComposition = previous?.composition;
  const base = createStudioJob({
    renderer: "hyperframes",
    source,
    scriptFingerprint,
    units: unitInputs,
    composition: {
      status: oldComposition?.status ?? "missing",
      path: oldComposition?.path ?? "video.mp4",
      currentFingerprint: compositionFingerprint,
      successfulFingerprint: oldComposition?.successfulFingerprint ?? null,
      error: oldComposition?.error,
    },
  });
  let next = reconcileStudioJob(base, { files: files.files, activeArtifacts });
  if (previous) {
    for (const scene of script.scenes) {
      const old = previous.units.find((unit) => unit.id === scene.id);
      const current = next.units.find((unit) => unit.id === scene.id);
      if (!old || old.kind !== "scene" || !current || current.kind !== "scene") continue;
      if (old.fingerprints.voice !== current.fingerprints.voice) {
        next = invalidateStudioJob(next, { type: "scene-voice", sceneId: scene.id });
      } else if (old.fingerprints.video !== current.fingerprints.video) {
        next = invalidateStudioJob(next, { type: "scene-visual", sceneId: scene.id });
      }
    }
    if (previous.composition?.currentFingerprint !== next.composition?.currentFingerprint && next.composition && next.composition.status !== "rendering") {
      next.composition.status = "stale";
    }
  }
  return next;
}

function hasRendering(job: StudioJob | null): boolean {
  return Boolean(job?.units.some((unit) => Object.values(unit.artifacts).some((artifact) => artifact.status === "rendering")) || job?.composition?.status === "rendering");
}

export class ProjectStore {
  readonly outputRoot: string;

  constructor(options: ProjectStoreOptions) {
    this.outputRoot = options.outputRoot;
  }

  projectRoot(project: string): string {
    if (!validProjectName(project)) throw new Error("Invalid project name");
    const root = fileWithin(this.outputRoot, project);
    if (!root) throw new Error("Project path is outside output root");
    return root;
  }

  private readScript(projectRoot: string): StudioDocument {
    const raw = JSON.parse(readFileSync(join(projectRoot, "script.json"), "utf8"));
    return parseStudioDocument(raw);
  }

  private readPreviousJob(projectRoot: string): { job: StudioJob | null; error: string | null } {
    const path = join(projectRoot, "studio-job.json");
    if (!existsSync(path)) return { job: null, error: null };
    try {
      return { job: StudioJobSchema.parse(JSON.parse(readFileSync(path, "utf8"))), error: null };
    } catch {
      return {
        job: null,
        error: "studio-job.json is invalid; repair or move it aside, then reload Studio",
      };
    }
  }

  load(project: string, activeArtifacts: string[] = []): ProjectRecord {
    const projectRoot = this.projectRoot(project);
    if (!existsSync(join(projectRoot, "script.json"))) throw new Error("Project not found");
    const script = this.readScript(projectRoot);
    const previousState = this.readPreviousJob(projectRoot);
    const previous = previousState.job;
    const files = filesForScript(projectRoot, script);
    const source = previous?.source ?? { kind: "import" as const, value: `output/${project}/script.json` };
    const job = currentJob(script, previous, source, files, activeArtifacts);
    if (!activeArtifacts.length && hasRendering(previous) && !hasRendering(job)) {
      writeJsonAtomic(join(projectRoot, "studio-job.json"), job);
    }
    const graphPath = join(projectRoot, "studio-graph.json");
    const graph = existsSync(graphPath) ? JSON.parse(readFileSync(graphPath, "utf8")) : null;
    return {
      project,
      projectRoot,
      script,
      graph,
      job,
      sidecarError: previousState.error,
      assets: {
        clips: files.clipPaths,
        voices: files.voicePaths,
        finalVideo: files.files.composition === true,
        finalVoice: existsSync(join(projectRoot, "voice.mp3")),
      },
    };
  }

  persist(record: ProjectRecord): void {
    if (record.sidecarError) throw new Error(record.sidecarError);
    writeJsonAtomic(join(record.projectRoot, "studio-job.json"), StudioJobSchema.parse(record.job));
  }

  create(project: string, scriptInput: unknown, source?: StudioSource): ProjectRecord {
    const projectRoot = this.projectRoot(project);
    if (existsSync(projectRoot)) throw new Error("Project already exists");
    const script = parseStudioDocument(scriptInput);
    const validatedSource = source ? StudioSourceSchema.parse(source) : undefined;
    mkdirSync(projectRoot, { recursive: true });
    try {
      writeJsonAtomic(join(projectRoot, "script.json"), script);
      const record = this.load(project);
      if (validatedSource) record.job.source = validatedSource;
      this.persist(record);
      return record;
    } catch (error) {
      rmSync(projectRoot, { recursive: true, force: true });
      throw error;
    }
  }

  projectExists(project: string): boolean {
    return existsSync(this.projectRoot(project));
  }

  save(input: SaveProjectInput): ProjectRecord {
    const projectRoot = this.projectRoot(input.project);
    if (!existsSync(join(projectRoot, "script.json"))) throw new Error("Project not found");
    const previousState = this.readPreviousJob(projectRoot);
    if (previousState.error) throw new Error(previousState.error);
    const script = parseStudioDocument(input.script);
    const validatedSource = input.source ? StudioSourceSchema.parse(input.source) : undefined;
    const scriptPath = join(projectRoot, "script.json");
    const graphPath = join(projectRoot, "studio-graph.json");
    const sidecarPath = join(projectRoot, "studio-job.json");
    const previousScript = readFileSync(scriptPath, "utf8");
    const previousGraph = existsSync(graphPath) ? readFileSync(graphPath, "utf8") : null;
    const previousSidecar = existsSync(sidecarPath) ? readFileSync(sidecarPath, "utf8") : null;
    try {
      writeJsonAtomic(scriptPath, script);
      if (input.graph !== undefined) writeJsonAtomic(graphPath, input.graph);
      const record = this.load(input.project, input.activeArtifacts ?? []);
      if (validatedSource) record.job.source = validatedSource;
      this.persist(record);
      return record;
    } catch (error) {
      writeFileSync(scriptPath, previousScript, "utf8");
      if (previousGraph === null) {
        if (existsSync(graphPath)) unlinkSync(graphPath);
      } else writeFileSync(graphPath, previousGraph, "utf8");
      if (previousSidecar === null) {
        if (existsSync(sidecarPath)) unlinkSync(sidecarPath);
      } else writeFileSync(sidecarPath, previousSidecar, "utf8");
      throw error;
    }
  }

  list(): ProjectListEntry[] {
    if (!existsSync(this.outputRoot)) return [];
    return readdirSync(this.outputRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && validProjectName(entry.name))
      .map((entry) => {
        try {
          const record = this.load(entry.name);
          return {
            id: entry.name,
            title: record.script.renderer === "hyperframes" ? record.script.metadata.title : record.script.title,
            sceneCount: record.script.renderer === "hyperframes" ? record.script.scenes.length : 1,
            unitCount: record.job.units.length,
            renderer: record.script.renderer,
            hasFinalVideo: record.assets.finalVideo,
            updatedAt: statSync(join(record.projectRoot, "script.json")).mtimeMs,
          };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is ProjectListEntry => entry !== null)
      .sort((left, right) => right.updatedAt - left.updatedAt);
  }
}
