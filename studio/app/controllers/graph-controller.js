export function createGraphController({
  projectId,
  nodeCanvas,
  edgeLayer,
  canvasViewport,
  zoomLevel,
  getSceneIds,
  onStatus,
  onOrderChanged,
  onGraphInvalidated,
  onPersistRequested,
}) {
  let edges = [];
  let nodePositions = {};
  let graphSignature = "";
  let initialGraph = null;
  let selectedEdge = -1;
  let connectionFrom = null;
  let connectionPointer = null;
  let nodeDrag = null;
  let canvasZoom = 1;
  let locked = false;

  function graphNodes() {
    return ["storyboard", ...getSceneIds(), "output"];
  }

  function defaultEdges() {
    const nodes = graphNodes();
    return nodes.slice(0, -1).map((from, index) => ({ from, to: nodes[index + 1] }));
  }

  function defaultPositions() {
    const positions = { storyboard: { x: 40, y: 150 } };
    getSceneIds().forEach((id, index) => {
      positions[id] = { x: 400 + index * 346, y: 70 + (index % 2) * 90 };
    });
    positions.output = { x: 400 + getSceneIds().length * 346, y: 130 };
    return positions;
  }

  function snapshot() {
    return { signature: graphSignature, edges, nodePositions };
  }

  function saveGraph() {
    if (locked) return;
    localStorage.setItem(`pipeline-graph:${projectId}`, JSON.stringify(snapshot()));
    onPersistRequested?.();
  }

  function setInitialGraph(graph) {
    initialGraph = graph ?? null;
  }

  function setProjectId(nextProjectId) {
    if (!nextProjectId || nextProjectId === projectId) return;
    projectId = nextProjectId;
    graphSignature = "";
  }

  function ensureGraph() {
    const signature = graphNodes().slice().sort().join("|");
    if (signature === graphSignature) return;
    graphSignature = signature;
    const defaults = defaultPositions();
    try {
      const localGraph = JSON.parse(localStorage.getItem(`pipeline-graph:${projectId}`) ?? "null");
      const saved = initialGraph?.signature === signature ? initialGraph : localGraph;
      initialGraph = null;
      if (saved?.signature === signature) {
        edges = Array.isArray(saved.edges) ? saved.edges : defaultEdges();
        const loadedPositions = { ...defaults, ...(saved.nodePositions ?? {}) };
        const positionKeys = graphNodes().filter((id) => Number.isFinite(loadedPositions[id]?.x) && Number.isFinite(loadedPositions[id]?.y));
        const uniquePositions = new Set(positionKeys.map((id) => `${Math.round(loadedPositions[id].x)}:${Math.round(loadedPositions[id].y)}`));
        nodePositions = positionKeys.length === graphNodes().length && uniquePositions.size >= Math.ceil(graphNodes().length * 0.8)
          ? loadedPositions
          : defaults;
        return;
      }
    } catch {
      // Invalid local layout falls back to the deterministic graph below.
    }
    edges = defaultEdges();
    nodePositions = defaults;
    saveGraph();
  }

  function canvasScale() {
    if (!nodeCanvas?.offsetWidth) return canvasZoom;
    return nodeCanvas.getBoundingClientRect().width / nodeCanvas.offsetWidth || canvasZoom;
  }

  function canvasPoint(clientX, clientY) {
    const rect = nodeCanvas.getBoundingClientRect();
    const scale = canvasScale();
    return { x: (clientX - rect.left) / scale, y: (clientY - rect.top) / scale };
  }

  function portPoint(nodeId, direction) {
    const selector = direction === "out" ? `[data-port-out="${CSS.escape(nodeId)}"]` : `[data-port-in="${CSS.escape(nodeId)}"]`;
    const port = nodeCanvas.querySelector(selector);
    if (!port) return null;
    const portRect = port.getBoundingClientRect();
    const canvasRect = nodeCanvas.getBoundingClientRect();
    const scale = canvasScale();
    return {
      x: (portRect.left + portRect.width / 2 - canvasRect.left) / scale,
      y: (portRect.top + portRect.height / 2 - canvasRect.top) / scale,
    };
  }

  function edgePath(start, end) {
    const bend = Math.max(70, Math.abs(end.x - start.x) * 0.42);
    return `M ${start.x} ${start.y} C ${start.x + bend} ${start.y}, ${end.x - bend} ${end.y}, ${end.x} ${end.y}`;
  }

  function drawConnections() {
    const paths = edges.map((edge, index) => {
      const start = portPoint(edge.from, "out");
      const end = portPoint(edge.to, "in");
      if (!start || !end) return "";
      const path = edgePath(start, end);
      const selected = index === selectedEdge ? " selected" : "";
      return `<path class="edge-visible${selected}" d="${path}"></path><path class="edge-hit" data-edge-index="${index}" d="${path}"></path>`;
    }).join("");
    let temporary = "";
    if (connectionFrom && connectionPointer) {
      const start = portPoint(connectionFrom, "out");
      if (start) temporary = `<path class="edge-temporary" d="${edgePath(start, connectionPointer)}"></path>`;
    }
    edgeLayer.innerHTML = paths + temporary;
  }

  function applyNodePositions() {
    let maxX = 1200;
    let maxY = 900;
    nodeCanvas.querySelectorAll("[data-node-id]").forEach((node) => {
      const id = node.dataset.nodeId;
      const position = nodePositions[id] ?? { x: 40, y: 80 };
      node.style.left = `${position.x}px`;
      node.style.top = `${position.y}px`;
      node.style.transform = "none";
      maxX = Math.max(maxX, position.x + node.offsetWidth + 180);
      maxY = Math.max(maxY, position.y + node.offsetHeight + 180);
    });
    nodeCanvas.style.width = `${maxX}px`;
    nodeCanvas.style.height = `${maxY}px`;
    nodeCanvas.style.transform = `scale(${canvasZoom})`;
    nodeCanvas.style.transformOrigin = "top left";
    if (zoomLevel) zoomLevel.textContent = `${Math.round(canvasZoom * 100)}%`;
    edgeLayer.setAttribute("viewBox", `0 0 ${maxX} ${maxY}`);
    edgeLayer.setAttribute("width", maxX);
    edgeLayer.setAttribute("height", maxY);
    requestAnimationFrame(drawConnections);
  }

  function updateZoom(nextZoom) {
    canvasZoom = Math.min(1.6, Math.max(0.55, Math.round(nextZoom * 20) / 20));
    nodeCanvas.style.transform = `scale(${canvasZoom})`;
    nodeCanvas.style.transformOrigin = "top left";
    if (zoomLevel) zoomLevel.textContent = `${Math.round(canvasZoom * 100)}%`;
    requestAnimationFrame(drawConnections);
  }

  function sceneOrder() {
    const sceneIds = getSceneIds();
    const ordered = [];
    const visited = new Set(["storyboard"]);
    let current = "storyboard";
    while (current !== "output") {
      const edge = edges.find((item) => item.from === current);
      if (!edge || visited.has(edge.to)) return null;
      current = edge.to;
      visited.add(current);
      if (current !== "output") {
        if (!sceneIds.includes(current)) return null;
        ordered.push(current);
      }
    }
    return ordered.length === sceneIds.length ? ordered : null;
  }

  function wouldCreateCycle(from, to, candidateEdges) {
    let current = to;
    const visited = new Set();
    while (current && !visited.has(current)) {
      if (current === from) return true;
      visited.add(current);
      current = candidateEdges.find((edge) => edge.from === current)?.to;
    }
    return false;
  }

  function connectNodes(from, to) {
    if (locked) return;
    if (!from || !to || from === to) return;
    const candidateEdges = edges.filter((edge) => edge.from !== from && edge.to !== to);
    if (wouldCreateCycle(from, to, candidateEdges)) {
      onStatus?.("Không thể tạo vòng lặp trong pipeline video.");
      return;
    }
    edges = [...candidateEdges, { from, to }];
    selectedEdge = -1;
    saveGraph();
    const order = sceneOrder();
    if (order) {
      onOrderChanged?.(order);
      onStatus?.("Đã cập nhật thứ tự scene theo đường nối. Hãy ghép lại MP4 cuối.");
    } else {
      drawConnections();
      onStatus?.("Đã nối node. Pipeline chưa liền mạch từ Storyboard đến Output.");
    }
  }

  function deleteSelectedEdge() {
    if (locked) return;
    if (selectedEdge < 0) return;
    edges.splice(selectedEdge, 1);
    selectedEdge = -1;
    saveGraph();
    drawConnections();
    onGraphInvalidated?.();
    onStatus?.("Đã xoá đường nối. Hãy nối lại pipeline trước khi ghép video.");
  }

  function mount() {
    nodeCanvas.addEventListener("pointerdown", (event) => {
      if (locked) return;
      const outputPort = event.target.closest("[data-port-out]");
      if (outputPort) {
        event.preventDefault();
        connectionFrom = outputPort.dataset.portOut;
        connectionPointer = canvasPoint(event.clientX, event.clientY);
        nodeCanvas.classList.add("connecting");
        selectedEdge = -1;
        drawConnections();
        return;
      }
      const handle = event.target.closest("[data-drag-node]");
      if (!handle) {
        if (!event.target.closest("[data-edge-index]")) {
          selectedEdge = -1;
          drawConnections();
        }
        return;
      }
      const id = handle.dataset.dragNode;
      const position = nodePositions[id];
      if (!position) return;
      event.preventDefault();
      nodeDrag = { id, startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y };
      nodeCanvas.querySelector(`[data-node-id="${CSS.escape(id)}"]`)?.classList.add("moving");
    });

    document.addEventListener("pointermove", (event) => {
      if (nodeDrag) {
        const position = nodePositions[nodeDrag.id];
        position.x = Math.max(0, nodeDrag.originX + (event.clientX - nodeDrag.startX) / canvasScale());
        position.y = Math.max(0, nodeDrag.originY + (event.clientY - nodeDrag.startY) / canvasScale());
        const node = nodeCanvas.querySelector(`[data-node-id="${CSS.escape(nodeDrag.id)}"]`);
        if (node) {
          node.style.left = `${position.x}px`;
          node.style.top = `${position.y}px`;
        }
        drawConnections();
      }
      if (connectionFrom) {
        connectionPointer = canvasPoint(event.clientX, event.clientY);
        drawConnections();
      }
    });

    document.addEventListener("pointerup", (event) => {
      if (nodeDrag) {
        nodeCanvas.querySelector(`[data-node-id="${CSS.escape(nodeDrag.id)}"]`)?.classList.remove("moving");
        nodeDrag = null;
        saveGraph();
        applyNodePositions();
      }
      if (connectionFrom) {
        const inputPort = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-port-in]");
        const from = connectionFrom;
        connectionFrom = null;
        connectionPointer = null;
        nodeCanvas.classList.remove("connecting");
        if (inputPort) connectNodes(from, inputPort.dataset.portIn);
        else drawConnections();
      }
    });

    nodeCanvas.addEventListener("click", (event) => {
      if (locked) return;
      const outputPort = event.target.closest("[data-port-out]");
      if (outputPort) {
        connectionFrom = outputPort.dataset.portOut;
        connectionPointer = portPoint(connectionFrom, "out");
        nodeCanvas.classList.add("connecting");
        onStatus?.("Chọn cổng bên trái của node đích để hoàn tất đường nối.");
        drawConnections();
        return;
      }
      const inputPort = event.target.closest("[data-port-in]");
      if (inputPort && connectionFrom) {
        const from = connectionFrom;
        connectionFrom = null;
        connectionPointer = null;
        nodeCanvas.classList.remove("connecting");
        connectNodes(from, inputPort.dataset.portIn);
      }
    });

    edgeLayer.addEventListener("click", (event) => {
      const path = event.target.closest("[data-edge-index]");
      if (!path) return;
      selectedEdge = Number(path.dataset.edgeIndex);
      drawConnections();
      onStatus?.("Đã chọn đường nối. Nhấn Delete để xoá đường này.");
    });

    edgeLayer.addEventListener("dblclick", (event) => {
      if (locked) return;
      const path = event.target.closest("[data-edge-index]");
      if (!path) return;
      selectedEdge = Number(path.dataset.edgeIndex);
      deleteSelectedEdge();
    });

    document.addEventListener("keydown", (event) => {
      if (locked) return;
      if (event.key === "Escape" && connectionFrom) {
        connectionFrom = null;
        connectionPointer = null;
        nodeCanvas.classList.remove("connecting");
        drawConnections();
        onStatus?.("Đã huỷ thao tác nối node.");
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEdge >= 0 && !event.target.matches("input, textarea")) {
        deleteSelectedEdge();
      }
    });

    document.querySelector("#zoom-out")?.addEventListener("click", () => updateZoom(canvasZoom - 0.1));
    document.querySelector("#zoom-in")?.addEventListener("click", () => updateZoom(canvasZoom + 0.1));
    document.querySelector("#zoom-reset")?.addEventListener("click", () => updateZoom(1));
    canvasViewport.addEventListener("wheel", (event) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      updateZoom(canvasZoom + (event.deltaY < 0 ? 0.05 : -0.05));
    }, { passive: false });
    document.querySelector("#reset-layout")?.addEventListener("click", () => {
      if (locked) return;
      nodePositions = defaultPositions();
      saveGraph();
      applyNodePositions();
      onStatus?.("Đã sắp xếp lại các node trên canvas.");
    });
    document.querySelector("#reset-connections")?.addEventListener("click", () => {
      if (locked) return;
      edges = defaultEdges();
      selectedEdge = -1;
      saveGraph();
      const order = sceneOrder();
      if (order) onOrderChanged?.(order);
      onStatus?.("Đã nối lại Storyboard, các scene và Output theo thứ tự hiện tại.");
    });
    window.addEventListener("resize", () => requestAnimationFrame(drawConnections));
  }

  return {
    applyNodePositions,
    drawConnections,
    ensureGraph,
    mount,
    sceneOrder,
    setInitialGraph,
    setProjectId,
    snapshot,
    setLocked(nextLocked) {
      locked = Boolean(nextLocked);
      if (locked) {
        nodeDrag = null;
        connectionFrom = null;
        connectionPointer = null;
        nodeCanvas.classList.remove("connecting");
      }
      nodeCanvas.classList.toggle("is-locked", locked);
      drawConnections();
    },
  };
}
