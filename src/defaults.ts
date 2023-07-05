/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// import type {} from "typed-query-selector";
import { EventDelegateDirective, ModelDirective } from "./directive.js";
import { HyplateElement } from "./elements.js";
import { useEffect } from "./hooks.js";
import { $$HyplateElementMeta, currentComponentCtx } from "./internal.js";
import { registerDirective } from "./jsx-runtime.js";
import { enableBuiltinSignals, computed, signal, effect } from "./signals.js";
import type {
  AttributeDecorator,
  AttributeKeys,
  ClassComponentInstance,
  Effect,
  FieldInitializer,
  PropsOf,
  Signal,
} from "./types.js";
enableBuiltinSignals();
registerDirective(new EventDelegateDirective());
registerDirective(new ModelDirective());
declare module "./types.js" {
  export interface Subscribable<T> extends Signal<T> {}
  export interface WritableSubscribable<T> extends WritableSignal<T> {}
  export interface ClassComponentInstance<P extends PropsBase = PropsBase, S extends string = string>
    extends OnConnected,
      OnDisconnected,
      OnAttributeChanged {
    /**
     * @internal
     */
    [$$HyplateElementMeta]?: ComponentInstanceMeta;
    /**
     * Short for `this.effect(() => effect(callback))`.
     */
    autorun(callback: () => void): void;
  }
  /**
   * @internal
   */
  interface ComponentInstanceMeta {
    attributes?: Record<PropertyKey, WritableSignal<string | null>>;
  }
  export type AttributeKeys<T> = Extract<keyof PropsOf<T>, string>;
  export type FieldInitializer<T, R> = (this: T, value: R) => R;

  export type AttributeDecorator<T, R> = {
    /**
     * Overload for accessors.
     */
    (
      target: ClassAccessorDecoratorTarget<T, Subscribable<R | null>>,
      context: ClassAccessorDecoratorContext<T, Subscribable<R | null>>
    ): ClassAccessorDecoratorResult<T, Subscribable<R | null>>;
    /**
     * Overload for class field.
     */
    (target: undefined, context: ClassFieldDecoratorContext<T, Subscribable<R | null>>): FieldInitializer<
      T,
      Subscribable<R | null>
    >;
  };
}

const ComponentPrototype = HyplateElement.prototype as ClassComponentInstance;

ComponentPrototype.connectedCallback = function () {
  this.mount();
};

ComponentPrototype.disconnectedCallback = function () {
  this.unmount();
};

ComponentPrototype.attributeChangedCallback = function (name, _oldValue, newValue) {
  this[$$HyplateElementMeta]?.attributes?.[name].set(newValue);
};

ComponentPrototype.autorun = function (callback) {
  this.effect(() => effect(callback));
};

export const useAutoRun = (callback: Effect) => useEffect(() => effect(callback));

export const Attribute: {
  <T, K extends AttributeKeys<T>>(name: K, transform: (value: string) => PropsOf<T>[K]): AttributeDecorator<
    T,
    PropsOf<T>[K]
  >;
  <T, K extends AttributeKeys<T>>(name: K): AttributeDecorator<T, Extract<PropsOf<T>[K], string>>;
  <T>(name: string): AttributeDecorator<T, string>;
} =
  (name: string, transform?: (value: string) => any) =>
  (
    _target: ClassAccessorDecoratorTarget<any, any> | undefined,
    context: ClassAccessorDecoratorContext<any, any> | ClassFieldDecoratorContext
  ): ClassAccessorDecoratorResult<ClassComponentInstance<any, any>, Signal<any>> &
    FieldInitializer<any, Signal<any>> => {
    const currentMeta = currentComponentCtx()!;
    const attributes = (currentMeta.attributes ??= new Set());
    attributes.add(name);
    function init(this: ClassComponentInstance<any, any>, _value: any) {
      const meta = (this[$$HyplateElementMeta] ??= {});
      const attributes = (meta.attributes ??= {});
      const src = (attributes[name] ??= signal<string | null>(this.getAttribute(name)));
      if (transform) {
        return computed(() => {
          const value = src();
          return value == null ? null : transform(value);
        });
      }
      return src;
    }
    // @ts-expect-error conditional type
    return context.kind === "field"
      ? init
      : {
          init,
          set(_value) {
            throw new Error(`Cannot set binded attribute. It's read-only.`);
          },
        };
  };
