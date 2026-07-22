import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const shellSortRuntime: AlgorithmRuntime = {
  title: "Shell Sort",
  subtitle: "Sắp xếp chèn theo khoảng cách gap giảm dần",
  timeComplexity: "O(n²) worst",
  spaceComplexity: "O(1)",
  codeLines: [
    { n: 1, t: "function shellSort(a) {" },
    { n: 2, t: "  for (let gap = a.length >> 1; gap > 0; gap >>= 1) {" },
    { n: 3, t: "    for (let i = gap; i < a.length; i++) {" },
    { n: 4, t: "      let j = i;" },
    { n: 5, t: "      while (j >= gap && a[j-gap] > a[j]) {" },
    { n: 6, t: "        [a[j-gap], a[j]] = [a[j], a[j-gap]];" },
    { n: 7, t: "        j -= gap;" },
    { n: 8, t: "      }" },
    { n: 9, t: "    }" },
    { n: 10, t: "  }" },
    { n: 11, t: "  return a;" },
    { n: 12, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);

    for (let gap = Math.floor(state.values.length / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < state.values.length; i++) {
        let j = i;
        while (j >= gap) {
          state.operations.push(operation(
            "compare", [j - gap, j], state, 5, [],
            `Gap ${gap} · ${state.values[j - gap]} và ${state.values[j]}`,
          ));
          if (state.values[j - gap] <= state.values[j]) break;
          const moved = state.values[j];
          [state.values[j - gap], state.values[j]] = [state.values[j], state.values[j - gap]];
          [state.order[j - gap], state.order[j]] = [state.order[j], state.order[j - gap]];
          state.operations.push(operation(
            "swap", [j - gap, j], state, 6, [], `Dịch ${moved} qua gap ${gap}`,
          ));
          j -= gap;
        }
      }
    }
    state.operations.push(operation(
      "done", [], state, 11, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
