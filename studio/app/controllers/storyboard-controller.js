import { escapeHtml, setText } from "../utils/dom.js";
import { sceneTitle, templateLabels, titleKey } from "../components/scene-card.js";

export function createStoryboardController({
  dialog,
  getStoryboard,
  applyStoryboard,
  scheduleProjectSave,
  scriptStatus,
  activity,
}) {
  const titleInput = dialog.querySelector("#editor-title");
  const scenesContainer = dialog.querySelector("#editor-scenes");
  const feedback = dialog.querySelector("#editor-feedback");

  function open() {
    const storyboard = getStoryboard();
    titleInput.value = storyboard.metadata?.title ?? "";
    scenesContainer.innerHTML = storyboard.scenes.map((scene, index) => `
      <section class="editor-scene" data-id="${escapeHtml(scene.id)}">
        <p>Cảnh ${index + 1} · ${escapeHtml(templateLabels[scene.templateId] ?? "Mẫu dựng")}</p>
        <label>Nội dung trên hình<input name="title" value="${escapeHtml(sceneTitle(scene))}" /></label>
        <label>Lời đọc<textarea name="voiceText" rows="3">${escapeHtml(scene.voiceText ?? "")}</textarea></label>
      </section>
    `).join("");
    dialog.showModal();
  }

  function save() {
    const storyboard = getStoryboard();
    const title = titleInput.value.trim();
    if (!title) {
      setText(feedback, "Hãy nhập tên bài học trước khi lưu.");
      return;
    }
    storyboard.metadata ??= {};
    storyboard.metadata.title = title;
    scenesContainer.querySelectorAll(".editor-scene").forEach((element) => {
      const scene = storyboard.scenes.find((item) => item.id === element.dataset.id);
      if (!scene) return;
      scene.inputs ??= {};
      scene.inputs[titleKey(scene)] = element.querySelector("input[name='title']").value.trim() || scene.id;
      scene.voiceText = element.querySelector("textarea[name='voiceText']").value.trim();
    });
    applyStoryboard(storyboard, { markDirty: true });
    scheduleProjectSave();
    setText(scriptStatus, "Storyboard đã cập nhật. Chỉ các cảnh thay đổi cần render lại.");
    scriptStatus.className = "editor-status success";
    setText(activity, "Đã áp dụng nội dung storyboard trong trình duyệt.");
    dialog.close();
  }

  function mount() {
    document.querySelector("#edit-storyboard")?.addEventListener("click", open);
    document.querySelector("#close-editor")?.addEventListener("click", () => dialog.close());
    document.querySelector("#close-editor-secondary")?.addEventListener("click", () => dialog.close());
    document.querySelector("#save-storyboard")?.addEventListener("click", save);
  }

  return { mount, open, save };
}

