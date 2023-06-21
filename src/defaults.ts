// import type {} from "typed-query-selector";
import { Component } from "./elements.js";
import { $$HyplateComponentMeta, currentComponentCtx } from "./internal.js";
import { enableBuiltinSignals, computed, signal } from "./signals.js";
import type { AttributeDecorator, AttributeKeys, ClassComponentInstance, PropsOf } from "./types.js";
enableBuiltinSignals();
declare module "./types.js" {
  export interface Subscribable<T> extends Signal<T> {}
  export interface ClassComponentInstance<P extends PropsBase = PropsBase, S extends string = string>
    extends OnConnected,
      OnDisconnected,
      OnAttributeChanged {
    /**
     * @internal
     */
    [$$HyplateComponentMeta]?: ComponentInstanceMeta;
  }
  /**
   * @internal
   */
  interface ComponentInstanceMeta {
    attributes?: Record<PropertyKey, WritableSignal<string | null>>;
  }
  export type AttributeKeys<T> = Extract<keyof PropsOf<T>, string> & {};
  export type AttributeDecorator<T, R> = (
    target: ClassAccessorDecoratorTarget<T, Subscribable<R | null>>,
    context: ClassAccessorDecoratorContext<T, Subscribable<R | null>>
  ) => ClassAccessorDecoratorResult<T, Subscribable<R | null>>;
}

const ComponentPrototype = Component.prototype as ClassComponentInstance;

ComponentPrototype.connectedCallback = function () {
  this.mount();
};

ComponentPrototype.disconnectedCallback = function () {
  this.unmount();
};

ComponentPrototype.attributeChangedCallback = function (name, _oldValue, newValue) {
  this[$$HyplateComponentMeta]?.attributes?.[name].set(newValue);
};

export const attribute: {
  <T, K extends AttributeKeys<T>>(name: K, transform: (value: string) => PropsOf<T>[K]): AttributeDecorator<
    T,
    PropsOf<T>[K]
  >;
  <T, K extends AttributeKeys<T>>(name: K): AttributeDecorator<T, Extract<PropsOf<T>[K], string>>;
} = (name, transform?: (value: string) => unknown) => (_target, _context) => {
  const currentMeta = currentComponentCtx()!;
  const attributes = (currentMeta.attributes ??= new Set());
  attributes.add(name);
  return {
    init(_value) {
      const instance = this as ClassComponentInstance<any, any>;
      const meta = (instance[$$HyplateComponentMeta] ??= {});
      const attributes = (meta.attributes ??= {});
      const src = (attributes[name] ??= signal<string | null>(instance.getAttribute(name)));
      if (transform) {
        return computed(() => {
          const value = src();
          return value == null ? null : transform(value);
        });
      }
      return src;
    },
    set(_value) {
      throw new Error(`Cannot set binded attribute. It's read-only.`);
    },
  };
};
