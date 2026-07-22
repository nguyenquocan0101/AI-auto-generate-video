import { z } from "zod";
import { ShortClipSpecSchema } from "../short-clip/schema.js";
import { TemplateScriptSchema } from "../render/template-script-schema.js";

export const StudioRendererSchema = z.enum(["hyperframes", "ct-short-clip"]);
export type StudioRenderer = z.infer<typeof StudioRendererSchema>;

export const ArtifactStatusSchema = z.enum([
  "missing",
  "ready",
  "stale",
  "rendering",
  "failed",
]);
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

const FingerprintSchema = z.string().regex(/^[a-f0-9]{64}$/, "fingerprint must be a SHA-256 hex digest");

export const StudioSourceSchema = z.object({
  kind: z.enum(["import", "topic", "url", "skill"]),
  value: z.string().optional(),
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  requestId: z.string().min(1).optional(),
}).strict();
export type StudioSource = z.infer<typeof StudioSourceSchema>;

export const StudioErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  at: z.string().datetime().optional(),
}).strict();

export const StudioArtifactSchema = z.object({
  status: ArtifactStatusSchema,
  path: z.string().min(1).nullable(),
  currentFingerprint: FingerprintSchema.default("0".repeat(64)),
  successfulFingerprint: FingerprintSchema.nullable(),
  error: StudioErrorSchema.nullable().optional(),
}).strict();
export type StudioArtifact = z.infer<typeof StudioArtifactSchema>;

const SceneFingerprintsSchema = z.object({
  voice: FingerprintSchema,
  video: FingerprintSchema,
}).strict();

const ShortClipFingerprintsSchema = z.object({
  video: FingerprintSchema,
}).strict();

const SceneArtifactsSchema = z.object({
  voice: StudioArtifactSchema,
  video: StudioArtifactSchema,
}).strict();
type SceneArtifacts = z.infer<typeof SceneArtifactsSchema>;

const ShortClipArtifactsSchema = z.object({
  video: StudioArtifactSchema,
}).strict();
type ShortClipArtifacts = z.infer<typeof ShortClipArtifactsSchema>;

const SceneUnitSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("scene"),
  fingerprints: SceneFingerprintsSchema,
  artifacts: SceneArtifactsSchema,
}).strict();

const ShortClipUnitSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("short-clip"),
  fingerprints: ShortClipFingerprintsSchema,
  artifacts: ShortClipArtifactsSchema,
}).strict();

export const StudioRenderUnitSchema = z.discriminatedUnion("kind", [SceneUnitSchema, ShortClipUnitSchema]);
export type StudioRenderUnit = z.infer<typeof StudioRenderUnitSchema>;

export const StudioCompositionSchema = z.object({
  status: ArtifactStatusSchema,
  path: z.string().min(1).nullable(),
  currentFingerprint: FingerprintSchema.default("0".repeat(64)),
  successfulFingerprint: FingerprintSchema.nullable(),
  error: StudioErrorSchema.nullable().optional(),
}).strict();
export type StudioComposition = z.infer<typeof StudioCompositionSchema>;

export const StudioJobSchema = z.object({
  version: z.literal("1.0"),
  renderer: StudioRendererSchema,
  source: StudioSourceSchema,
  scriptFingerprint: FingerprintSchema,
  units: z.array(StudioRenderUnitSchema),
  composition: StudioCompositionSchema.nullable(),
  updatedAt: z.string().datetime().optional(),
}).strict().superRefine((job, context) => {
  if (job.renderer === "ct-short-clip") {
    if (job.units.length !== 1 || job.units[0]?.kind !== "short-clip") {
      context.addIssue({ code: "custom", path: ["units"], message: "short clips require one short-clip unit" });
    }
    if (job.composition !== null) {
      context.addIssue({ code: "custom", path: ["composition"], message: "short clips do not have a composition artifact" });
    }
  }
  if (job.renderer === "hyperframes" && job.units.some((unit) => unit.kind !== "scene")) {
    context.addIssue({ code: "custom", path: ["units"], message: "HyperFrames jobs require scene units" });
  }
});
export type StudioJob = z.infer<typeof StudioJobSchema>;

export const StudioDocumentSchema = z.discriminatedUnion("renderer", [TemplateScriptSchema, ShortClipSpecSchema]);
export type StudioDocument = z.infer<typeof StudioDocumentSchema>;

