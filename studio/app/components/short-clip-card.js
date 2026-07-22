export function renderShortClipSummary(spec = {}) {
  const title = spec.title || "Short clip thuật toán";
  const algorithm = spec.algorithm || "Chưa chọn thuật toán";
  const count = Array.isArray(spec.initial_values) ? spec.initial_values.length : 12;
  const duration = spec.duration_sec ? `${spec.duration_sec}s` : "Tự động theo số phần tử";
  return `<div class="short-clip-summary"><span>CT SHORT CLIP</span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(algorithm)} · ${count} phần tử · ${escapeHtml(duration)}</small></div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
}
