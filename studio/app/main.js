import { setText } from "./utils/dom.js";
import { getProject, saveProject } from "./services/studio-api.js";
import { createGraphController } from "./controllers/graph-controller.js";
import { createProjectController } from "./controllers/project-controller.js";
import { createRenderController } from "./controllers/render-controller.js";
import { createSceneController } from "./controllers/scene-controller.js";
import { createStoryboardController } from "./controllers/storyboard-controller.js";
import { createShortClipController, serializeShortClipDraft } from "./controllers/short-clip-controller.js";
import { projectAccessState } from "./utils/project-access.js";

const requestedProject = new URLSearchParams(window.location.search).get("project");
let projectId = requestedProject || "binary-tree-sort-20260714-1518";

let storyboard;
let assets = { clips: {}, voices: {}, finalVideo: "", finalVoice: "" };
let scenes = [];
let finalFresh = true;
let saveTimer = null;
let sceneController;
let currentRenderer = "hyperframes";
let projectReadOnly = false;
let projectRenderLocked = false;
let projectWarning = "";

const sceneList = document.querySelector("#scene-list");
const activity = document.querySelector("#activity");
const missingCount = document.querySelector("#missing-count");
const finalFile = document.querySelector("#final-file");
const scriptStatus = document.querySelector("#script-status");
const projectTitle = document.querySelector("#project-title");
const canvasTitle = document.querySelector("#canvas-title");
const storyboardDialog = document.querySelector("#storyboard-dialog");
const finalVideo = document.querySelector("#final-video");
const finalVoice = document.querySelector("#final-voice");
const nodeCanvas = document.querySelector("#node-canvas");
const edgeLayer = document.querySelector("#edge-layer");
const canvasViewport = document.querySelector("#canvas-viewport");
const sceneShortcuts = document.querySelector("#scene-shortcuts");
const projectSelect = document.querySelector("#project-select");
const projectDialog = document.querySelector("#project-dialog");
const projectFeedback = document.querySelector("#project-feedback");
const zoomLevel = document.querySelector("#zoom-level");
const workbenchLayout = document.querySelector(".workbench-layout");
const navigatorToggle = document.querySelector("#toggle-navigator");
const workspace = document.querySelector("#canvas");
const shortClipWorkspace = document.querySelector("#short-clip-workspace");
const shortClipVideo = document.querySelector("#short-clip-video");

const shortClipController = createShortClipController({
  root: shortClipWorkspace,
  getProjectId: () => projectId,
  onRendered: () => refreshProject({ finalIsFresh: true }),
  setActivity: (message) => setText(activity, message),
});

function updateProjectAccessUi() {
  const access = projectAccessState({
    readOnly: projectReadOnly,
    warnings: projectWarning ? [projectWarning] : [],
    renderLock: projectRenderLocked ? { active: true } : null,
  });
  const controls = [
    ...document.querySelectorAll("button[data-action], textarea[data-script-id], #edit-storyboard, #compose-video, #render-missing, #reset-layout, #reset-connections, #storyboard-dialog input, #storyboard-dialog textarea, #save-storyboard, [data-short-clip-form] input, [data-short-clip-form] select, [data-short-clip-form] textarea, [data-short-clip-form] button"),
  ];
  controls.forEach((control) => { control.disabled = access.locked; });
  graph.setLocked(access.locked);
  if (access.reason) {
    setText(scriptStatus, access.reason);
    if (scriptStatus) scriptStatus.className = "editor-status error";
    setText(activity, access.reason);
  }
}

function applyProjectAccess(project) {
  projectReadOnly = Boolean(project.readOnly);
  projectRenderLocked = Boolean(project.renderLock);
  projectWarning = project.warnings?.[0] ?? "";
  updateProjectAccessUi();
}

const graph = createGraphController({
  projectId,
  nodeCanvas,
  edgeLayer,
  canvasViewport,
  zoomLevel,
  getSceneIds: () => scenes.map((scene) => scene.id),
  onStatus: (message) => setText(activity, message),
  onOrderChanged: (order) => sceneController?.syncSceneOrder(order),
  onGraphInvalidated: () => {
    finalFresh = false;
    updateOutput();
  },
  onPersistRequested: () => scheduleProjectSave(),
});

