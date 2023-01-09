/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyAll, compare, err, __DEV__ } from "./util.js";
import type { CleanUpFunc, Differ, Query, Source, Subscriber } from "./types.js";
import { scopes } from "./util.js";
import { configureBinding } from "./binding.js";
import { $$HyplateSubscribers } from "./internal.js";

let defaultDiffer: Differ = compare;
export const setDiffer = (differ: Differ | undefined | null) => {
  defaultDiffer = differ ?? compare;
};

export const enableBuiltinStore = () => {
  // @ts-expect-error type should be configured
  configureBinding(watch, isQuery);
};

const [enterScope, quitScope, currentScope] = /* #__PURE__ */ scopes<Set<Query<any>>>();

const useDepScope = (): [Set<Query<unknown>>, CleanUpFunc] => {
  const deps = new Set<Query<unknown>>();
  enterScope(deps);
  return [deps, quitScope];
};

export const source = <T extends unknown>(val: T, differ: Differ = defaultDiffer): Source<T> => {
  const subscribers = new Set<Subscriber<T>>();
  const src: Source<T> = {
    [$$HyplateSubscribers]: subscribers,
    get val() {
      currentScope()?.add(src);
      return val;
    },
    sub(subscriber) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    set(newVal) {
      if (differ(val, newVal)) {
        return;
      }
      val = newVal;
      dispatch(subscribers, newVal);
    },
  };
  return src;
};

export const isQuery = (obj: unknown): obj is Query<unknown> =>
  // @ts-expect-error unknown key access
  obj && !!obj[$$HyplateSubscribers];

export const watch = <T extends unknown>(query: Query<T>, subscriber: Subscriber<T>): CleanUpFunc => {
  const unsubscribe = query.sub(subscriber);
  subscriber(query.val);
  return unsubscribe;
};

const dispatch = <T extends unknown>(subscribers: Set<Subscriber<T>>, newVal: T) => {
  [...subscribers].forEach((sub) => {
    try {
      sub(newVal);
    } catch (error) {
      err(error);
    }
  });
};

export const query = <T extends unknown>(selector: () => T, differ: Differ = defaultDiffer): Query<T> => {
  const subscribers = new Set<Subscriber<T>>();
  const q: Query<T> = {
    [$$HyplateSubscribers]: subscribers,
    get val() {
      lazyEvaluate();
      return current!;
    },
    sub(subscriber) {
      subscribers.add(subscriber);
      return () => {
        subscribers.delete(subscriber);
        if (!subscribers.size) {
          applyAll(teardowns)();
        }
      };
    },
  };
  let dirty = true;
  let current: T | null = null;
  let teardowns: CleanUpFunc[] = [];
  const lazyEvaluate = () => {
    currentScope()?.add(q);
    if (!dirty) {
      return;
    }
    dirty = false;
    const [newDeps, cleanupDepScope] = useDepScope();
    current = selector();
    cleanupDepScope();
    applyAll(teardowns)();
    teardowns = [...newDeps].map((dep) => dep.sub(queryDispatch));
  };
  const queryDispatch = () => {
    dirty = true;
    const last = current;
    lazyEvaluate();
    if (differ(last, current)) {
      return;
    }
    dispatch(subscribers, current!);
  };
  return q;
};