export function parseStudioDocument(input: unknown): StudioDocument {
  const candidate = input && typeof input === "object" ? input as Record<string, unknown> : {};
  const renderer = candidate.renderer;
  if (renderer !== "hyperframes" && renderer !== "ct-short-clip") {
    throw new Error("Unsupported renderer; expected hyperframes or ct-short-clip");
  }
  if (candidate.version !== undefined && candidate.version !== "1.0") {
    throw new Error(`Unsupported ${renderer} script version; expected 1.0`);
  }
  return StudioDocumentSchema.parse(input);
}

export const StudioProjectCreateRequestSchema = z.object({
  project: z.string().min(1),
  document: StudioDocumentSchema,
  source: StudioSourceSchema.optional(),
}).strict();

export const StudioProjectSaveRequestSchema = z.object({
  project: z.string().min(1),
  document: StudioDocumentSchema,
  graph: z.unknown().optional(),
  expectedScriptFingerprint: FingerprintSchema.optional(),
}).strict();

export const StudioProjectGenerateRequestSchema = z.object({
  project: z.string().min(1),
  source: z.object({
    kind: z.enum(["topic", "url"]),
    value: z.string().min(1),
  }).strict(),
  renderer: StudioRendererSchema,
  generation: z.object({
    provider: z.enum(["local", "openai", "claude", "gemini"]),
    model: z.string().min(1).optional(),
    apiKey: z.string().min(1).optional(),
  }).strict(),
}).strict();

export const StudioRenderRequestSchema = z.object({
  project: z.string().min(1),
  mode: z.enum(["full", "audio", "video", "scene", "compose"]),
  sceneId: z.string().min(1).optional(),
  force: z.boolean().default(false),
}).strict();

export const StudioProjectResponseSchema = z.object({
  project: z.string().min(1),
  document: StudioDocumentSchema,
  job: StudioJobSchema,
}).strict();

type ArtifactInput = Partial<StudioArtifact>;
type SceneArtifactsInput = { voice?: ArtifactInput; video?: ArtifactInput };
type ShortClipArtifactsInput = { video?: ArtifactInput };

type SceneUnitInput = {
  id: string;
  kind: "scene";
  fingerprints: { voice: string; video: string };
  artifacts?: SceneArtifactsInput;
};
type ShortClipUnitInput = {
  id: string;
  kind: "short-clip";
  fingerprints: { video: string };
  artifacts?: ShortClipArtifactsInput;
};

function artifact(input: ArtifactInput | undefined, fallbackPath: string): StudioArtifact {
  const currentFingerprint = input?.currentFingerprint ?? input?.successfulFingerprint ?? "0".repeat(64);
  return {
    status: input?.status ?? "missing",
    path: input?.path ?? fallbackPath,
    currentFingerprint,
    successfulFingerprint: input?.successfulFingerprint ?? null,
    ...(input?.error === undefined ? {} : { error: input.error }),
  };
}

export interface CreateStudioJobInput {
  renderer: StudioRenderer;
  source: StudioSource;
  scriptFingerprint: string;
  units: Array<SceneUnitInput | ShortClipUnitInput>;
  composition: StudioComposition | null | { status: ArtifactStatus; currentFingerprint: string; successfulFingerprint?: string | null; path?: string | null; error?: StudioComposition["error"] };
}

export function createStudioJob(input: CreateStudioJobInput): StudioJob {
  const units = input.units.map((unit) => {
    if (unit.kind === "short-clip") {
      return {
        ...unit,
        artifacts: {
          video: artifact(unit.artifacts?.video as ArtifactInput | undefined, "video.mp4"),
        },
      };
    }
    return {
      ...unit,
      artifacts: {
        voice: artifact(unit.artifacts?.voice as ArtifactInput | undefined, `voice/${unit.id}.mp3`),
        video: artifact(unit.artifacts?.video as ArtifactInput | undefined, `clips/${unit.id}.mp4`),
      },
    };
  });
  const composition = input.composition === null ? null : {
    status: input.composition.status,
    path: input.composition.path ?? "video.mp4",
    currentFingerprint: input.composition.currentFingerprint,
    successfulFingerprint: input.composition.successfulFingerprint ?? null,
    ...(input.composition.error === undefined ? {} : { error: input.composition.error }),
  };
  return StudioJobSchema.parse({
    version: "1.0",
    renderer: input.renderer,
    source: input.source,
    scriptFingerprint: input.scriptFingerprint,
    units,
    composition,
  });
}
