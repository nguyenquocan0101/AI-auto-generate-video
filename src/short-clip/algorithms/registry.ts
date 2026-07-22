import type { ShortClipAlgorithm } from "../schema.js";
import { bubbleSortRuntime } from "./bubble-sort.js";
import { cocktailSortRuntime } from "./cocktail-sort.js";
import { heapSortRuntime } from "./heap-sort.js";
import { insertionSortRuntime } from "./insertion-sort.js";
import { mergeSortRuntime } from "./merge-sort.js";
import { quickSortRuntime } from "./quick-sort.js";
import { selectionSortRuntime } from "./selection-sort.js";
import { shellSortRuntime } from "./shell-sort.js";
import type { AlgorithmRuntime } from "./types.js";

const ALGORITHM_REGISTRY: Record<ShortClipAlgorithm, AlgorithmRuntime> = {
  "bubble-sort": bubbleSortRuntime,
  "selection-sort": selectionSortRuntime,
  "insertion-sort": insertionSortRuntime,
  "quick-sort": quickSortRuntime,
  "merge-sort": mergeSortRuntime,
  "heap-sort": heapSortRuntime,
  "shell-sort": shellSortRuntime,
  "cocktail-sort": cocktailSortRuntime,
};

export function getAlgorithmRuntime(algorithm: ShortClipAlgorithm): AlgorithmRuntime {
  return ALGORITHM_REGISTRY[algorithm];
}
