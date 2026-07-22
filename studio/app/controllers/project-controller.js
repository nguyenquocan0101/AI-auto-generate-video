import { createProject, generateProject, getProject, listProjects } from "../services/studio-api.js";
import { escapeHtml, setText } from "../utils/dom.js";
import { readGenerationForm } from "../utils/project-generation.js";

export function createProjectController({
  initialProjectId,
  projectSelect,
  projectDialog,
  projectFeedback,
  projectForm,
  projectNameInput,
  scriptFileInput,
  scriptStatus,
  activity,
  finalVideo,
  finalVoice,
  finalFile,
  onProjectIdChanged,
  onProjectLoaded,
}) {
  let projectId = initialProjectId;
  let projectMode = "import";
  let projectSubmitting = false;
  const submitProjectButton = document.querySelector("#submit-project");

  function clearGenerationKey() {
    const input = document.querySelector("#generation-api-key");
    if (input) input.value = "";
  }

  function setProjectMode(mode) {
    projectMode = mode;
    if (mode !== "generate") clearGenerationKey();
    document.querySelectorAll("[data-project-mode]").forEach((button) => button.classList.toggle("active", button.dataset.projectMode === mode));
    document.querySelectorAll("[data-project-panel]").forEach((panel) => { panel.hidden = panel.dataset.projectPanel !== mode; });
    setText(document.querySelector("#submit-project"), mode === "generate" ? "Generate project" : "Tạo project");
  }

  function syncProviderDefaults() {
    const provider = document.querySelector("#generation-provider")?.value;
    const model = document.querySelector("#generation-model");
    const keyField = document.querySelector("#generation-key-field");
    const defaults = { openai: "gpt-5.6-terra", claude: "claude-opus-4-8", gemini: "gemini-3.5-flash", local: "" };
    if (model && (!model.value || model.dataset.providerDefault === "1")) {
      model.value = defaults[provider] ?? "";
      model.dataset.providerDefault = "1";
    }
    if (keyField) keyField.hidden = provider === "local";
  }

  async function loadProjects() {
    const result = await listProjects();
    const projects = Array.isArray(result.projects) ? result.projects : [];
    if (!projects.some((project) => project.id === projectId) && projects[0]) {
      projectId = projects[0].id;
      onProjectIdChanged?.(projectId);
    }
    projectSelect.innerHTML = projects.map((project) => `<option value="${escapeHtml(project.id)}">${escapeHtml(project.title || project.id)}${project.renderer === "ct-short-clip" ? " · Short" : ""}</option>`).join("");
    projectSelect.value = projectId;
    if (projects.length === 0) projectSelect.innerHTML = "<option>Chưa có project</option>";
  }

  async function loadProject() {
    try {
      let project;
      try {
        project = await getProject(projectId);
      } catch {
        const projectsResult = await listProjects();
        const fallback = projectsResult.projects?.[0]?.id;
        if (!fallback) throw new Error(`Không tìm thấy project "${projectId}" trong output.`);
        projectId = fallback;
        onProjectIdChanged?.(projectId);
        projectSelect.value = fallback;
        project = await getProject(projectId);
      }
      const assets = project.assets ?? { clips: {}, voices: {}, finalVideo: "", finalVoice: "" };
      finalVideo.src = assets.finalVideo;
      finalVoice.src = assets.finalVoice;
      onProjectLoaded?.({ project, projectId });
      if (assets.finalVideo) {
        finalFile.innerHTML = "<span>MP4 cuối</span><strong>video.mp4</strong><small>1080 × 1920 · H.264 + AAC</small>";
      }
      setText(scriptStatus, "Storyboard và artifact đã tải từ output hiện có.");
      scriptStatus.className = "editor-status success";
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không tìm thấy project trong output.";
      setText(scriptStatus, message);
      scriptStatus.className = "editor-status error";
      setText(activity, message);
    }
  }

  function mount() {
    projectSelect.addEventListener("change", () => {
      const nextProject = projectSelect.value;
      if (!nextProject || nextProject === projectId) return;
      window.location.href = `${window.location.pathname}?project=${encodeURIComponent(nextProject)}`;
    });

    document.querySelector("#new-project")?.addEventListener("click", () => {
      setText(projectFeedback, "Chọn file script JSON của project mới.");
      projectFeedback.className = "editor-feedback";
      projectNameInput.value = "";
      scriptFileInput.value = "";
      clearGenerationKey();
      setProjectMode("import");
      projectDialog.showModal();
    });
    document.querySelectorAll("[data-project-mode]").forEach((button) => button.addEventListener("click", () => setProjectMode(button.dataset.projectMode)));
    document.querySelector("#generation-provider")?.addEventListener("change", () => {
      const model = document.querySelector("#generation-model");
      if (model) model.dataset.providerDefault = "1";
      syncProviderDefaults();
    });
    document.querySelector("#generation-model")?.addEventListener("input", (event) => { event.currentTarget.dataset.providerDefault = "0"; });
    syncProviderDefaults();
    document.querySelector("#close-project")?.addEventListener("click", () => { clearGenerationKey(); projectDialog.close(); });
    document.querySelector("#cancel-project")?.addEventListener("click", () => { clearGenerationKey(); projectDialog.close(); });
    projectDialog.addEventListener("close", clearGenerationKey);
    projectForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (projectSubmitting) return;
      projectSubmitting = true;
      if (submitProjectButton) submitProjectButton.disabled = true;
      if (projectMode === "generate") {
        try {
          const name = projectNameInput.value.trim();
          const { source, generation, renderer } = readGenerationForm();
          if (!name) throw new Error("Hãy nhập tên project.");
          if (!source.value) throw new Error("Hãy nhập chủ đề hoặc URL.");
          if (generation.provider !== "local" && !generation.apiKey) throw new Error("Provider này cần API key.");
          setText(projectFeedback, "Đang yêu cầu provider viết script…");
          await generateProject({ project: name, source, generation, renderer });
          window.location.href = `${window.location.pathname}?project=${encodeURIComponent(name)}`;
        } catch (error) {
          setText(projectFeedback, error instanceof Error ? error.message : "Không generate được project.");
          projectFeedback.className = "editor-feedback";
        } finally {
          clearGenerationKey();
        }
        projectSubmitting = false;
        if (submitProjectButton) submitProjectButton.disabled = false;
        return;
      }
      const file = scriptFileInput.files[0];
      if (!file) {
        setText(projectFeedback, "Hãy chọn một file script JSON.");
        projectSubmitting = false;
        if (submitProjectButton) submitProjectButton.disabled = false;
        return;
      }
      try {
        const script = JSON.parse(await file.text());
        const typedName = projectNameInput.value.trim();
        const fallbackName = file.name.replace(/\.json$/i, "").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
        const name = typedName || fallbackName;
        await createProject({ project: name, script });
        window.location.href = `${window.location.pathname}?project=${encodeURIComponent(name)}`;
      } catch (error) {
        setText(projectFeedback, error instanceof Error ? error.message : "File script không hợp lệ.");
        projectFeedback.className = "editor-feedback";
      }
      projectSubmitting = false;
      if (submitProjectButton) submitProjectButton.disabled = false;
      clearGenerationKey();
    });

    return loadProjects().then(loadProject);
  }

  return { loadProject, loadProjects, mount };
}
