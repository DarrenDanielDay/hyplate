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

class SourceImpl<T extends unknown> implements Source<T> {
  [$$HyplateSubscribers] = new Set<Subscriber<T>>();
  constructor(private _val: T, private _differ: Differ) {}
  get val() {
    currentScope()?.add(this);
    return this._val;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    this[$$HyplateSubscribers].add(subscriber);
    return () => {
      this[$$HyplateSubscribers].delete(subscriber);
    };
  }
  set(newVal: T): void {
    if (this._differ(this._val, newVal)) {
      return;
    }
    this._val = newVal;
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
  _dirty = true;
  _current: T | null = null;
  _teardowns: CleanUpFunc[] = [];
  [$$HyplateSubscribers] = new Set<Subscriber<T>>();
  constructor(private readonly _selector: () => T, private _differ: Differ) {}
  get val() {
    this.#lazyEvaluate();
    return this._current!;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    const subscribers = this[$$HyplateSubscribers];
    subscribers.add(subscriber);
    return () => {
      subscribers.delete(subscriber);
      if (!subscribers.size) {
        applyAll(this._teardowns)();
      }
    };
  }
  #lazyEvaluate() {
    currentScope()?.add(this);
    if (!this._dirty) {
      return;
    }
    this._dirty = false;
    const [newDeps, cleanupDepScope] = useDepScope();
    this._current = this._selector();
    cleanupDepScope();
    applyAll(this._teardowns)();
    this._teardowns = [...newDeps].map((dep) => dep.sub(this.#dispatch));
  }
  #dispatch = () => {
    this._dirty = true;
    const last = this._current;
    this.#lazyEvaluate();
    if (this._differ(last, this._current)) {
      return;
    }
    dispatch(this[$$HyplateSubscribers], this._current!);
  };
}

export const query = <T extends unknown>(selector: () => T, differ: Differ = defaultDiffer): Query<T> => {
  return new QueryImpl(selector, differ);
};
