import type { AlgorithmRuntime } from "./types.js";
import { allIndices, createTraceState, operation } from "./types.js";

export const quickSortRuntime: AlgorithmRuntime = {
  title: "Quick Sort",
  subtitle: "Chọn pivot, phân hoạch rồi sắp xếp đệ quy hai phía",
  timeComplexity: "O(n log n) avg",
  spaceComplexity: "O(log n)",
  codeLines: [
    { n: 1, t: "function quickSort(a, lo, hi) {" },
    { n: 2, t: "  if (lo >= hi) return;" },
    { n: 3, t: "  const pivot = a[hi];" },
    { n: 4, t: "  let i = lo;" },
    { n: 5, t: "  for (let j = lo; j < hi; j++) {" },
    { n: 6, t: "    if (a[j] < pivot) {" },
    { n: 7, t: "      [a[i], a[j]] = [a[j], a[i]];" },
    { n: 8, t: "      i++;" },
    { n: 9, t: "    }" },
    { n: 10, t: "  }" },
    { n: 11, t: "  [a[i], a[hi]] = [a[hi], a[i]];" },
    { n: 12, t: "  quickSort(a, lo, i-1); quickSort(a, i+1, hi);" },
    { n: 13, t: "}" },
  ],
  trace(initialValues) {
    const state = createTraceState(initialValues);
    const sorted = new Set<number>();

    const sort = (low: number, high: number): void => {
      if (low > high) return;
      if (low === high) {
        sorted.add(low);
        state.operations.push(operation(
          "mark_sorted", [low], state, 2, [...sorted], `Vị trí ${low + 1} đã hoàn tất`,
        ));
        return;
      }

      const pivotValue = state.values[high];
      state.operations.push(operation(
        "pivot", [high], state, 3, [...sorted], `Pivot · ${pivotValue}`,
      ));
      let target = low;
      for (let scan = low; scan < high; scan++) {
        state.operations.push(operation(
          "compare", [scan, high], state, 6, [...sorted],
          `${state.values[scan]} so với pivot ${pivotValue}`,
        ));
        if (state.values[scan] < pivotValue) {
          if (target !== scan) {
            const left = state.values[target];
            const right = state.values[scan];
            [state.values[target], state.values[scan]] = [state.values[scan], state.values[target]];
            [state.order[target], state.order[scan]] = [state.order[scan], state.order[target]];
            state.operations.push(operation(
              "swap", [target, scan], state, 7, [...sorted], `Đưa ${right} sang trái pivot ${left}`,
            ));
          }
          target++;
        }
      }
      if (target !== high) {
        const displaced = state.values[target];
        [state.values[target], state.values[high]] = [state.values[high], state.values[target]];
        [state.order[target], state.order[high]] = [state.order[high], state.order[target]];
        state.operations.push(operation(
          "swap", [target, high], state, 11, [...sorted],
          `Đặt pivot ${pivotValue} trước ${displaced}`,
        ));
      }
      sorted.add(target);
      state.operations.push(operation(
        "mark_sorted", [target], state, 11, [...sorted], `Pivot cố định tại vị trí ${target + 1}`,
      ));
      sort(low, target - 1);
      sort(target + 1, high);
    };

    sort(0, state.values.length - 1);
    state.operations.push(operation(
      "done", [], state, 12, allIndices(state.values), "Hoàn tất · mảng đã tăng dần",
    ));
    return state.operations;
  },
};
