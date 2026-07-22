import { describe, expect, it } from "vitest";
import { projectAccessState } from "../../studio/app/utils/project-access.js";

describe("Studio project access state", () => {
  it("keeps a healthy idle project editable", () => {
    expect(projectAccessState({ readOnly: false, renderLock: null })).toEqual({ locked: false, reason: "" });
  });

  it("locks editing while a render is active", () => {
    expect(projectAccessState({ readOnly: false, renderLock: { jobId: "job-1" } })).toEqual({
      locked: true,
      reason: "Đang render — tạm khoá chỉnh sửa.",
    });
  });

  it("keeps an invalid-sidecar project read-only with its warning", () => {
    expect(projectAccessState({ readOnly: true, warnings: ["studio-job.json is invalid"], renderLock: null })).toEqual({
      locked: true,
      reason: "studio-job.json is invalid",
    });
  });
});
