/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyAll, compare, __DEV__, isInstance } from "./util.js";
import type { CleanUpFunc, Differ, ObjectEventHandler, Query, Source, Subscriber } from "./types.js";
import { scopes } from "./util.js";
import { configureBinding } from "./binding.js";
import { $$HyplateQuery, _listen } from "./internal.js";

let defaultDiffer: Differ = compare;
export const setDiffer = (differ: Differ | undefined | null) => {
  defaultDiffer = differ ?? compare;
};

export const enableBuiltinStore = () => {
  configureBinding(watch, isQuery);
};

const [enterScope, quitScope, currentScope] = /* #__PURE__ */ scopes<Set<Query<any>>>();

const useDepScope = (): [Set<Query<unknown>>, CleanUpFunc] => {
  const deps = new Set<Query<unknown>>();
  enterScope(deps);
  return [deps, quitScope];
};

export class SourceImpl<T extends unknown> extends EventTarget implements Source<T> {
  [$$HyplateQuery] = true;
  #val: T;
  #differ: Differ;
  constructor(val: T, differ: Differ) {
    super();
    this.#val = val;
    this.#differ = differ;
  }
  get val() {
    currentScope()?.add(this);
    return this.#val;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    return _listen(this, STORE_CHANGE_EVENT, subscription(subscriber));
  }
  set(newVal: T): void {
    if (this.#differ(this.#val, newVal)) {
      return;
    }
    this.#val = newVal;
    dispatch(this, newVal);
  }
}

export const source = <T extends unknown>(val: T, differ: Differ = defaultDiffer): Source<T> => {
  return new SourceImpl(val, differ);
};

export const isQuery = (obj: unknown): obj is Query<unknown> =>
  // @ts-expect-error unknown key access
  !!obj?.[$$HyplateQuery];

export const watch = <T extends unknown>(query: Query<T>, subscriber: Subscriber<T>): CleanUpFunc => {
  const unsubscribe = query.sub(subscriber);
  subscriber(query.val);
  return unsubscribe;
};

export const STORE_CHANGE_EVENT = "hyplate-store-data";

const CE = CustomEvent;

const dispatch = <T extends unknown>(target: EventTarget, newVal: T) => {
  target.dispatchEvent(
    new CE(STORE_CHANGE_EVENT, {
      detail: newVal,
    })
  );
};

const isStoreChangeEvent = isInstance(CE);

/**
 * Use class instead of extra to save memory.
 */
class Subscription<T> implements ObjectEventHandler<Event> {
  #subscriber: Subscriber<T>;
  constructor(subscriber: Subscriber<T>) {
    this.#subscriber = subscriber;
  }
  handleEvent(event: Event): void {
    if (isStoreChangeEvent(event)) {
      // @ts-expect-error skip generic type check
      (0, this.#subscriber)(event.detail);
    }
  }
}

const subscription = <T>(subscriber: Subscriber<T>): ObjectEventHandler<CustomEvent<T>> =>
  new Subscription(subscriber);

export class QueryImpl<T extends unknown> extends EventTarget implements Query<T> {
  #dirty = true;
  #current: T | null = null;
  #teardowns: CleanUpFunc[] = [];
  #selector: () => T;
  #differ: Differ;
  #count = 0;
  [$$HyplateQuery] = true;
  constructor(selector: () => T, differ: Differ) {
    super();
    this.#selector = selector;
    this.#differ = differ;
  }
  get val() {
    this.#lazyEvaluate();
    return this.#current!;
  }
  sub(subscriber: Subscriber<T>): CleanUpFunc {
    this.#count++;
    const unsubscribe = _listen(this, STORE_CHANGE_EVENT, subscription(subscriber));
    return () => {
      unsubscribe();
      this.#count--;
      if (!this.#count) {
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
    dispatch(this, this.#current!);
  };
}

export const query = <T extends unknown>(selector: () => T, differ: Differ = defaultDiffer): Query<T> => {
  return new QueryImpl(selector, differ);
};
