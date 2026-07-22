import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const cocktailSortRuntime: AlgorithmRuntime = {
  title: "Cocktail Sort",
  subtitle: "Quét nổi bọt luân phiên từ trái sang phải và ngược lại",
  timeComplexity: "O(n²)",
  spaceComplexity: "O(1)",
  codeLines: [
    { n: 1, t: "function cocktailSort(a) {" },
    { n: 2, t: "  let left = 0, right = a.length - 1;" },
    { n: 3, t: "  while (left < right) {" },
    { n: 4, t: "    for (let i = left; i < right; i++)" },
    { n: 5, t: "      if (a[i] > a[i+1]) swap(a, i, i+1);" },
    { n: 6, t: "    right--;" },
    { n: 7, t: "    for (let i = right; i > left; i--)" },
    { n: 8, t: "      if (a[i-1] > a[i]) swap(a, i-1, i);" },
    { n: 9, t: "    left++;" },
    { n: 10, t: "  }" },
    { n: 11, t: "  return a;" },
    { n: 12, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const sorted = new Set<number>();
    let left = 0;
    let right = state.values.length - 1;

    const compareAndSwap = (first: number, second: number, line: number): boolean => {
      state.operations.push(operation(
        "compare", [first, second], state, line, [...sorted],
        `${state.values[first]} và ${state.values[second]} · so sánh`,
      ));
      if (state.values[first] <= state.values[second]) return false;
      const leftValue = state.values[first];
      const rightValue = state.values[second];
      [state.values[first], state.values[second]] = [state.values[second], state.values[first]];
      [state.order[first], state.order[second]] = [state.order[second], state.order[first]];
      state.operations.push(operation(
        "swap", [first, second], state, line, [...sorted], `${leftValue} > ${rightValue} · đổi chỗ`,
      ));
      return true;
    };

    while (left < right) {
      let swapped = false;
      for (let index = left; index < right; index++) {
        swapped = compareAndSwap(index, index + 1, 5) || swapped;
      }
      sorted.add(right);
      state.operations.push(operation(
        "mark_sorted", [right], state, 6, [...sorted], `Cố định biên phải ${right + 1}`,
      ));
      right--;
      if (!swapped) break;

      swapped = false;
      for (let index = right; index > left; index--) {
        swapped = compareAndSwap(index - 1, index, 8) || swapped;
      }
      sorted.add(left);
      state.operations.push(operation(
        "mark_sorted", [left], state, 9, [...sorted], `Cố định biên trái ${left + 1}`,
      ));
      left++;
      if (!swapped) break;
    }
    state.operations.push(operation(
      "done", [], state, 11, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
