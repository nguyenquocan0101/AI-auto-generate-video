import { getJob, requestRender } from "../services/studio-api.js";
import { setText } from "../utils/dom.js";

export function createRenderController({
  getProjectId,
  getScenes,
  activity,
  finalFile,
  persistProject,
  refreshProject,
  renderScenes,
  updateOutput,
  updateProgress,
  setFinalFresh,
  setProjectLocked,
}) {
  async function waitForJob(jobId, onProgress) {
    while (true) {
      const job = await getJob(jobId);
      onProgress(job);
      if (job.status === "done") return job;
      if (job.status === "error") throw new Error(job.error || job.message || "Render thất bại.");
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
  }

  async function startRenderJob(mode, sceneId, onProgress) {
    await persistProject();
    const result = await requestRender({ projectId: getProjectId(), mode, sceneId });
    setProjectLocked?.(true);
    try {
      return await waitForJob(result.jobId, onProgress);
    } finally {
      setProjectLocked?.(false);
    }
  }

  async function renderArtifact(id, type) {
    const scene = getScenes().find((item) => item.id === id);
    const targets = type === "scene" ? ["audio", "video"] : [type];
    if (!scene || targets.some((target) => scene[target] === "rendering")) return;
    const previous = Object.fromEntries(targets.map((target) => [target, scene[target]]));
    targets.forEach((target) => { scene[target] = "rendering"; scene.progress[target] = 0; });
    setFinalFresh(false);
    setText(activity, `Đang render ${type === "audio" ? "lời đọc" : type === "video" ? "clip" : "cảnh"} ${scene.number}: 0%`);
    renderScenes();
    updateOutput();
    try {
      await startRenderJob(type, id, (job) => {
        targets.forEach((target) => {
          scene.progress[target] = job.progress;
          updateProgress(id, target, job.progress);
        });
        setText(activity, `${job.message}: ${job.progress}%`);
      });
      await refreshProject({ finalIsFresh: false });
      setText(activity, `${type === "scene" ? `Cảnh ${scene.number}` : `${type === "audio" ? "Lời đọc" : "Clip"} cảnh ${scene.number}`} đã render xong.`);
    } catch (error) {
      targets.forEach((target) => { scene[target] = previous[target]; scene.progress[target] = 0; });
      renderScenes();
      updateOutput();
      setText(activity, error instanceof Error ? error.message : "Render thất bại.");
    }
  }

  async function renderMissing() {
    const tasks = getScenes().flatMap((scene) => ["audio", "video"].filter((type) => scene[type] === "dirty").map((type) => ({ id: scene.id, type })));
    if (tasks.length === 0) {
      setText(activity, "Không có artifact nào cần render.");
      return;
    }
    for (const { id, type } of tasks) await renderArtifact(id, type);
  }

  async function composeVideo() {
    if (getScenes().some((scene) => scene.audio !== "ready" || scene.video !== "ready")) {
      setText(activity, "Hãy render các artifact còn thiếu trước khi ghép MP4.");
      return;
    }
    finalFile.innerHTML = `<span>MP4 cuối</span><strong>Đang ghép 0%</strong><div class="render-progress"><span></span><small>Đang mux video và audio tổng</small></div>`;
    try {
      await startRenderJob("compose", undefined, (job) => {
        setText(finalFile.querySelector("strong"), `Đang ghép ${job.progress}%`);
        finalFile.querySelector(".render-progress span").style.width = `${job.progress}%`;
        setText(finalFile.querySelector(".render-progress small"), job.message);
        setText(activity, `${job.message}: ${job.progress}%`);
      });
      await refreshProject({ finalIsFresh: true });
      setText(activity, "MP4 cuối đã sẵn sàng trong output/.");
    } catch (error) {
      setFinalFresh(false);
      updateOutput();
      setText(activity, error instanceof Error ? error.message : "Ghép MP4 thất bại.");
    }
  }

  function mount() {
    document.querySelector("#render-missing")?.addEventListener("click", renderMissing);
    document.querySelector("#compose-video")?.addEventListener("click", composeVideo);
    return { renderArtifact };
  }

  return { composeVideo, mount, renderArtifact, renderMissing, startRenderJob };
}
