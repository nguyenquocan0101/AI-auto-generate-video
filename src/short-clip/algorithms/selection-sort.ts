import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const selectionSortRuntime: AlgorithmRuntime = {
  title: "Selection Sort",
  subtitle: "Chọn phần tử nhỏ nhất và đưa về đầu vùng chưa sắp xếp",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  codeLines: [
    { n: 1, t: "function selectionSort(a) {" },
    { n: 2, t: "  for (let i = 0; i < a.length - 1; i++) {" },
    { n: 3, t: "    let min = i;" },
    { n: 4, t: "    for (let j = i + 1; j < a.length; j++) {" },
    { n: 5, t: "      if (a[j] < a[min]) min = j;" },
    { n: 6, t: "    }" },
    { n: 7, t: "    [a[i], a[min]] = [a[min], a[i]];" },
    { n: 8, t: "    // vị trí i đã hoàn tất" },
    { n: 9, t: "  }" },
    { n: 10, t: "  return a;" },
    { n: 11, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const sorted = new Set<number>();

    for (let i = 0; i < state.values.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < state.values.length; j++) {
        state.operations.push(operation(
          "compare", [min, j], state, 5, [...sorted],
          `Tìm nhỏ nhất · ${state.values[min]} và ${state.values[j]}`,
        ));
        if (state.values[j] < state.values[min]) min = j;
      }
      if (min !== i) {
        const left = state.values[i];
        const right = state.values[min];
        [state.values[i], state.values[min]] = [state.values[min], state.values[i]];
        [state.order[i], state.order[min]] = [state.order[min], state.order[i]];
        state.operations.push(operation(
          "swap", [i, min], state, 7, [...sorted], `Đưa ${right} về trước ${left}`,
        ));
      }
      sorted.add(i);
      state.operations.push(operation(
        "mark_sorted", [i], state, 8, [...sorted], `Cố định vị trí ${i + 1}`,
      ));
    }
    state.operations.push(operation(
      "done", [], state, 10, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
