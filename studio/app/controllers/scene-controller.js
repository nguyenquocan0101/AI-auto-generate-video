import { setText } from "../utils/dom.js";
import { renderSceneCard, renderSceneShortcuts, sceneTitle, templateLabels } from "../components/scene-card.js";
import { setupSceneMedia } from "../media/media-sync.js";

export function createSceneController({
  sceneList,
  sceneShortcuts,
  nodeCanvas,
  missingCount,
  projectTitle,
  canvasTitle,
  activity,
  graph,
  getStoryboard,
  setStoryboard,
  getAssets,
  getScenes,
  setScenes,
  setFinalFresh,
  scheduleProjectSave,
  updateOutput,
}) {
  const expandedScripts = new Set();

  function toUiScene(scene, index) {
    const assets = getAssets();
    return {
      id: scene.id,
      number: index + 1,
      title: sceneTitle(scene),
      voiceText: scene.voiceText ?? "",
      template: templateLabels[scene.templateId] ?? "Mẫu dựng",
      audio: assets.voices[scene.id] ? "ready" : "dirty",
      video: assets.clips[scene.id] ? "ready" : "dirty",
      progress: { audio: 0, video: 0 },
      videoSrc: assets.clips[scene.id] ?? "",
      audioSrc: assets.voices[scene.id] ?? "",
    };
  }

  function applyStoryboard(nextStoryboard, { markDirty }) {
    if (!nextStoryboard || !Array.isArray(nextStoryboard.scenes) || nextStoryboard.scenes.length === 0) {
      throw new Error("Storyboard cần có ít nhất một cảnh.");
    }
    setStoryboard(nextStoryboard);
    const nextScenes = nextStoryboard.scenes.map(toUiScene);
    if (markDirty) {
      nextScenes.forEach((scene) => {
        scene.audio = "dirty";
        scene.video = "dirty";
      });
      setFinalFresh(false);
    }
    setScenes(nextScenes);
    const title = nextStoryboard.metadata?.title ?? "Video chưa đặt tên";
    setText(projectTitle, title);
    setText(canvasTitle, title);
    setText(document.querySelector("#storyboard-name"), title);
    setText(document.querySelector("#storyboard-count"), `${nextScenes.length} cảnh`);
    graph.ensureGraph();
    renderScenes();
    updateOutput();
  }

  function renderScenes() {
    const scenes = getScenes();
    sceneList.innerHTML = scenes.map((scene) => renderSceneCard(scene, expandedScripts)).join("");
    sceneList.querySelectorAll("video").forEach((video) => {
      video.addEventListener("error", () => video.closest(".scene-preview")?.classList.add("unavailable"), { once: true });
    });
    setupSceneMedia(sceneList);
    if (sceneShortcuts) sceneShortcuts.innerHTML = renderSceneShortcuts(scenes);
    setText(missingCount, scenes.flatMap((scene) => [scene.audio, scene.video]).filter((state) => state !== "ready").length);
    graph.applyNodePositions();
  }

  function jumpToNode(id) {
    const node = nodeCanvas.querySelector(`[data-node-id="${CSS.escape(id)}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    node.classList.add("jump-target");
    window.setTimeout(() => node.classList.remove("jump-target"), 700);
  }

  function syncStoryboardOrder() {
    const storyboard = getStoryboard();
    const byId = new Map(storyboard.scenes.map((scene) => [scene.id, scene]));
    storyboard.scenes = getScenes().map((scene) => byId.get(scene.id)).filter(Boolean);
  }

  function syncSceneOrder(order = graph.sceneOrder()) {
    if (!order) return false;
    const currentScenes = getScenes();
    const sceneById = new Map(currentScenes.map((scene) => [scene.id, scene]));
    const ordered = order.map((id) => sceneById.get(id)).filter(Boolean);
    if (ordered.length !== currentScenes.length) return false;
    ordered.forEach((scene, index) => { scene.number = index + 1; });
    setScenes(ordered);
    syncStoryboardOrder();
    setFinalFresh(false);
    renderScenes();
    updateOutput();
    return true;
  }

  function updateSceneScript(id, voiceText) {
    const scenes = getScenes();
    const storyboard = getStoryboard();
    const scene = scenes.find((item) => item.id === id);
    const source = storyboard.scenes.find((item) => item.id === id);
    if (!scene || !source || scene.voiceText === voiceText) return;
    scene.voiceText = voiceText;
    source.voiceText = voiceText;
    scene.audio = "dirty";
    scene.video = "dirty";
    setFinalFresh(false);
    scheduleProjectSave();
    renderScenes();
    updateOutput();
    setText(activity, `Lời đọc cảnh ${scene.number} đã thay đổi. Cảnh này cần render lại.`);
  }

  function mount(renderArtifact) {
    sceneList.addEventListener("click", (event) => {
      const toggle = event.target.closest("[data-script-toggle]");
      if (toggle) {
        const id = toggle.dataset.scriptToggle;
        const panel = toggle.closest(".script-disclosure");
        if (expandedScripts.has(id)) expandedScripts.delete(id);
        else expandedScripts.add(id);
        panel?.classList.toggle("open", expandedScripts.has(id));
        toggle.setAttribute("aria-expanded", String(expandedScripts.has(id)));
        window.requestAnimationFrame(() => graph.drawConnections());
        return;
      }
      const button = event.target.closest("button[data-action]");
      if (button) renderArtifact(button.dataset.id, button.dataset.action);
    });
    sceneList.addEventListener("change", (event) => {
      const textarea = event.target.closest("textarea[data-script-id]");
      if (textarea) updateSceneScript(textarea.dataset.scriptId, textarea.value.trim());
    });
    sceneShortcuts?.addEventListener("click", (event) => {
      const shortcut = event.target.closest("[data-jump-node]");
      if (shortcut) jumpToNode(shortcut.dataset.jumpNode);
    });
    document.querySelector("#jump-output")?.addEventListener("click", () => jumpToNode("output"));
  }

  return { applyStoryboard, jumpToNode, mount, renderScenes, syncSceneOrder, updateSceneScript };
}
