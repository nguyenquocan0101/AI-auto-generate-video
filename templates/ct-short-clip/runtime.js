(function () {
  "use strict";

  var sample = {
    title: "Bubble Sort",
    subtitle: "Đổi chỗ hai phần tử kề nhau nếu sai thứ tự",
    time_complexity: "O(n²)",
    space_complexity: "O(1)",
    duration_sec: 24,
    initial_values: [54, 24, 72, 36, 18, 60, 42, 78, 30, 48, 66, 12],
    code_lines: [
      { n: 1, t: "function bubbleSort(a) {" },
      { n: 2, t: "  for (let i = 0; i < a.length; i++) {" },
      { n: 3, t: "    for (let j = 0; j < a.length-i-1; j++) {" },
      { n: 4, t: "      if (a[j] > a[j + 1]) {" },
      { n: 5, t: "        [a[j], a[j+1]] = [a[j+1], a[j]];" },
      { n: 6, t: "      }" },
      { n: 7, t: "    }" },
      { n: 8, t: "    // phần tử cuối đã đúng vị trí" },
      { n: 9, t: "  }" },
      { n: 10, t: "  return a;" },
      { n: 11, t: "}" }
    ],
    operations: []
  };

  var injected = window.__hyperframes && typeof window.__hyperframes.getVariables === "function"
    ? window.__hyperframes.getVariables()
    : {};
  var data = Object.assign({}, sample, injected || {});
  var root = document.getElementById("root");
  var content = document.querySelector(".content");
  var brandIntro = document.getElementById("brand-intro");
  var brandOutro = document.getElementById("brand-outro");
  var brandBackdrop = document.getElementById("brand-backdrop");
  var brandAura = document.getElementById("brand-aura");
  var brandIntroMark = document.getElementById("brand-intro-mark");
  var brandIntroCopy = document.getElementById("brand-intro-copy");
  var bars = document.getElementById("bars");
  var operations = Array.isArray(data.operations) ? data.operations.slice().sort(function (a, b) { return a.time_ms - b.time_ms; }) : [];
  var initialValues = Array.isArray(data.initial_values) && data.initial_values.length ? data.initial_values.map(Number) : sample.initial_values;
  var initialOrder = initialValues.map(function (_, index) { return index; });
  var durationSec = Math.max(1, Number(data.duration_sec) || 24);
  var maximum = Math.max.apply(null, initialValues.map(function (value) { return Math.abs(value) || 0; }).concat([1]));
  var barNodes = [];
  var codeNodes = [];

  root.classList.toggle("dense-bars", initialValues.length > 24);
  root.classList.toggle("ultra-dense-bars", initialValues.length > 36);

  root.setAttribute("data-duration", String(durationSec));

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = String(value == null ? "" : value);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>]/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char];
    });
  }

  function syntax(value) {
    var escaped = escapeHtml(value);
    var commentAt = escaped.indexOf("//");
    var code = commentAt >= 0 ? escaped.slice(0, commentAt) : escaped;
    var comment = commentAt >= 0 ? escaped.slice(commentAt) : "";
    code = code
      .replace(/\b(function|for|let|const|if|else|return|while)\b/g, '<span class="kw">$1</span>')
      .replace(/\b(bubbleSort|selectionSort|insertionSort|quickSort|mergeSort|heapSort|shellSort|cocktailSort|buildMaxHeap|heapify|swap|smaller)\b/g, '<span class="fn">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
    return code + (comment ? '<span class="comment">' + comment + "</span>" : "");
  }

  function renderStaticContent() {
    setText("title", data.title);
    setText("subtitle", data.subtitle);
    setText("time", data.time_complexity);
    setText("space", data.space_complexity);

    bars.innerHTML = initialValues.map(function (value, itemId) {
      var height = 54 + (Math.abs(value) / maximum) * 430;
      return '<div class="bar-item" data-item="' + itemId + '"><div class="bar" data-value="' +
        escapeHtml(value) + '" style="height:' + height + 'px"></div></div>';
    }).join("");
    barNodes = Array.prototype.slice.call(bars.querySelectorAll(".bar-item"));

    var lines = Array.isArray(data.code_lines) ? data.code_lines : [];
    document.getElementById("code").innerHTML = lines.map(function (row, index) {
      var number = typeof row === "string" ? index + 1 : row.n;
      var value = typeof row === "string" ? row : row.t;
      return '<div class="line" data-line="' + number + '"><span class="ln">' + number +
        '</span><span class="code-text">' + syntax(value || "") + "</span></div>";
    }).join("");
    codeNodes = Array.prototype.slice.call(document.querySelectorAll(".line"));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function smoothstep(value) {
    var t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function operationIndexAt(timeMs) {
    var low = 0;
    var high = operations.length - 1;
    var result = -1;
    while (low <= high) {
      var middle = Math.floor((low + high) / 2);
      if (operations[middle].time_ms <= timeMs) {
        result = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return result;
  }

  function applyTime(seconds) {
    var safeSeconds = clamp(Number(seconds) || 0, 0, durationSec);
    var timeMs = safeSeconds * 1000;
    var opIndex = operationIndexAt(timeMs);
    var current = opIndex >= 0 ? operations[opIndex] : null;
    var previous = opIndex > 0 ? operations[opIndex - 1] : null;
    var previousOrder = previous && Array.isArray(previous.order) ? previous.order : initialOrder;
    var targetOrder = current && Array.isArray(current.order) ? current.order : previousOrder;
    var nextTime = opIndex + 1 < operations.length ? operations[opIndex + 1].time_ms : durationSec * 1000;
    var availableMs = current ? Math.max(1, nextTime - current.time_ms) : 1;
    var isMovement = current && (current.type === "swap" || current.type === "move");
    var movementDuration = Math.min(320, availableMs * 0.82);
    var movementProgress = isMovement
      ? clamp((timeMs - current.time_ms) / Math.max(1, movementDuration), 0, 1)
      : 1;
    var activeItems = [];
    if (current && Array.isArray(current.indices)) {
      current.indices.forEach(function (slot) {
        var item = previousOrder[slot];
        if (item != null) activeItems.push(item);
      });
    }
    var sortedSlots = current && Array.isArray(current.sorted_indices) ? current.sorted_indices : [];
    var width = bars.clientWidth || 880;
    var gap = initialValues.length > 16 ? 7 : 10;
    var slotWidth = (width - gap * (initialValues.length - 1)) / initialValues.length;

    barNodes.forEach(function (node) {
      var itemId = Number(node.getAttribute("data-item"));
      var fromIndex = previousOrder.indexOf(itemId);
      var toIndex = targetOrder.indexOf(itemId);
      if (fromIndex < 0) fromIndex = toIndex;
      if (toIndex < 0) toIndex = fromIndex;
      var position = fromIndex + (toIndex - fromIndex) * movementProgress;
      node.style.width = slotWidth + "px";
      node.style.transform = "translateX(" + (position * (slotWidth + gap)) + "px)";
      var bar = node.firstElementChild;
      var classes = ["bar"];
      if (activeItems.indexOf(itemId) >= 0) classes.push("active");
      if (isMovement && activeItems.indexOf(itemId) >= 0 && movementProgress < 1) classes.push("swapping");
      if (current && current.type === "pivot" && activeItems.indexOf(itemId) >= 0) classes.push("pivot");
      if (sortedSlots.indexOf(toIndex) >= 0) classes.push("sorted");
      bar.className = classes.join(" ");
    });

    var activeLine = current ? Number(current.active_line_num) : -1;
    codeNodes.forEach(function (node) {
      node.classList.toggle("active", Number(node.getAttribute("data-line")) === activeLine);
    });
    setText("status", current ? current.status : "Mảng ban đầu");
    setText("step", String(Math.max(0, opIndex + 1)).padStart(2, "0") + " / " + String(operations.length).padStart(2, "0"));
    document.getElementById("progress").style.width = (safeSeconds / durationSec * 100) + "%";
    var introExit = smoothstep((timeMs - 650) / 850);
    var markToTrace = smoothstep((timeMs - 600) / 950);
    var outroStart = durationSec * 1000 - 1700;
    var outroProgress = smoothstep((timeMs - outroStart) / 700);
    var contentIn = smoothstep((timeMs - 800) / 700);
    var contentOut = 1 - outroProgress;
    var contentAlpha = contentIn * contentOut;
    content.style.opacity = String(contentAlpha);
    content.style.transform = "translateY(" + ((1 - contentIn) * 24 + outroProgress * 18) + "px) scale(" + (0.985 + contentAlpha * 0.015) + ")";
    brandBackdrop.style.opacity = String(1 - introExit);
    brandAura.style.opacity = String(1 - smoothstep((timeMs - 420) / 760));
    brandIntroCopy.style.opacity = String(1 - introExit);
    brandIntroCopy.style.transform = "translateY(" + (-introExit * 22) + "px)";
    var markX = -410 * markToTrace * (1 - outroProgress);
    var markY = -700 * markToTrace * (1 - outroProgress) + 51 * outroProgress;
    var markScale = (1 + (0.38 - 1) * markToTrace) * (1 - outroProgress) + 0.68 * outroProgress;
    var markRotation = -3 * (1 - markToTrace) + 3 * outroProgress;
    brandIntroMark.style.opacity = "1";
    brandIntroMark.style.transform = "translate(-50%, -50%) translate(" + markX + "px, " + markY + "px) scale(" + markScale + ") rotate(" + markRotation + "deg)";
    brandOutro.style.opacity = String(outroProgress);
    brandOutro.style.transform = "translateY(" + ((1 - outroProgress) * 22) + "px) scale(" + (0.985 + outroProgress * 0.015) + ")";
  }

  renderStaticContent();
  var timeline = {
    pause: function () { return timeline; },
    seek: function (seconds) { applyTime(seconds); return timeline; },
    paused: function () { return true; },
    duration: function () { return durationSec; }
  };
  window.__timelines = window.__timelines || {};
  window.__timelines.main = timeline;
  applyTime(0);

})();