sceneController = createSceneController({
  sceneList,
  sceneShortcuts,
  nodeCanvas,
  missingCount,
  projectTitle,
  canvasTitle,
  activity,
  graph,
  getStoryboard: () => storyboard,
  setStoryboard: (value) => { storyboard = value; },
  getAssets: () => assets,
  getScenes: () => scenes,
  setScenes: (value) => { scenes = value; },
  setFinalFresh: (value) => { finalFresh = value; },
  scheduleProjectSave,
  updateOutput,
});

const renderer = createRenderController({
  getProjectId: () => projectId,
  getScenes: () => scenes,
  activity,
  finalFile,
  persistProject,
  refreshProject,
  renderScenes: () => sceneController.renderScenes(),
  updateOutput,
  updateProgress,
  setFinalFresh: (value) => { finalFresh = value; },
  setProjectLocked: (locked) => {
    projectRenderLocked = Boolean(locked);
    updateProjectAccessUi();
  },
});

function setNavigatorCollapsed(collapsed) {
  workbenchLayout?.classList.toggle("navigator-collapsed", collapsed);
  navigatorToggle?.setAttribute("aria-expanded", String(!collapsed));
  navigatorToggle?.setAttribute("aria-label", collapsed ? "Mở danh sách scene" : "Thu gọn danh sách scene");
  setText(navigatorToggle, collapsed ? "›" : "‹");
  localStorage.setItem("pipeline-navigator-collapsed", collapsed ? "1" : "0");
  requestAnimationFrame(graph.drawConnections);
}

function scheduleProjectSave() {
  if (!storyboard || projectReadOnly || projectRenderLocked) return;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => persistProject().catch((error) => {
    setText(scriptStatus, error instanceof Error ? error.message : "Không lưu được project.");
    if (scriptStatus) scriptStatus.className = "editor-status error";
  }), 250);
}

async function persistProject() {
  window.clearTimeout(saveTimer);
  if (projectReadOnly) throw new Error(projectWarning || "Project đang ở chế độ chỉ đọc.");
  if (projectRenderLocked) throw new Error("Đang render — tạm khoá chỉnh sửa.");
  if (currentRenderer === "ct-short-clip") {
    await saveProject({ projectId, script: serializeShortClipDraft(shortClipController.readDraft()) });
    return;
  }
  await saveProject({
    projectId,
    script: storyboard,
    graph: graph.snapshot(),
  });
}

function updateOutput() {
  if (currentRenderer === "ct-short-clip") return;
  const allAudio = scenes.every((scene) => scene.audio === "ready");
  const allVideo = scenes.every((scene) => scene.video === "ready");
  setText(document.querySelector("#audio-total"), allAudio ? "Sẵn sàng ghép" : "Chờ audio");
  setText(document.querySelector("#video-total"), allVideo ? "Sẵn sàng ghép" : "Chờ clip");
  if (!allAudio || !allVideo || !finalFresh) {
    finalFile.innerHTML = "<span>MP4 cuối</span><strong>Cần ghép lại</strong><small>Có artifact mới hơn bản xuất</small>";
  }
}

function updateProgress(id, type, progress) {
  const item = document.querySelector(`[data-progress="${CSS.escape(`${id}-${type}`)}"]`);
  if (!item) return;
  item.querySelector("span").style.width = `${progress}%`;
  setText(item.querySelector("small"), `Đang render ${progress}%`);
}

