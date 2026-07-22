import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const insertionSortRuntime: AlgorithmRuntime = {
  title: "Insertion Sort",
  subtitle: "Chèn từng phần tử vào đúng vị trí trong đoạn đã sắp xếp",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  codeLines: [
    { n: 1, t: "function insertionSort(a) {" },
    { n: 2, t: "  for (let i = 1; i < a.length; i++) {" },
    { n: 3, t: "    let j = i;" },
    { n: 4, t: "    while (j > 0 && a[j-1] > a[j]) {" },
    { n: 5, t: "      [a[j-1], a[j]] = [a[j], a[j-1]];" },
    { n: 6, t: "      j--;" },
    { n: 7, t: "    } // đoạn 0..i đã được sắp xếp" },
    { n: 8, t: "  }" },
    { n: 9, t: "  return a;" },
    { n: 10, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    let sorted = [0];

    for (let i = 1; i < state.values.length; i++) {
      let j = i;
      while (j > 0) {
        state.operations.push(operation(
          "compare", [j - 1, j], state, 4, sorted,
          `${state.values[j - 1]} và ${state.values[j]} · so sánh`,
        ));
        if (state.values[j - 1] <= state.values[j]) break;
        const left = state.values[j - 1];
        const right = state.values[j];
        [state.values[j - 1], state.values[j]] = [state.values[j], state.values[j - 1]];
        [state.order[j - 1], state.order[j]] = [state.order[j], state.order[j - 1]];
        state.operations.push(operation(
          "swap", [j - 1, j], state, 5, sorted, `Chèn ${right} trước ${left}`,
        ));
        j--;
      }
      sorted = Array.from({ length: i + 1 }, (_, index) => index);
      state.operations.push(operation(
        "mark_sorted", sorted, state, 7, sorted, `Đoạn đầu ${i + 1} phần tử đã có thứ tự`,
      ));
    }
    state.operations.push(operation(
      "done", [], state, 9, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
