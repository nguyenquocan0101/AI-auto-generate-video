import {
  createStudioJob,
  type ArtifactStatus,
  type StudioArtifact,
  type StudioJob,
  type StudioRenderUnit,
  StudioJobSchema,
} from "./contracts.js";

export type StudioChange =
  | { type: "scene-voice"; sceneId: string }
  | { type: "scene-visual"; sceneId: string }
  | { type: "voice-global" }
  | { type: "sfx" }
  | { type: "order" }
  | { type: "short-clip" };

function copyJob(job: StudioJob): StudioJob {
  return StudioJobSchema.parse(JSON.parse(JSON.stringify(job)));
}

function markStale(artifact: StudioArtifact): void {
  if (artifact.status === "rendering") return;
  artifact.status = "stale";
  artifact.error = undefined;
}

function markUnitStale(unit: StudioRenderUnit, kind: "voice" | "video"): void {
  if (unit.kind === "scene") markStale(unit.artifacts[kind]);
  else if (kind === "video") markStale(unit.artifacts.video);
}

function markCompositionStale(job: StudioJob): void {
  if (job.composition) markStale(job.composition);
}

export function invalidateStudioJob(job: StudioJob, change: StudioChange): StudioJob {
  const next = copyJob(job);
  if (next.renderer === "ct-short-clip") {
    if (change.type === "short-clip") markUnitStale(next.units[0], "video");
    return next;
  }

  switch (change.type) {
    case "scene-voice": {
      const unit = next.units.find((item) => item.id === change.sceneId);
      if (!unit || unit.kind !== "scene") throw new Error(`Unknown scene unit: ${change.sceneId}`);
      markUnitStale(unit, "voice");
      markUnitStale(unit, "video");
      markCompositionStale(next);
      break;
    }
    case "scene-visual": {
      const unit = next.units.find((item) => item.id === change.sceneId);
      if (!unit || unit.kind !== "scene") throw new Error(`Unknown scene unit: ${change.sceneId}`);
      markUnitStale(unit, "video");
      markCompositionStale(next);
      break;
    }
    case "voice-global":
      for (const unit of next.units) {
        markUnitStale(unit, "voice");
        markUnitStale(unit, "video");
      }
      markCompositionStale(next);
      break;
    case "sfx":
      markCompositionStale(next);
      break;
    case "order":
      for (const unit of next.units) {
        markUnitStale(unit, "voice");
        markUnitStale(unit, "video");
      }
      markCompositionStale(next);
      break;
  }
  return next;
}

export interface ArtifactFiles {
  voice?: boolean;
  video?: boolean;
}

export interface ReconcileInput {
  files: Record<string, ArtifactFiles | boolean>;
  composition?: boolean;
  activeArtifacts: string[];
}

export interface LegacyReconcileInput extends ReconcileInput {
  renderer: "hyperframes" | "ct-short-clip";
  unitIds: string[];
}

function reconcileArtifact(
  artifact: StudioArtifact,
  fileExists: boolean,
  active: boolean,
  preserveFailed: boolean,
): StudioArtifact {
  if (active) return { ...artifact, status: "rendering", error: undefined };
  if (artifact.status === "rendering") return { ...artifact, status: "stale", error: undefined };
  if (preserveFailed && artifact.status === "failed") return { ...artifact };
  if (!fileExists) return { ...artifact, status: "missing", error: undefined };
  return {
    ...artifact,
    status: artifact.successfulFingerprint === artifact.currentFingerprint ? "ready" : "stale",
    error: undefined,
  };
}

function legacyJob(input: LegacyReconcileInput): StudioJob {
  const zero = "0".repeat(64);
  const units = input.unitIds.map((id) => {
    const entry = input.files[id];
    const files = typeof entry === "object" ? entry : {};
    const artifact = (path: string, exists: boolean): StudioArtifact => ({
      status: exists ? "stale" : "missing",
      path,
      currentFingerprint: zero,
      successfulFingerprint: null,
    });
    if (input.renderer === "ct-short-clip") {
      return { id, kind: "short-clip" as const, fingerprints: { video: zero }, artifacts: { video: artifact("video.mp4", files.video === true) } };
    }
    return {
      id,
      kind: "scene" as const,
      fingerprints: { voice: zero, video: zero },
      artifacts: {
        voice: artifact(`voice/${id}.mp3`, files.voice === true),
        video: artifact(`clips/${id}.mp4`, files.video === true),
      },
    };
  });
  const composition = input.renderer === "ct-short-clip" ? null : {
    status: (input.composition ?? input.files.composition) === true ? "stale" as ArtifactStatus : "missing" as ArtifactStatus,
    path: "video.mp4",
    currentFingerprint: zero,
    successfulFingerprint: null,
  };
  return createStudioJob({
    renderer: input.renderer,
    source: { kind: "import", value: "legacy" },
    scriptFingerprint: zero,
    units,
    composition,
  });
}

export function reconcileStudioJob(job: StudioJob | null, input: ReconcileInput | LegacyReconcileInput): StudioJob {
  if (job === null) return legacyJob(input as LegacyReconcileInput);
  const next = copyJob(job);
  for (const unit of next.units) {
    const entry = input.files[unit.id];
    const files = typeof entry === "object" ? entry : {};
    const activeVoice = input.activeArtifacts.includes(`${unit.id}:voice`);
    const activeVideo = input.activeArtifacts.includes(`${unit.id}:video`);
    if (unit.kind === "scene") {
      unit.artifacts.voice = reconcileArtifact(unit.artifacts.voice, files.voice === true, activeVoice, true);
      unit.artifacts.video = reconcileArtifact(unit.artifacts.video, files.video === true, activeVideo, true);
    } else {
      unit.artifacts.video = reconcileArtifact(unit.artifacts.video, files.video === true, activeVideo, true);
    }
  }
  if (next.composition) {
    const compositionActive = input.activeArtifacts.includes("composition");
    const dependencyReady = next.units.every((unit) => unit.kind === "short-clip" ? unit.artifacts.video.status === "ready" : unit.artifacts.voice.status === "ready" && unit.artifacts.video.status === "ready");
    next.composition = reconcileArtifact(next.composition, (input.composition ?? input.files.composition) === true, compositionActive, true);
    if (next.composition.status === "ready" && !dependencyReady) next.composition.status = "stale";
  }
  return next;
}
