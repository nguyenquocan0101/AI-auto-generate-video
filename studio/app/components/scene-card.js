import { escapeHtml } from "../utils/dom.js";

export const templateLabels = {
  "ct-hook-hero": "Mở đầu",
  "ct-build-minimal": "Giải thích",
  "ct-list": "Danh sách",
  "ct-bold-poster": "Điểm chính",
  "ct-code-trace": "Minh hoạ thuật toán",
  "ct-stat-card": "Phân tích",
  "ct-comparison": "So sánh",
  "ct-voltage": "Ghi nhớ",
  "ct-outro": "Kết thúc",
};

export function titleKey(scene) {
  const inputs = scene.inputs ?? {};
  return ["headline", "hero", "title", "badge"].find((key) => typeof inputs[key] === "string") ?? "headline";
}

export function sceneTitle(scene) {
  return scene.inputs?.[titleKey(scene)] ?? scene.id;
}

function progressMarkup(state, progress, label) {
  if (state !== "rendering") return "";
  return `<div class="render-progress" data-progress="${escapeHtml(label)}"><span style="width:${progress}%"></span><small>Đang render ${progress}%</small></div>`;
}

function audioWaveform(scene) {
  return Array.from({ length: 34 }, (_, index) => {
    const height = 24 + ((index * 17 + scene.number * 11) % 62);
    return `<i style="height:${height}%"></i>`;
  }).join("");
}

function sceneVideoMarkup(scene) {
  const hasVideo = Boolean(scene.videoSrc);
  const isRendering = scene.video === "rendering";
  if (!hasVideo && !isRendering) return "";
  return `<div class="scene-preview ${hasVideo ? "" : "video-pending"}">
    ${hasVideo ? `<video controls preload="metadata" playsinline data-scene-video src="${escapeHtml(scene.videoSrc)}" aria-label="Preview video cảnh ${scene.number}"></video>` : ""}
    <span class="video-label">${isRendering && !hasVideo ? "Video · đang render" : "Video"}</span>
    ${hasVideo ? `<button class="video-render-button" aria-label="Render lại video cảnh ${scene.number}" data-action="video" data-id="${escapeHtml(scene.id)}" ${isRendering ? "disabled" : ""}>↻</button>` : ""}
    ${progressMarkup(scene.video, scene.progress.video, `${scene.id}-video`)}
    ${!hasVideo && isRendering ? `<div class="video-pending-copy"><strong>Đang chuẩn bị clip</strong><small>Video sẽ xuất hiện sau khi render xong</small></div>` : ""}
  </div>`;
}

export function renderSceneCard(scene, expandedScripts) {
  const isScriptOpen = expandedScripts.has(scene.id);
  const statusReady = scene.audio === "ready" && scene.video === "ready";
  return `
    <article class="scene-node canvas-node ${scene.audio === "dirty" || scene.video === "dirty" ? "needs-work" : ""}" data-scene="${escapeHtml(scene.id)}" data-node-id="${escapeHtml(scene.id)}">
      <header class="node-drag-handle" data-drag-node="${escapeHtml(scene.id)}">
        <div class="scene-heading-copy"><div class="scene-title-line"><strong>Cảnh ${scene.number}</strong><span class="scene-title" title="${escapeHtml(scene.title)}">${escapeHtml(scene.title)}</span></div><span class="scene-type">${escapeHtml(scene.template)}</span></div>
        <span class="drag-caption" aria-hidden="true">⠿</span>
      </header>
      <button class="node-port input-port" data-port-in="${escapeHtml(scene.id)}" aria-label="Cổng vào cảnh ${scene.number}"></button>
      <button class="node-port output-port" data-port-out="${escapeHtml(scene.id)}" aria-label="Kéo để nối cảnh ${scene.number} sang node khác"></button>
      ${sceneVideoMarkup(scene)}
      <div class="audio-layer ${scene.audioSrc ? "" : "unavailable"}">
        <div class="audio-layer-track">
          <button class="sync-play" data-sync-play="${escapeHtml(scene.id)}" aria-label="Phát video và audio cảnh ${scene.number}" ${scene.audioSrc ? "" : "disabled"}>▶</button>
          <div class="audio-waveform" aria-hidden="true">${audioWaveform(scene)}<b></b></div>
          <button class="audio-rerender" aria-label="Render lại audio cảnh ${scene.number}" data-action="audio" data-id="${escapeHtml(scene.id)}" ${scene.audio === "rendering" ? "disabled" : ""}>↻</button>
        </div>
        <div class="audio-layer-meta"><span class="audio-layer-title">Audio · lời đọc</span><span data-audio-time="${escapeHtml(scene.id)}">0:00 / --:--</span><small>${scene.audio === "rendering" ? "Đang render" : scene.audio === "dirty" ? "Cần render lại" : "Sẵn sàng"}</small></div>
        <div class="audio-progress">${progressMarkup(scene.audio, scene.progress.audio, `${scene.id}-audio`)}</div>
        ${scene.audioSrc ? `<audio class="scene-audio" preload="metadata" data-scene-audio src="${escapeHtml(scene.audioSrc)}" aria-label="Audio lời đọc cảnh ${scene.number}"></audio>` : '<p class="audio-empty">Chưa có audio</p>'}
      </div>
      <div class="script-disclosure ${isScriptOpen ? "open" : ""}">
        <button class="script-toggle" type="button" data-script-toggle="${escapeHtml(scene.id)}" aria-expanded="${isScriptOpen}"><span>Lời đọc</span><span aria-hidden="true">⌄</span></button>
        <label class="scene-script-label">Nội dung lời đọc<textarea class="scene-script" data-script-id="${escapeHtml(scene.id)}" rows="5">${escapeHtml(scene.voiceText)}</textarea></label>
      </div>
      <button class="rerender scene-render" data-action="scene" data-id="${escapeHtml(scene.id)}" ${scene.audio === "rendering" || scene.video === "rendering" ? "disabled" : ""}>Render lại cảnh <span>→</span></button>
      <footer><b class="status ${statusReady ? "ready" : "dirty"}"></b>${statusReady ? "Sẵn sàng" : "Có artifact cần làm mới"}</footer>
    </article>
  `;
}

export function renderSceneShortcuts(scenes) {
  return [
    '<button class="scene-shortcut source-shortcut" data-jump-node="storyboard">Storyboard</button>',
    ...scenes.map((scene) => `<button class="scene-shortcut" data-jump-node="${escapeHtml(scene.id)}"><b>${scene.number}</b><span>${escapeHtml(scene.title)}</span></button>`),
    '<button class="scene-shortcut output-shortcut" data-jump-node="output">Output</button>',
  ].join("");
}

