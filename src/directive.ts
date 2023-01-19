/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { compare, err, isFunction, noop, warned, __DEV__ } from "./util.js";
import type {
  AttachFunc,
  CleanUpFunc,
  ConditionalMountable,
  ExposeBase,
  ForProps,
  Mountable,
  Props,
  Rendered,
  Subscribable,
} from "./types.js";
import { withCommentRange } from "./internal.js";
import { before, moveRange } from "./core.js";
import { subscribe } from "./binding.js";
import { unmount } from "./jsx-runtime.js";

const createIfDirective = <Test, T extends ExposeBase, F extends ExposeBase = void>(
  condition: Subscribable<Test>,
  trueResult: ConditionalMountable<Test, T>,
  falseResult?: Mountable<F>
): Mountable<void> => {
  return (attach) => {
    const [begin, end, clearRange] = withCommentRange("if/show directive");
    attach(begin);
    attach(end);
    const attachContent: AttachFunc = before(end);
    let lastAttached: CleanUpFunc | null = null;
    const unsubscribe = subscribe(condition, (newValue) => {
      const shouldReRender = !!newValue;
      lastAttached?.();
      clearRange();
      if (shouldReRender) {
        // @ts-expect-error truty check
        [lastAttached] = trueResult(attachContent, newValue);
      } else {
        [lastAttached] = falseResult?.(attachContent) ?? [null, void 0];
      }
    });
    return [
      () => {
        unsubscribe();
        lastAttached?.();
      },
      void 0,
      () => [begin, end],
    ];
  };
};
const nilRendered: Rendered<void> = [noop, void 0, noop];
/**
 * Use `nil` for render nothing.
 */
export const nil: Mountable<void> = () => nilRendered;

/**
 * The `If` directive for conditional rendering.
 */
export const If = <Test, T extends ExposeBase, F extends ExposeBase = void>({
  condition,
  children,
}: Props<{ condition: Subscribable<Test> }, { then: ConditionalMountable<Test, T>; else?: Mountable<F> }, void>) => {
  if (!children) {
    return warned("Invalid usage of 'If'. Must provide children.", nil);
  }
  return createIfDirective(condition, children.then, children.else);
};

/**
 * The `Show` directive for conditional rendering.
 *
 * Same underlying logic with the {@link If} directive but with different styles of API.
 */
export const Show = <Test, T extends ExposeBase, F extends ExposeBase = void>({
  when,
  children,
  fallback,
}: Props<{ when: Subscribable<Test>; fallback?: Mountable<F> }, ConditionalMountable<Test, T>, void>) => {
  if (!children) {
    return warned("Invalid usage of 'Show'. Must provide children.", nil);
  }
  return createIfDirective(when, children, fallback);
};
/**
 * @internal
 */
type HNode<T> = [item: T, rendered: Rendered<any> | undefined];
const unmountHNode = (node: HNode<any>) => {
  const rendered = node[1]!;
  unmount(rendered);
};
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
}: Props<ForProps<T>, (item: T) => JSX.Element>): Mountable<void> => {
  if (__DEV__) {
    if (!isFunction(children)) {
      err("Invalid `children` of `For` directive. Expected to be a function.");
    }
  }
  return (attach): Rendered<void> => {
    let nodes: HNode<T>[] = [];
    const [begin, end, removeRange] = withCommentRange("for directive");
    attach(begin);
    attach(end);
    const cleanup = subscribe(of, (newOf) => {
      const newNodes: HNode<T>[] = [];
      for (let i = 0, l = newOf.length; i < l; i++) {
        newNodes.push([newOf[i], void 0]);
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
          const attach = before(anchor);
          for (; i <= e2; i++) {
            const node = newNodes[i]!;
            node[1] = children(node[0])(attach);
          }
        }
      } else if (i > e2) {
        for (; i <= e1; i++) {
          unmountHNode(nodes[i]);
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
              ? warned(
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
            unmountHNode(prevChild);
            continue;
          }
          const newIndex = mapItemToNewIndex.get(prevChild[0]);
          if (newIndex == null) {
            unmountHNode(prevChild);
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
          const attach = before(anchor);
          if (newIndexToOldIndexMap[i] === 0) {
            nextChild[1] = children(nextChild[0])(attach);
          } else if (moved) {
            if (j < 0 || i !== increasingNewIndexSequence[j]!) {
              const range = nextChild[1]![2]();
              if (range) {
                moveRange(range[0], range[1], attach);
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
      },
      undefined,
      () => [begin, end],
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
