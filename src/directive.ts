/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { arrayFrom, compare, err, isFunction, noop, warned, __DEV__, warn } from "./util.js";
import type {
  AttachFunc,
  CleanUpFunc,
  TruthyContextMountable,
  ForProps,
  Later,
  Mountable,
  Props,
  Rendered,
  Subscribable,
  FalsyContextMountable,
  JSXDirective,
  FunctionalEventHanlder,
  WritableSubscribable,
  ModelableElement,
  InputModelOptions,
  ModelOptions,
  BindingPattern,
  ShowProps,
  IfProps,
  FutureProps,
  FutureBuilder,
} from "./types.js";
import { _delegate, withCommentRange } from "./internal.js";
import { before, className, cssVar, moveRange, style } from "./core.js";
import { $class, $model, $style, $var, isSubscribable, isWritable, subscribe } from "./binding.js";
import { jsxRef, mount, setRef, unmount } from "./jsx-runtime.js";

const createIfDirective = <Test, T, F>(
  condition: Subscribable<Test>,
  _ref: Later<T | F> | undefined,
  trueResult: TruthyContextMountable<Test, T>,
  falseResult?: FalsyContextMountable<F>
): Mountable<Later<T | F>> => {
  return (attach) => {
    const ref = _ref ?? jsxRef<T | F>();
    const [begin, end, clearRange] = withCommentRange("if/show directive");
    attach(begin);
    attach(end);
    const attachContent: AttachFunc = before(end);
    let cleanUpLastAttached: CleanUpFunc | null = null;
    let current: T | F | null = null;
    const unsubscribe = subscribe(condition, (newValue) => {
      cleanUpLastAttached?.();
      clearRange();
      if (newValue) {
        [cleanUpLastAttached, current] = mount(trueResult(newValue), attachContent);
      } else if (falseResult) {
        [cleanUpLastAttached, current] = mount(falseResult(), attachContent);
      } else {
        cleanUpLastAttached = null;
        current = null;
      }
      setRef(ref, current);
    });
    return [
      () => {
        unsubscribe();
        cleanUpLastAttached?.();
      },
      ref,
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
export const If = <Test, T, F = void>(props: Props<IfProps<Test, T, F>, undefined, T | F>) => {
  return createIfDirective(props.condition, props.ref, props.then, props.else);
};

If.customRef = true;

/**
 * The `Show` directive for conditional rendering.
 *
 * Same underlying logic with the {@link If} directive but with different styles of API.
 */
export const Show = <Test, T, F = void>({
  when,
  ref,
  children,
  fallback,
}: Props<ShowProps<Test, F>, TruthyContextMountable<Test, T>, T | F>) => {
  return createIfDirective(when, ref, children, fallback);
};

Show.customRef = true;

export const Future = <R, T, F = void, E = void>({
  promise,
  ref: _ref,
  children,
  fallback,
  error,
}: Props<FutureProps<R, F, E>, FutureBuilder<R, T>, T | F>): Mountable<Later<T | F | E | null>> => {
  return (attach) => {
    const ref = _ref ?? jsxRef<T | F | E>();
    const [begin, end, clearRange] = withCommentRange("future directive");
    attach(begin);
    attach(end);
    const attachContent: AttachFunc = before(end);
    let cleanUpLastAttached: CleanUpFunc | null = null;
    let current: T | F | E | null = null;
    const handled = promise.then((result) => {
      if (fallback) {
        clearRange();
      }
      [cleanUpLastAttached, current] = mount(children(result), attachContent);
      setRef(ref, current);
    });
    if (fallback) {
      [cleanUpLastAttached, current] = mount(fallback, attachContent);
      setRef(ref, current);
    }
    if (error) {
      handled.catch((reason) => {
        [cleanUpLastAttached, current] = mount(error(reason), attachContent);
        setRef(ref, current);
      });
    }
    return [
      () => {
        cleanUpLastAttached?.();
      },
      ref,
      () => [begin, end],
    ];
  };
};

Future.customRef = true;

/**
 * @internal
 */
type HNode<T> = [item: T, rendered: Rendered<any> | undefined];
const unmountHNode = (node: HNode<any>) => {
  const rendered = node[1]!;
  unmount(rendered);
};
const initAsZero = () => 0;
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
}: Props<ForProps<T>, (item: T) => Mountable<any>>): Mountable<void> => {
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
          const anchor = newNodes[nextPos]?.[1]![2]()?.[0] ?? end;
          const attach = before(anchor);
          for (; i <= e2; i++) {
            const node = newNodes[i]!;
            node[1] = mount(children(node[0]), attach);
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
        const newIndexToOldIndexMap = arrayFrom({ length: toBePatched }, initAsZero);
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
            nextChild[1] = mount(children(nextChild[0]), attach);
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
        // Apply all the cleanup functions in the reversed order.
        for (let i = nodes.length - 1; i >= 0; i--) {
          nodes[i][1]![0]();
        }
        // Unsubscribe `of`.
        cleanup();
        // Remove all DOM nodes in the comment range.
        removeRange();
      },
      void 0,
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

export class EventDelegateDirective implements JSXDirective<FunctionalEventHanlder<Element, Event>> {
  prefix = "on";
  requireParams = true;
  apply = _delegate;
}

export class ClassBindingDirective implements JSXDirective<BindingPattern<boolean>> {
  prefix = "class";
  requireParams = true;
  apply(el: Element, params: string | null, input: BindingPattern<boolean>): void | CleanUpFunc {
    if (isSubscribable(input)) {
      return $class(el, params!, input);
    }
    className(el, params!, input);
  }
}

export class StyleBindingDirective implements JSXDirective<BindingPattern<string | null>> {
  prefix = "style";
  requireParams = true;
  apply(el: Element, params: string | null, input: BindingPattern<string | null>): void | CleanUpFunc {
    if (isSubscribable(input)) {
      // @ts-expect-error skipped element.style property check
      return $style(el, params!, input);
    }
    // @ts-expect-error skipped element.style property check
    style(el, params!, input);
  }
}

export class CSSVariableBindingDirective implements JSXDirective<BindingPattern<string | null>> {
  prefix = "var";
  requireParams = true;
  apply(el: Element, params: string | null, input: BindingPattern<string | null>): void | CleanUpFunc {
    if (isSubscribable(input)) {
      // @ts-expect-error skipped element.style property check
      return $var(el, params!, input);
    }
    // @ts-expect-error skipped element.style property check
    cssVar(el, params!, input);
  }
}

const isModelableElement = (el: Element): el is ModelableElement<unknown> => "value" in el;

export class ModelDirective implements JSXDirective<WritableSubscribable<any>> {
  prefix = "h-model";
  requireParams = false;
  apply(el: Element, params: string | null, input: WritableSubscribable<any>): void | CleanUpFunc {
    if (!isWritable(input)) {
      if (__DEV__) {
        err(`Value of "h-model" must be "WritableSubscribable".`);
      }
    } else if (isModelableElement(el)) {
      const modelOptions: (InputModelOptions<any> & Partial<ModelOptions>) | undefined = params
        ? { as: params }
        : void 0;
      return $model(el, input, modelOptions);
    } else {
      if (__DEV__) {
        warn(`Element <${el.tagName}> does not have "value" property, "h-model" directive may not work correctly.`);
      }
    }
  }
}
