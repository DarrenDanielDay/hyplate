import { compare, err, isFunction, warn, __DEV__ } from "./util.js";
import { subscribe } from "./store.js";
import type { AttachFunc, CleanUpFunc, FunctionalComponent, Mountable, Props, Query, Rendered } from "./types.js";
import { noop } from "./util.js";
import { withCommentRange } from "./internal.js";
import { before, moveRange } from "./core.js";

const createIfDirective = (
  condition: Query<boolean>,
  trueResult: Mountable<any>,
  falseResult?: Mountable<any>
): Mountable<void> => {
  return (attach) => {
    const [clearCommentRange, [begin, end, clear], getRange] = withCommentRange("if/show directive");
    attach(begin);
    attach(end);
    const attachContent: AttachFunc = (node) => before(end)(node);
    let firstRendered = false;
    let lastValue = condition.val;
    let lastAttached: CleanUpFunc | null = null;
    const unsubscribe = subscribe(condition, (show) => {
      const newValue = !!show;
      if (firstRendered && lastValue === newValue) {
        return;
      }
      if (!firstRendered) {
        firstRendered = true;
      }
      lastValue = newValue;
      lastAttached?.();
      clear();
      if (newValue) {
        [lastAttached] = trueResult(attachContent);
      } else {
        [lastAttached] = falseResult?.(attachContent) ?? [null];
      }
    });
    return [
      () => {
        unsubscribe();
        lastAttached?.();
        clearCommentRange();
      },
      undefined,
      getRange,
    ];
  };
};
const nilRendered: Rendered<void> = [noop, void 0, noop];
const nil: Mountable<void> = () => nilRendered;

/**
 * The `If` directive for conditional rendering.
 */
export const If: FunctionalComponent<
  { condition: Query<boolean> },
  { then: Mountable<any>; else?: Mountable<any> }
> = ({ condition, children }) => {
  if (!children) {
    return warn("Invalid usage of 'If'. Must provide children.", nil);
  }
  return createIfDirective(condition, children.then, children.else);
};

/**
 * The `Show` directive for conditional rendering.
 *
 * Same underlying logic with the {@link If} directive but with different styles of API.
 */
export const Show: FunctionalComponent<{ when: Query<boolean>; fallback?: Mountable<any> }, Mountable<any>> = ({
  when,
  children,
  fallback,
}) => {
  if (!children) {
    return warn("Invalid usage of 'Show'. Must provide children.", nil);
  }
  return createIfDirective(when, children, fallback);
};
interface ForProps<T extends unknown> {
  /**
   * The iterable query.
   */
  of: Query<Iterable<T>>;
}

/**
 * The `for` directive for list rendering.
 *
 * The `children` must be a render function.
 *
 * `Vue.JS` reference: {@link https://github.com/vuejs/core/blob/main/packages/runtime-core/src/renderer.ts#L1747}
 */
export const For = <T extends unknown>({
  of,
  children,
}: Props<ForProps<T>, (item: T, index: number) => JSX.Element>): Mountable<void> => {
  if (__DEV__) {
    if (!isFunction(children)) {
      err("Invalid `children` of `For` directive. Expected to be a function.");
    }
  }
  return (attach): Rendered<void> => {
    type HNode = [item: T, rendered: Rendered<any> | undefined];
    let nodes: HNode[] = [];
    const [unmount, [begin, end, removeRange], move] = withCommentRange("for directive");
    attach(begin);
    attach(end);
    const cleanup = subscribe(of, (newOf) => {
      const newNodes: HNode[] = [];
      for (const item of newOf) {
        newNodes.push([item, void 0]);
      }
      let i = 0;
      const l2 = newNodes.length;
      let e1 = nodes.length - 1;
      let e2 = l2 - 1;
      for (i = 0; i <= e1 && i <= e2; i++) {
        const n1 = nodes[i];
        const n2 = newNodes[i];
        if (compare(n1[0], n2[0])) {
          n2[1] = n1[1];
        } else {
          break;
        }
      }
      for (; i <= e1 && i <= e2; e1--, e2--) {
        const n1 = nodes[e1];
        const n2 = newNodes[e2];
        if (compare(n1[0], n2[0])) {
          n2[1] = n1[1];
        } else {
          break;
        }
      }
      if (i > e1) {
        if (i <= e2) {
          const nextPos = e2 + 1;
          const anchor = newNodes[nextPos]?.[1]?.[2]()?.[1] ?? end;
          for (; i <= e2; i++) {
            // @ts-expect-error skip before check
            const attach = before(anchor);
            const node = newNodes[i]!;
            node[1] = children(node[0], i)(attach);
          }
        }
      } else if (i > e2) {
        for (; i <= e1; i++) {
          nodes[i][1]![0]();
        }
      } else {
        const s1 = i;
        const s2 = i;
        const mapItemToNewIndex = new Map<T, number>();
        for (i = s1; i <= e2; i++) {
          const node = newNodes[i]!;
          const key = node[0];
          mapItemToNewIndex.set(
            __DEV__ && mapItemToNewIndex.has(key)
              ? warn(
                  `Duplicated item found: ${key}. It's always an error in hyplate,\
 since hyplate use the item itself as list key.`,
                  key
                )
              : key,
            i
          );
        }
        let j: number;
        let patched = 0;
        const toBePatched = e2 - s2 + 1;
        let moved = false;
        let maxNewIndexSoFar = 0;
        const newIndexToOldIndexMap = Array.from({ length: toBePatched }, () => 0);
        for (i = s1; i <= e1; i++) {
          const prevChild = nodes[i]!;
          if (patched >= toBePatched) {
            prevChild[1]![0]();
            continue;
          }
          const newIndex = mapItemToNewIndex.get(prevChild[0]);
          if (newIndex == null) {
            prevChild[1]![0]();
          } else {
            newIndexToOldIndexMap[newIndex - s2] = i + 1;
            if (newIndex >= maxNewIndexSoFar) {
              maxNewIndexSoFar = newIndex;
            } else {
              moved = true;
            }
            newNodes[newIndex][1] = prevChild[1];
            patched++;
          }
        }
        const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
        j = increasingNewIndexSequence.length - 1;
        for (i = toBePatched - 1; i >= 0; i--) {
          const nextIndex = s2 + i;
          const nextChild = newNodes[nextIndex]!;
          const anchor = newNodes[nextIndex + 1]?.[1]![2]()?.[0] ?? end;
          // @ts-expect-error skip before check
          const attach = before(anchor);
          if (newIndexToOldIndexMap[i] === 0) {
            nextChild[1] = children(nextChild[0], nextIndex)(attach);
          } else if (moved) {
            if (j < 0 || i !== increasingNewIndexSequence[j]!) {
              const range = nextChild[1]![2]();
              if (range) {
                moveRange(...range)(attach);
              }
            } else {
              j--;
            }
          }
        }
      }
      nodes = newNodes;
    });
    return [
      () => {
        cleanup();
        removeRange();
        unmount();
      },
      undefined,
      move,
    ];
  };
};

// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
const getSequence = (arr: number[]): number[] => {
  const p = [...arr];
  const result = [0];
  let i: number, j: number, u: number, v: number, c: number;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = (u + v) >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p[v];
  }
  return result;
};
