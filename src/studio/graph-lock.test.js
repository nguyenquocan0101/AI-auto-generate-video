import { afterEach, describe, expect, it, vi } from "vitest";
import { createGraphController } from "../../studio/app/controllers/graph-controller.js";

function eventTarget(extra = {}) {
  const listeners = new Map();
  return {
    ...extra,
    addEventListener(type, listener) {
      const values = listeners.get(type) ?? [];
      values.push(listener);
      listeners.set(type, values);
    },
    dispatch(type, event = {}) {
      for (const listener of listeners.get(type) ?? []) listener({ target: this, ...event });
    },
  };
}

const previousGlobals = {};

afterEach(() => {
  for (const [name, value] of Object.entries(previousGlobals)) {
    if (value === undefined) delete globalThis[name];
    else globalThis[name] = value;
  }
  for (const name of Object.keys(previousGlobals)) delete previousGlobals[name];
});

describe("graph controller lock", () => {
  it("blocks reset mutations and local persistence while locked", () => {
    const resetLayout = eventTarget();
    const resetConnections = eventTarget();
    const documentTarget = eventTarget({
      querySelector(selector) {
        if (selector === "#reset-layout") return resetLayout;
        if (selector === "#reset-connections") return resetConnections;
        return null;
      },
    });
    const nodeCanvas = eventTarget({
      classList: { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() },
      querySelector: () => null,
      querySelectorAll: () => [],
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 100 }),
      offsetWidth: 100,
    });
    const edgeLayer = eventTarget({ innerHTML: "" });
    const canvasViewport = eventTarget();
    const storage = new Map();
    const localStorage = {
      getItem: (key) => storage.get(key) ?? null,
      setItem: vi.fn((key, value) => storage.set(key, value)),
    };
    Object.assign(previousGlobals, {
      document: globalThis.document,
      window: globalThis.window,
      localStorage: globalThis.localStorage,
      requestAnimationFrame: globalThis.requestAnimationFrame,
      CSS: globalThis.CSS,
    });
    globalThis.document = documentTarget;
    globalThis.window = eventTarget();
    globalThis.localStorage = localStorage;
    globalThis.requestAnimationFrame = (callback) => callback();
    globalThis.CSS = { escape: (value) => String(value) };

    const graph = createGraphController({
      projectId: "demo",
      nodeCanvas,
      edgeLayer,
      canvasViewport,
      zoomLevel: null,
      getSceneIds: () => ["s1", "s2"],
    });
    graph.ensureGraph();
    graph.mount();
    const before = graph.snapshot();
    const writesBeforeLock = localStorage.setItem.mock.calls.length;
    graph.setLocked(true);
    resetLayout.dispatch("click");
    resetConnections.dispatch("click");

    expect(graph.snapshot()).toEqual(before);
    expect(localStorage.setItem).toHaveBeenCalledTimes(writesBeforeLock);
  });
});
