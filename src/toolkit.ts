/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { bindAttr, bindText, interpolation } from "./binding.js";
import { appendChild } from "./core.js";
import { useCleanUpCollector } from "./hooks.js";
import type { AttributesMap, Differ, Subscribable, TextInterpolation } from "./types.js";
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

export const useBind = <E extends Element>(el: E) => {
  const registerCleanUp = useCleanUpCollector();
  return {
    text: (subscribable: Subscribable<TextInterpolation>) => registerCleanUp(bindText(el, subscribable)),
    attr: <P extends keyof AttributesMap<E>>(name: P, subscribable: Subscribable<AttributesMap<E>[P]>) =>
      registerCleanUp(bindAttr(el, name, subscribable)),
    content: (fragments: TemplateStringsArray, ...bindings: (TextInterpolation | Subscribable<TextInterpolation>)[]) =>
      registerCleanUp(interpolation(fragments, ...bindings)(appendChild(el))),
  };
};
