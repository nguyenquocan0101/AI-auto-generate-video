async function readJson(response, fallbackMessage) {
  const result = await response.json();
  if (!response.ok) {
    const error = new Error(result.error ?? fallbackMessage);
    error.fields = result.fields ?? [];
    throw error;
  }
  return result;
}

export async function listProjects() {
  const response = await fetch("/api/projects");
  return readJson(response, "Không tải được danh sách project.");
}

export async function getProject(projectId) {
  const response = await fetch(`/api/project?name=${encodeURIComponent(projectId)}&time=${Date.now()}`);
  return readJson(response, "Không tải được project.");
}

export async function saveProject({ projectId, script, graph }) {
  const response = await fetch("/api/project/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectId, script, graph }),
  });
  return readJson(response, "Không lưu được project.");
}

export async function createProject({ project, script }) {
  const response = await fetch("/api/project/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, script }),
  });
  return readJson(response, "Không tạo được project.");
}

export async function generateProject({ project, source, generation, renderer }) {
  const response = await fetch("/api/project/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project, source, generation, renderer }),
  });
  return readJson(response, "Không tạo được project từ AI provider.");
}

export async function requestRender({ projectId, mode, sceneId }) {
  const response = await fetch("/api/render", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: projectId, mode, sceneId }),
  });
  return readJson(response, "Không khởi động được render.");
}

export async function getJob(jobId) {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`);
  return readJson(response, "Không đọc được trạng thái render.");
}
