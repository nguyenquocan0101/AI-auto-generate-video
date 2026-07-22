import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const bubbleSortRuntime: AlgorithmRuntime = {
  title: "Bubble Sort",
  subtitle: "Đổi chỗ hai phần tử kề nhau nếu sai thứ tự",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  codeLines: [
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
    { n: 11, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const sorted = new Set<number>();

    for (let i = 0; i < state.values.length - 1; i++) {
      let swapped = false;
      for (let j = 0; j < state.values.length - i - 1; j++) {
        state.operations.push(operation(
          "compare", [j, j + 1], state, 4, [...sorted],
          `${state.values[j]} và ${state.values[j + 1]} · so sánh`,
        ));
        if (state.values[j] > state.values[j + 1]) {
          const left = state.values[j];
          const right = state.values[j + 1];
          [state.values[j], state.values[j + 1]] = [state.values[j + 1], state.values[j]];
          [state.order[j], state.order[j + 1]] = [state.order[j + 1], state.order[j]];
          state.operations.push(operation(
            "swap", [j, j + 1], state, 5, [...sorted], `${left} > ${right} · đổi chỗ`,
          ));
          swapped = true;
        }
      }
      sorted.add(state.values.length - i - 1);
      state.operations.push(operation(
        "mark_sorted", [state.values.length - i - 1], state, 8, [...sorted],
        `Cố định vị trí ${state.values.length - i}`,
      ));
      if (!swapped) break;
    }
    state.operations.push(operation(
      "done", [], state, 10, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
