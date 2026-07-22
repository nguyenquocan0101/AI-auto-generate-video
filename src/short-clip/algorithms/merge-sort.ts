import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

interface Item {
  id: number;
  value: number;
}

export const mergeSortRuntime: AlgorithmRuntime = {
  title: "Merge Sort",
  subtitle: "Chia đôi mảng, sắp xếp từng nửa rồi trộn lại",
  timeComplexity: "O(n log n)",
  spaceComplexity: "O(n)",
  codeLines: [
    { n: 1, t: "function mergeSort(a, lo, hi) {" },
    { n: 2, t: "  if (lo >= hi) return;" },
    { n: 3, t: "  const mid = (lo + hi) >> 1;" },
    { n: 4, t: "  mergeSort(a, lo, mid);" },
    { n: 5, t: "  mergeSort(a, mid + 1, hi);" },
    { n: 6, t: "  while (left.length && right.length) {" },
    { n: 7, t: "    merged.push(smaller(left[0], right[0]));" },
    { n: 8, t: "  }" },
    { n: 9, t: "  a.splice(lo, merged.length, ...merged);" },
    { n: 10, t: "  return a;" },
    { n: 11, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const items: Item[] = initialValues.map((value, id) => ({ id, value }));

    const merge = (low: number, middle: number, high: number): void => {
      const left = items.slice(low, middle + 1);
      const right = items.slice(middle + 1, high + 1);
      const merged: Item[] = [];
      let leftIndex = 0;
      let rightIndex = 0;

      while (leftIndex < left.length && rightIndex < right.length) {
        const leftSlot = items.findIndex((item) => item.id === left[leftIndex].id);
        const rightSlot = items.findIndex((item) => item.id === right[rightIndex].id);
        state.operations.push(operation(
          "compare", [leftSlot, rightSlot], state, 6, [],
          `${left[leftIndex].value} và ${right[rightIndex].value} · trộn`,
        ));
        if (left[leftIndex].value <= right[rightIndex].value) {
          merged.push(left[leftIndex++]);
        } else {
          merged.push(right[rightIndex++]);
        }
      }
      merged.push(...left.slice(leftIndex), ...right.slice(rightIndex));

      for (let offset = 0; offset < merged.length; offset++) {
        const target = low + offset;
        const from = items.findIndex((item) => item.id === merged[offset].id);
        if (from === target) continue;
        const [moved] = items.splice(from, 1);
        items.splice(target, 0, moved);
        state.values = items.map((item) => item.value);
        state.order = items.map((item) => item.id);
        state.operations.push(operation(
          "move", [from, target], state, 9, [],
          `Chèn ${moved.value} vào vị trí ${target + 1}`,
        ));
      }
    };

    const sort = (low: number, high: number): void => {
      if (low >= high) return;
      const middle = Math.floor((low + high) / 2);
      sort(low, middle);
      sort(middle + 1, high);
      merge(low, middle, high);
    };

    sort(0, items.length - 1);
    state.operations.push(operation(
      "mark_sorted", allIndices(state.values), state, 10, allIndices(state.values),
      "Các nửa đã được trộn hoàn chỉnh",
    ));
    state.operations.push(operation(
      "done", [], state, 10, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
