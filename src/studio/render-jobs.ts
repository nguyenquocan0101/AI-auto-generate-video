import { randomUUID } from "node:crypto";

export type RenderJobStatus = "running" | "done" | "error";

export interface StudioRenderJob {
  id: string;
  project: string;
  renderer: string;
  mode: string;
  sceneId: string | null;
  artifactKeys: string[];
  snapshotScriptFingerprint: string;
  status: RenderJobStatus;
  progress: number;
  message: string;
  error: string;
}

export interface RenderExecutionContext {
  job: StudioRenderJob;
  projectRoot: string;
  mode: string;
  sceneId?: string;
}

export interface RenderJobManagerOptions {
  execute: (context: RenderExecutionContext) => Promise<void> | void;
  onStart?: (job: StudioRenderJob) => void;
  onFinish?: (job: StudioRenderJob) => void;
}

export function redactLog(value: string): string {
  return value
    .replace(/((?:api[_-]?key|token|secret|password)\s*[=:]\s*)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]")
    .slice(-3000);
}

export class RenderJobManager {
  private readonly jobs = new Map<string, StudioRenderJob>();
  private readonly options: RenderJobManagerOptions;

  constructor(options: RenderJobManagerOptions) {
    this.options = options;
  }

  active(project: string): StudioRenderJob | undefined {
    return [...this.jobs.values()].find((job) => job.project === project && job.status === "running");
  }

  get(id: string): StudioRenderJob | undefined {
    return this.jobs.get(id);
  }

  start(input: Omit<StudioRenderJob, "id" | "status" | "progress" | "message" | "error"> & { projectRoot: string }): StudioRenderJob {
    if (this.active(input.project)) throw new Error("Project is already rendering");
    const job: StudioRenderJob = {
      id: randomUUID(),
      project: input.project,
      renderer: input.renderer,
      mode: input.mode,
      sceneId: input.sceneId,
      artifactKeys: input.artifactKeys,
      snapshotScriptFingerprint: input.snapshotScriptFingerprint,
      status: "running",
      progress: 2,
      message: "Đang khởi động pipeline",
      error: "",
    };
    this.jobs.set(job.id, job);
    this.options.onStart?.(job);
    Promise.resolve()
      .then(() => this.options.execute({ job, projectRoot: input.projectRoot, mode: input.mode, sceneId: input.sceneId ?? undefined }))
      .then(() => {
        job.status = "done";
        job.progress = 100;
        job.message = "Render hoàn tất";
      })
      .catch((error: unknown) => {
        job.status = "error";
        job.error = redactLog(error instanceof Error ? error.message : String(error));
        job.message = "Render thất bại";
      })
      .finally(() => this.options.onFinish?.(job));
    return job;
  }
}
