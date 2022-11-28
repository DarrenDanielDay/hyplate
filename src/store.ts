/**
 * @license MIT
 * MIT License
 *
 * Copyright (c) 2022 DarrenDanielDay
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

import { err, __DEV__ } from "./internal.js";
import type { CleanUpFunc, Differ, Query, Source, Subscriber } from "./types.js";
import { once, scopes } from "./util.js";

let defaultDiffer = Object.is;
export const setDiffer = (differ: Differ) => {
  defaultDiffer = differ;
};

const [enterScope, quitScope, currentScope] = scopes<Subscriber<Source<unknown>>>();

const useDepScope = (): [Set<Source<unknown>>, CleanUpFunc] => {
  const deps = new Set<Source<unknown>>();
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

const subscriptions = new WeakMap<Query<any>, Set<Subscriber<any>>>();
if (__DEV__) {
  Object.assign(globalThis, { __SUBSCRIPTIONS__: subscriptions });
}
export const subscribe = <T extends unknown>(query: Query<T>, subscriber: Subscriber<T>): CleanUpFunc => {
  const underlyingSubscriber = () => {
    const [newDeps, cleanup] = useDepScope();
    const newVal = query.val;
    cleanup();
    for (const dep of deps) {
      subscriptions.get(dep)!.delete(underlyingSubscriber);
    }
    deps = newDeps;
    for (const dep of deps) {
      subscriptions.get(dep)!.add(underlyingSubscriber);
    }
    subscriber(newVal);
  };
  let deps = new Set<Query<any>>();
  underlyingSubscriber();
  return once(() => {
    for (const dep of deps) {
      subscriptions.get(dep)!.delete(underlyingSubscriber);
    }
  });
};

export const dispatch = <T extends unknown>(src: Query<any>, newVal: T) => {
  [...subscriptions.get(src)!].forEach((sub) => {
    try {
      sub(newVal);
    } catch (error) {
      err(err);
    }
  });
};

export const query = <T extends unknown>(selector: () => T): Query<T> => {
  const q: Query<T> = {
    get val() {
      return selector();
    },
  };
  subscriptions.set(q, new Set());
  return q;
};
