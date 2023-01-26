/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { $attr, $content, $text } from "./binding.js";
import { appendChild } from "./core.js";
import { useCleanUpCollector } from "./hooks.js";
import { _delegate, _listen } from "./internal.js";
import type { Component } from "./jsx-runtime.js";
import type {
  AttachFunc,
  AttributesMap,
  BindingHost,
  BindingPattern,
  ClassComponentStatic,
  Differ,
  Events,
  EventType,
  FunctionalEventHanlder,
  Handler,
  Subscribable,
  TextInterpolation,
} from "./types.js";
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

class BindingHostImpl<T extends Element> implements BindingHost<T> {
  #el: T;
  #collect = useCleanUpCollector();
  #attach: AttachFunc;
  constructor(el: T) {
    this.#el = el;
    this.#attach = appendChild(el);
  }
  attr<P extends keyof AttributesMap<T>>(name: P, subscribable: Subscribable<AttributesMap<T>[P]>): BindingHost<T> {
    this.#collect($attr(this.#el, name, subscribable));
    return this;
  }
  content(subscribable: Subscribable<TextInterpolation>): BindingHost<T> {
    this.#collect($content(this.#el, subscribable));
    return this;
  }
  delegate<E extends Events<T>>(name: E, handler: FunctionalEventHanlder<T, EventType<T, E>>): BindingHost<T> {
    this.#collect(_delegate(this.#el, name, handler));
    return this;
  }
  event<E extends Events<T>>(
    name: E,
    handler: Handler<T, EventType<T, E>>,
    options?: boolean | EventListenerOptions
  ): BindingHost<T> {
    this.#collect(_listen(this.#el, name, handler, options));
    return this;
  }
  text(fragments: TemplateStringsArray, ...bindings: BindingPattern<TextInterpolation>[]): BindingHost<T> {
    this.#collect($text(fragments, ...bindings)(this.#attach));
    return this;
  }
}

export const useBinding = <T extends Element>(el: T): BindingHost<T> => {
  return new BindingHostImpl(el);
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
