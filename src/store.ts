/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { compare, err, __DEV__ } from "./util.js";
import type { CleanUpFunc, Differ, Query, Source, Subscriber } from "./types.js";
import { once, scopes } from "./util.js";

let defaultDiffer: Differ = compare;
export const setDiffer = (differ: Differ | undefined | null) => {
  defaultDiffer = differ ?? compare;
};

const [enterScope, quitScope, currentScope] = scopes<(src: Query<unknown>) => void>();

const useDepScope = (): [Set<Query<unknown>>, CleanUpFunc] => {
  const deps = new Set<Query<unknown>>();
  enterScope((src) => {
    deps.add(src);
  });
  return [
    deps,
    () => {
      quitScope();
    },
  ];
};

export const source = <T extends unknown>(val: T, differ: Differ = defaultDiffer): Source<T> => {
  const src: Source<T> = {
    get val() {
      currentScope()?.(src);
      return val;
    },
    set(newVal) {
      if (differ(val, newVal)) {
        return;
      }
      val = newVal;
      dispatch(src, newVal);
    },
  };
  subscriptions.set(src, new Set());
  return src;
};

const subscriptions = new WeakMap<Query<unknown>, Set<Subscriber<any>>>();
if (__DEV__) {
  Object.assign(globalThis, { __SUBSCRIPTIONS__: subscriptions });
}
/**
 * @internal
 */
export const isReactive = (obj: object): obj is Query<unknown> =>
  // @ts-expect-error contravariance
  subscriptions.has(obj);

export const subscribe = <T extends unknown>(query: Query<T>, subscriber: Subscriber<T>): CleanUpFunc => {
  subscriptions.get(query)!.add(subscriber);
  subscriber(query.val);
  return once(() => {
    subscriptions.get(query)!.delete(subscriber);
  });
};

export const dispatch = <T extends unknown>(src: Query<unknown>, newVal: T) => {
  [...subscriptions.get(src)!].forEach((sub) => {
    try {
      sub(newVal);
    } catch (error) {
      err(error);
    }
  });
};

export const query = <T extends unknown>(selector: () => T, differ: Differ = defaultDiffer): Query<T> => {
  const q: Query<T> = {
    get val() {
      lazyEvaluate();
      return current!;
    },
  };
  let dirty = true;
  let current: T | null = null;
  let teardowns: CleanUpFunc[] = [];
  const lazyEvaluate = () => {
    currentScope()?.(q);
    if (!dirty) {
      return;
    }
    dirty = false;
    const [newDeps, cleanupDepScope] = useDepScope();
    current = selector();
    cleanupDepScope();
    for (const unsubscribe of teardowns) {
      unsubscribe();
    }
    teardowns = [...newDeps].map((dep) => {
      const subscribers = subscriptions.get(dep)!;
      subscribers.add(queryDispatch);
      return () => {
        subscribers.delete(queryDispatch);
      };
    });
  };
  const queryDispatch = () => {
    dirty = true;
    const last = current;
    lazyEvaluate();
    if (differ(last, current)) {
      return;
    }
    dispatch(q, current!);
  };
  subscriptions.set(q, new Set());
  return q;
};
