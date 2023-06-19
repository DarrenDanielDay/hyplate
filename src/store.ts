/**
 * @license hyplate
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

class SourceImpl<T extends unknown> implements Source<T> {
  [$$HyplateSubscribers] = new Set<Subscriber<T>>();
  #val: T;
  #differ: Differ;
  constructor(val: T, differ: Differ) {
    this.#val = val;
    this.#differ = differ;
  }
  get val() {
    currentScope()?.add(this);
    return this.#val;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    this[$$HyplateSubscribers].add(subscriber);
    return () => {
      this[$$HyplateSubscribers].delete(subscriber);
    };
  }
  set(newVal: T): void {
    if (this.#differ(this.#val, newVal)) {
      return;
    }
    this.#val = newVal;
    dispatch(this[$$HyplateSubscribers], newVal);
  }
}

export const source = <T extends unknown>(val: T, differ: Differ = defaultDiffer): Source<T> => {
  return new SourceImpl(val, differ);
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

class QueryImpl<T extends unknown> implements Query<T> {
  #dirty = true;
  #current: T | null = null;
  #teardowns: CleanUpFunc[] = [];
  #selector: () => T;
  #differ: Differ;
  [$$HyplateSubscribers] = new Set<Subscriber<T>>();
  constructor(selector: () => T, differ: Differ) {
    this.#selector = selector;
    this.#differ = differ;
  }
  get val() {
    this.#lazyEvaluate();
    return this.#current!;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    const subscribers = this[$$HyplateSubscribers];
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
      if (!subscribers.size) {
        applyAll(this.#teardowns);
      }
    };
  }
  #lazyEvaluate() {
    currentScope()?.add(this);
    if (!this.#dirty) {
      return;
    }
    this.#dirty = false;
    const [newDeps, cleanupDepScope] = useDepScope();
    this.#current = this.#selector();
    cleanupDepScope();
    applyAll(this.#teardowns);
    this.#teardowns = [...newDeps].map((dep) => dep.sub(this.#dispatch));
  }
  #dispatch = () => {
    this.#dirty = true;
    const last = this.#current;
    this.#lazyEvaluate();
    if (this.#differ(last, this.#current)) {
      return;
    }
    dispatch(this[$$HyplateSubscribers], this.#current!);
  };
}

export const query = <T extends unknown>(selector: () => T, differ: Differ = defaultDiffer): Query<T> => {
  return new QueryImpl(selector, differ);
};