async function refreshProject({ finalIsFresh = finalFresh } = {}) {
  const project = await getProject(projectId);
  currentRenderer = project.renderer ?? project.script?.renderer ?? "hyperframes";
  workspace?.classList.toggle("short-clip-active", currentRenderer === "ct-short-clip");
  if (shortClipWorkspace) shortClipWorkspace.hidden = currentRenderer !== "ct-short-clip";
  document.querySelector("#render-missing")?.toggleAttribute("hidden", currentRenderer === "ct-short-clip");
  document.querySelector("#compose-video")?.toggleAttribute("hidden", currentRenderer === "ct-short-clip");
  const cacheBust = Date.now();
  assets = {
    ...project.assets,
    clips: Object.fromEntries(Object.entries(project.assets.clips).map(([id, url]) => [id, `${url}?v=${cacheBust}`])),
    voices: Object.fromEntries(Object.entries(project.assets.voices).map(([id, url]) => [id, `${url}?v=${cacheBust}`])),
    finalVideo: project.assets.finalVideo ? `${project.assets.finalVideo}?v=${cacheBust}` : "",
    finalVoice: project.assets.finalVoice ? `${project.assets.finalVoice}?v=${cacheBust}` : "",
  };
  finalFresh = currentRenderer === "ct-short-clip"
    ? project.job?.units?.[0]?.artifacts?.video?.status === "ready"
    : finalIsFresh && project.job?.composition?.status === "ready";
  finalVideo.src = assets.finalVideo;
  finalVoice.src = assets.finalVoice;
  if (shortClipVideo) shortClipVideo.src = assets.finalVideo;
  if (finalFresh) {
    finalFile.innerHTML = "<span>MP4 cuối</span><strong>video.mp4</strong><small>1080 × 1920 · H.264 + AAC</small>";
  }
  if (currentRenderer === "ct-short-clip") shortClipController.applySpec(project.script, project.renderLock ?? (project.readOnly ? { readOnly: true } : null));
  else sceneController.applyStoryboard(project.script, { markDirty: false });
  applyProjectAccess(project);
}

navigatorToggle?.addEventListener("click", () => {
  setNavigatorCollapsed(!workbenchLayout?.classList.contains("navigator-collapsed"));
});

setNavigatorCollapsed(localStorage.getItem("pipeline-navigator-collapsed") === "1");

finalVideo.addEventListener("error", () => finalVideo.closest(".final-preview")?.classList.add("unavailable"), { once: true });
finalVoice.addEventListener("error", () => finalVoice.closest(".audio-preview")?.classList.add("unavailable"), { once: true });

graph.mount();
renderer.mount();
sceneController.mount((id, type) => renderer.renderArtifact(id, type));
shortClipController.mount({ renderer: "ct-short-clip", algorithm: "selection-sort", title: "", subtitle: "" });
createStoryboardController({
  dialog: storyboardDialog,
  getStoryboard: () => storyboard,
  applyStoryboard: (value, options) => sceneController.applyStoryboard(value, options),
  scheduleProjectSave,
  scriptStatus,
  activity,
}).mount();
createProjectController({
  initialProjectId: projectId,
  projectSelect,
  projectDialog,
  projectFeedback,
  projectForm: document.querySelector("#project-form"),
  projectNameInput: document.querySelector("#new-project-name"),
  scriptFileInput: document.querySelector("#script-file"),
  scriptStatus,
  activity,
  finalVideo,
  finalVoice,
  finalFile,
  onProjectIdChanged: (nextProjectId) => {
    projectId = nextProjectId;
    graph.setProjectId(nextProjectId);
  },
  onProjectLoaded: ({ project }) => {
    currentRenderer = project.renderer ?? project.script?.renderer ?? "hyperframes";
    workspace?.classList.toggle("short-clip-active", currentRenderer === "ct-short-clip");
    if (shortClipWorkspace) shortClipWorkspace.hidden = currentRenderer !== "ct-short-clip";
    document.querySelector("#render-missing")?.toggleAttribute("hidden", currentRenderer === "ct-short-clip");
    document.querySelector("#compose-video")?.toggleAttribute("hidden", currentRenderer === "ct-short-clip");
    graph.setInitialGraph(project.graph);
    assets = project.assets;
    finalFresh = Boolean(assets.finalVideo);
    if (currentRenderer === "ct-short-clip") {
      shortClipController.applySpec(project.script, project.renderLock ?? (project.readOnly ? { readOnly: true } : null));
      if (shortClipVideo) shortClipVideo.src = assets.finalVideo;
    } else sceneController.applyStoryboard(project.script, { markDirty: false });
    applyProjectAccess(project);
  },
}).mount().catch((error) => {
  setText(scriptStatus, error instanceof Error ? error.message : "Không tải được danh sách project.");
  scriptStatus.className = "editor-status error";
});
