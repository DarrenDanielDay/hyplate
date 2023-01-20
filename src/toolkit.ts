/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { $attr, $content, $text } from "./binding.js";
import { appendChild, delegate, listen } from "./core.js";
import { useCleanUpCollector } from "./hooks.js";
import type { Component } from "./jsx-runtime.js";
import type { BindingHost, ClassComponentStatic, Differ } from "./types.js";
import { defineProp, isObject, patch, strictEqual } from "./util.js";

export const alwaysDifferent: Differ = () => false;

export const deepDiffer: Differ = (a, b) => {
  if (!isObject(a) || !isObject(b)) {
    // Compare identity for cases of functions & primitives.
    return strictEqual(a, b);
  }
  const aKeys = Reflect.ownKeys(a);
  const bKeys = new Set(Reflect.ownKeys(b));
  if (aKeys.length !== bKeys.size) {
    return false;
  }
  return aKeys.every((key) => bKeys.has(key) && deepDiffer(Reflect.get(a, key), Reflect.get(b, key)));
};

export const useBinding = <T extends Element>(el: T): BindingHost<T> => {
  const registerCleanUp = useCleanUpCollector();
  const eventHost = listen(el);
  const delegateHost = delegate(el);
  const bindings: BindingHost<T> = {
    attr: (name, subscribable) => {
      registerCleanUp($attr(el, name, subscribable));
      return bindings;
    },
    content: (subscribable) => {
      registerCleanUp($content(el, subscribable));
      return bindings;
    },
    delegate: (name, handler) => {
      registerCleanUp(delegateHost(name, handler));
      return bindings;
    },
    event: (name, handler, options?) => {
      registerCleanUp(eventHost(name, handler, options));
      return bindings;
    },
    text: (fragments, ...bindingPatterns) => {
      registerCleanUp($text(fragments, ...bindingPatterns)(appendChild(el)));
      return bindings;
    },
  };
  return bindings;
};

export const component = (options: ClassComponentStatic) => (ctor: typeof Component<any, any>) => {
  const { tag, observedAttributes, ...statics } = options;
  if (observedAttributes) {
    defineProp(ctor, "observedAttributes", { get: () => observedAttributes });
  }
  patch(ctor, statics);
  // @ts-expect-error assign to readonly field
  ctor.tag = ctor.defineAs(tag);
};
