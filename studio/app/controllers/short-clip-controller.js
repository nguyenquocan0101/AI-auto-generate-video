import { getJob, requestRender, saveProject } from "../services/studio-api.js";
import { renderShortClipSummary } from "../components/short-clip-card.js";

const algorithms = [
  "bubble-sort", "selection-sort", "insertion-sort", "quick-sort",
  "merge-sort", "heap-sort", "shell-sort", "cocktail-sort",
];

export function canEditShortClip({ renderLock }) {
  return !renderLock;
}

function optionalNumber(value, integer = false) {
  if (value === "" || value === null || value === undefined) return undefined;
  const number = integer ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(number) ? number : value;
}

function valuesFromText(value) {
  if (!value?.trim()) return undefined;
  return value.split(/[\s,;]+/).filter(Boolean).map(Number);
}

export function serializeShortClipDraft(draft) {
  const sound = draft.sound ?? {};
  const payload = {
    version: "1.0",
    renderer: "ct-short-clip",
    algorithm: draft.algorithm,
    title: String(draft.title ?? "").trim(),
    subtitle: String(draft.subtitle ?? "").trim(),
    seed: optionalNumber(draft.seed, true),
    duration_sec: optionalNumber(draft.duration_sec),
    initial_values: valuesFromText(draft.initial_values),
    sound: {
      enabled: Boolean(sound.enabled),
      compare_hz: optionalNumber(sound.compare_hz),
      compare_ms: optionalNumber(sound.compare_ms),
      swap_hz: optionalNumber(sound.swap_hz),
      swap_ms: optionalNumber(sound.swap_ms),
      gain: optionalNumber(sound.gain),
    },
  };
  if (String(draft.source ?? "").trim()) payload.source = String(draft.source).trim();
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function valueOrEmpty(value) {
  return value === undefined || value === null ? "" : String(value);
}

export function createShortClipController({ root, projectId, getProjectId, onRendered, setActivity }) {
  let currentSpec = null;
  let locked = false;

  function field(name) {
    return root?.querySelector(`[data-short-clip-field="${name}"]`);
  }

  function setLocked(next) {
    locked = Boolean(next);
    root?.querySelectorAll("input, select, textarea, button").forEach((element) => { element.disabled = locked; });
    root?.classList.toggle("is-rendering", locked);
    const lockMessage = root?.querySelector("[data-short-clip-lock]");
    if (lockMessage) lockMessage.hidden = !locked;
  }

  function readDraft() {
    return {
      algorithm: field("algorithm")?.value,
      title: field("title")?.value,
      subtitle: field("subtitle")?.value,
      source: field("source")?.value,
      seed: field("seed")?.value,
      duration_sec: field("duration_sec")?.value,
      initial_values: field("initial_values")?.value,
      sound: {
        enabled: field("sound.enabled")?.checked,
        compare_hz: field("sound.compare_hz")?.value,
        compare_ms: field("sound.compare_ms")?.value,
        swap_hz: field("sound.swap_hz")?.value,
        swap_ms: field("sound.swap_ms")?.value,
        gain: field("sound.gain")?.value,
      },
    };
  }

  function applySpec(spec, renderLock = null) {
    currentSpec = spec;
    for (const name of ["algorithm", "title", "subtitle", "source", "seed", "duration_sec", "initial_values"]) {
      const element = field(name);
      if (element) element.value = name === "initial_values" ? valueOrEmpty(spec.initial_values?.join(", ")) : valueOrEmpty(spec[name]);
    }
    for (const name of ["compare_hz", "compare_ms", "swap_hz", "swap_ms", "gain"]) {
      const element = field(`sound.${name}`);
      if (element) element.value = valueOrEmpty(spec.sound?.[name]);
    }
    const enabled = field("sound.enabled");
    if (enabled) enabled.checked = spec.sound?.enabled !== false;
    const summary = root?.querySelector("[data-short-clip-summary]");
    if (summary) summary.innerHTML = renderShortClipSummary(spec);
    setLocked(Boolean(renderLock));
  }

  async function render() {
    if (locked) return;
    const status = root?.querySelector("[data-short-clip-status]");
    try {
      const script = serializeShortClipDraft(readDraft());
      const activeProjectId = getProjectId?.() ?? projectId;
      await saveProject({ projectId: activeProjectId, script });
      const result = await requestRender({ projectId: activeProjectId, mode: "video" });
      setLocked(true);
      setActivity?.("Đang render short clip…");
      while (true) {
        const job = await getJob(result.jobId);
        if (status) status.textContent = `${job.message} · ${job.progress}%`;
        if (job.status === "done") break;
        if (job.status === "error") throw new Error(job.error || "Render short clip thất bại.");
        await new Promise((resolve) => window.setTimeout(resolve, 350));
      }
      setActivity?.("Short clip đã sẵn sàng.");
      onRendered?.();
    } catch (error) {
      root?.querySelectorAll("[aria-invalid='true']").forEach((element) => element.removeAttribute("aria-invalid"));
      for (const issue of error?.fields ?? []) {
        const target = field((issue.path ?? []).join("."));
        target?.setAttribute("aria-invalid", "true");
      }
      if (status) status.textContent = error instanceof Error ? error.message : "Không lưu/render được short clip.";
      setActivity?.(status?.textContent || "Render thất bại.");
    } finally {
      setLocked(false);
    }
  }

  function mount(spec, renderLock = null) {
    if (!root) return;
    const algorithm = field("algorithm");
    if (algorithm && algorithm.options.length === 0) {
      algorithm.innerHTML = algorithms.map((value) => `<option value="${value}">${value}</option>`).join("");
    }
    applySpec(spec, renderLock);
    root.querySelector("[data-short-clip-render]")?.addEventListener("click", render);
  }

  return { applySpec, canEdit: () => canEditShortClip({ renderLock: locked ? { id: "active" } : null }), mount, readDraft, render, setLocked };
}
