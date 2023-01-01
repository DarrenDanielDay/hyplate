/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { bindAttr, bindText, interpolation } from "./binding.js";
import { appendChild, listen } from "./core.js";
import { useCleanUpCollector } from "./hooks.js";
import type { AttributesMap, Differ, Events, Handler, Subscribable, TextInterpolation } from "./types.js";
import { isObject } from "./util.js";

export const alwaysDifferent: Differ = () => false;

export const deepDiffer: Differ = (a, b) => {
  if (!isObject(a) || !isObject(b)) {
    // Compare identity for cases of functions & primitives.
    return Object.is(a, b);
  }
  const aKeys = Reflect.ownKeys(a);
  const bKeys = new Set(Reflect.ownKeys(b));
  if (aKeys.length !== bKeys.size) {
    return false;
  }
  return aKeys.every((key) => bKeys.has(key) && deepDiffer(Reflect.get(a, key), Reflect.get(b, key)));
};

export const useBind = <T extends Element>(el: T) => {
  const registerCleanUp = useCleanUpCollector();
  const eventHost = listen(el);
  const bindings = {
    attr: <P extends keyof AttributesMap<T>>(name: P, subscribable: Subscribable<AttributesMap<T>[P]>) => {
      registerCleanUp(bindAttr(el, name, subscribable));
      return bindings;
    },
    content: (
      fragments: TemplateStringsArray,
      ...bindings: (TextInterpolation | Subscribable<TextInterpolation>)[]
    ) => {
      registerCleanUp(interpolation(fragments, ...bindings)(appendChild(el)));
      return bindings;
    },
    event: <E extends Events<T>>(name: E, handler: Handler<T, E>, options?: boolean | EventListenerOptions) => {
      registerCleanUp(eventHost(name, handler, options));
      return bindings;
    },
    text: (subscribable: Subscribable<TextInterpolation>) => {
      registerCleanUp(bindText(el, subscribable));
      return bindings;
    },
  };
  return bindings;
};
