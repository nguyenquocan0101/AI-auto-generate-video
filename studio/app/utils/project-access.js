export function projectAccessState({ readOnly = false, warnings = [], renderLock = null } = {}) {
  if (readOnly) {
    return { locked: true, reason: warnings[0] || "Project đang ở chế độ chỉ đọc." };
  }
  if (renderLock) {
    return { locked: true, reason: "Đang render — tạm khoá chỉnh sửa." };
  }
  return { locked: false, reason: "" };
}
