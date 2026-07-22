import type {
  ShortClipCodeLine,
  ShortClipOperation,
  ShortClipOperationType,
} from "../schema.js";

export type RawOperation = Omit<ShortClipOperation, "time_ms">;

export interface AlgorithmRuntime {
  title: string;
  subtitle: string;
  timeComplexity: string;
  spaceComplexity: string;
  codeLines: ShortClipCodeLine[];
  trace(initialValues: number[]): RawOperation[];
}

export interface TraceState {
  values: number[];
  order: number[];
  operations: RawOperation[];
}

export function createTraceState(initialValues: number[]): TraceState {
  return {
    values: [...initialValues],
    order: initialValues.map((_, index) => index),
    operations: [],
  };
}

export function operation(
  type: ShortClipOperationType,
  indices: number[],
  state: Pick<TraceState, "values" | "order">,
  activeLineNum: number,
  sortedIndices: number[],
  status: string,
): RawOperation {
  return {
    type,
    indices: [...indices],
    values: [...state.values],
    order: [...state.order],
    active_line_num: activeLineNum,
    sorted_indices: [...sortedIndices],
    status,
  };
}

export function allIndices(values: number[]): number[] {
  return values.map((_, index) => index);
}
