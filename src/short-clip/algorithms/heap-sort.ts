import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const heapSortRuntime: AlgorithmRuntime = {
  title: "Heap Sort",
  subtitle: "Dựng max-heap rồi lần lượt đưa phần tử lớn nhất về cuối",
  timeComplexity: "O(n log n)",
  spaceComplexity: "O(1)",
  codeLines: [
    { n: 1, t: "function heapSort(a) {" },
    { n: 2, t: "  buildMaxHeap(a);" },
    { n: 3, t: "  for (let end = a.length-1; end > 0; end--) {" },
    { n: 4, t: "    [a[0], a[end]] = [a[end], a[0]];" },
    { n: 5, t: "    heapify(a, 0, end);" },
    { n: 6, t: "  }" },
    { n: 7, t: "  return a;" },
    { n: 8, t: "}" },
    { n: 9, t: "// heapify: chọn node con lớn hơn" },
    { n: 10, t: "// đổi node cha nếu cần" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const sorted = new Set<number>();

    const swap = (left: number, right: number, line: number, status: string): void => {
      [state.values[left], state.values[right]] = [state.values[right], state.values[left]];
      [state.order[left], state.order[right]] = [state.order[right], state.order[left]];
      state.operations.push(operation("swap", [left, right], state, line, [...sorted], status));
    };

    const heapify = (size: number, root: number): void => {
      let parent = root;
      while (true) {
        let largest = parent;
        const left = parent * 2 + 1;
        const right = left + 1;
        if (left < size) {
          state.operations.push(operation(
            "compare", [largest, left], state, 9, [...sorted],
            `Heap · ${state.values[largest]} và ${state.values[left]}`,
          ));
          if (state.values[left] > state.values[largest]) largest = left;
        }
        if (right < size) {
          state.operations.push(operation(
            "compare", [largest, right], state, 9, [...sorted],
            `Heap · ${state.values[largest]} và ${state.values[right]}`,
          ));
          if (state.values[right] > state.values[largest]) largest = right;
        }
        if (largest === parent) return;
        swap(parent, largest, 10, `Đưa ${state.values[largest]} lên node cha`);
        parent = largest;
      }
    };

    for (let root = Math.floor(state.values.length / 2) - 1; root >= 0; root--) {
      heapify(state.values.length, root);
    }
    for (let end = state.values.length - 1; end > 0; end--) {
      const maximum = state.values[0];
      swap(0, end, 4, `Đưa giá trị lớn nhất ${maximum} về cuối`);
      sorted.add(end);
      state.operations.push(operation(
        "mark_sorted", [end], state, 4, [...sorted], `Cố định vị trí ${end + 1}`,
      ));
      heapify(end, 0);
    }
    state.operations.push(operation(
      "done", [], state, 7, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
