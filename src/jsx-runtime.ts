/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { $attr, $text, isSubscribable } from "./binding.js";
import { appendChild, attr, listen, fragment, element, svg, delegate, removeRange } from "./core.js";
import { anonymousElement, define } from "./custom-elements.js";
import { addCleanUp, isFragment, isNode, reflection } from "./internal.js";
import { assignSlotMap, insertSlotMap, slotName } from "./slot.js";
import type {
  JSXChildNode,
  FunctionalComponent,
  JSXChild,
  AttachFunc,
  CleanUpFunc,
  AttributeInterpolation,
  Rendered,
  Props,
  PropsBase,
  Later,
  ObjectEventHandler,
  SlotMap,
  Reflection,
  Renderer,
  JSXFactory,
  ShadowRootConfig,
  Mountable,
} from "./types.js";
import {
  applyAll,
  applyAllStatic,
  fori,
  isArray,
  isFunction,
  isObject,
  isString,
  noop,
  push,
  __DEV__,
} from "./util.js";

export const mount: Renderer = (element, onto): Rendered<any> => {
  const attach = isNode(onto) ? appendChild(onto) : onto;
  return element(attach);
};

export const unmount = (rendered: Rendered<any>) => {
  const [cleanup, , getRange] = rendered;
  cleanup();
  removeRange(getRange);
};

const addChild = (child: JSXChild, attach: AttachFunc) => {
  if (isNode(child)) {
    attach(child);
    return noop;
  }
  if (isFunction(child)) {
    return mount(child, attach)[0];
  }
  return $text`${child}`(attach);
};

const renderChild = (children: JSXChildNode, _attach: AttachFunc) => {
  let begin: Node | null = null,
    end: Node | null = null;
  const attach: AttachFunc = (node) => {
    const isFrag = isFragment(node);
    if (!begin) {
      if (isFrag) {
        begin = node.firstChild;
      } else {
        begin = node;
      }
    }
    if (isFrag) {
      end = node.lastChild;
    } else {
      end = node;
    }
    return _attach(node);
  };
  const cleanups: CleanUpFunc[] = [];
  if (isArray(children)) {
    fori(children, (child) => {
      addCleanUp(cleanups, addChild(child, attach));
    });
  } else {
    addCleanUp(cleanups, addChild(children, attach));
  }
  return [cleanups, () => (begin && end ? ([begin, end] as const) : void 0)] as const;
};

const isObjectEventHandler = (v: unknown): v is ObjectEventHandler<any> =>
  isObject(v) && "handleEvent" in v && isFunction(v.handleEvent);

let currentElementFactory: (name: string, options: ElementCreationOptions | undefined) => Element = element;

// @ts-expect-error unchecked overload
export const jsx: JSXFactory = (
  type: FunctionalComponent | typeof Component | string,
  props: Partial<Props<PropsBase, JSXChildNode, {}>>,
  ...children: JSXChild[]
): JSX.Element => {
  props ??= {};
  if (children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }
  if (typeof type === "string") {
    return (attach): Rendered<object> => {
      let lastElementFactory = currentElementFactory;
      const isSvg = type === "svg";
      const isForeignObject = type === "foreignObject";
      const changnigFactory = isSvg || isForeignObject;
      //#region enter svg creating scope
      if (isSvg) {
        // @ts-expect-error Skipped type check for svg children.
        currentElementFactory = svg;
      }
      //#endregion
      const el = currentElementFactory(type, "is" in props && isString(props.is) ? { is: props.is } : undefined);
      if (isForeignObject) {
        currentElementFactory = element;
      }
      const { children, ref, ...attributes } = props;
      if (ref) {
        ref.current = el;
      }
      const [cleanups] = children != null ? renderChild(children, appendChild(el)) : [[]];
      const eventHost = listen(el);
      const delegateHost = delegate(el);
      for (const key in attributes) {
        // @ts-expect-error for-in key access
        const value = attributes[key];
        if (isSubscribable(value)) {
          push(cleanups, $attr(el, key, value));
        } else {
          if (key.startsWith("on")) {
            const next = key[2];
            if ("A" <= next && next <= "Z") {
              const event = key.slice(2).toLowerCase();
              if (isFunction(value)) {
                push(cleanups, eventHost(event, value));
                continue;
              } else if (isObjectEventHandler(value)) {
                push(cleanups, eventHost(event, value, value.options));
                continue;
              }
            }
            if (next === ":") {
              if (isFunction(value)) {
                const event = key.slice(3).toLowerCase();
                push(cleanups, delegateHost(event, value));
                continue;
              }
            }
          }
          attr(el, key, value as AttributeInterpolation);
        }
      }
      attach(el);
      if (changnigFactory) {
        currentElementFactory = lastElementFactory;
      }
      return [applyAllStatic(cleanups), el, () => [el, el]];
    };
  }
  if (isComponentClass(type)) {
    return (attach) => {
      // @ts-expect-error Dynamic Implementation
      const instance: Component = new type(props);
      return instance.mount(attach);
    };
  }
  const { ref, ...otherProps } = props;
  // @ts-expect-error Dynamic Implementation
  const mountable = type(otherProps);
  if (!ref) {
    return mountable;
  }
  return (attach) => {
    const rendered = mountable(attach);
    // @ts-expect-error Dynamic Implementation
    ref.current = rendered[1];
    return rendered;
  };
};
export const jsxs = jsx;
export const h = jsx;
export const createElement = jsx;
/**
 * Create a jsx ref object to fetch the DOM element when mounted.
 */
export const jsxRef = <E extends {}>(): Later<E> => ({
  current: null,
});

export const Fragment: FunctionalComponent<{}, JSXChildNode | undefined> = ({ children }) => {
  return (attach) => {
    const f = fragment();
    const [cleanups, getRange] = children ? renderChild(children, appendChild(f)) : [[], noop];
    attach(f);
    return [applyAllStatic(cleanups), void 0, getRange];
  };
};

export const isComponentClass = (fn: Function): fn is typeof Component => fn.prototype instanceof Component;

export abstract class Component<P extends PropsBase = PropsBase, S extends string = string> extends HTMLElement {
  /**
   * The shadow root init config except `mode`.
   * In hyplate, we force the `mode` option to be `open`.
   */
  public static readonly shadowRootInit?: ShadowRootConfig;
  /**
   * The custom element name. Must be present, or it will explode.
   */
  public static readonly tag: string;
  /**
   * The slot element tag to be used when `shadowRootInit.slotAssignment` is `named`.
   * You can configure it as `div`, `span` or other built-in tags.
   * If not provided, hyplate will use a defined custom element with tag `${tag}-slot`.
   */
  public static readonly slotTag?: string;
  /**
   * Define this component as a custom element and the slot as a custom element, and then return it.
   * @param tag the custom element tag name
   */
  public static defineAs(tag: string): string {
    // @ts-expect-error abstract this
    define(tag, this);
    if (this.shadowRootInit?.slotAssignment === "manual" && !this.slotTag) {
      define(slotName(tag), anonymousElement());
    }
    return tag;
  }
  /**
   * If the component instance is created by HTML tag directly, the default props will be used.
   * Only useful when you want to use the component directly by its tag name.
   * Note that these default props will never be merged with given props in JSX.
   * If you want to use a factory function, you can define a static `getter` like this:
   * ```js
   * class MyComponent extends Component {
   *   static get defaultProps() {
   *     return {
   *       foo: "bar",
   *     };
   *   }
   * }
   * ```
   */
  public static defaultProps?: PropsBase;
  /**
   * By default, hyplate class component will not observe any attribute.
   * Currently TypeScript cannot declare a static field/getter field.
   * This getter is just for the type hint.
   */
  static get observedAttributes(): string[] {
    return [];
  }
  /**
   * In a hyplate class component, the `shadowRoot` property is ensured to be not null.
   */
  public declare shadowRoot: ShadowRoot;
  /**
   * Initialized in `setup`.
   */
  public props!: P;
  public slots: Reflection<S> = reflection;
  public cleanups: CleanUpFunc[] = [];
  #children: SlotMap<S> | undefined;
  #rendered: Rendered<this> | undefined;
  #newTarget: typeof Component<any, any>;
  public constructor(props?: Props<P, SlotMap<S> | undefined, {}>) {
    super();
    const newTarget = (this.#newTarget = new.target);
    // @ts-expect-error cannot use `this` for Exposed
    this.setup(props ?? newTarget.defaultProps);
  }
  /**
   * The props setup step.
   * You can override this to do the initialization stuff.
   * Remember to call `super.setup(props)` first to ensure the default behavior.
   */
  public setup(props: Props<P, SlotMap<S> | undefined, this>): void {
    let ref: Later<this> | undefined, children: SlotMap<S> | undefined;
    // @ts-expect-error later updated type
    const others: P = {};
    const { cleanups } = this;
    for (const key in props) {
      // @ts-expect-error for in property access
      const value = props[key];
      if (key === "ref") {
        ref = value;
      } else if (key === "children") {
        children = value;
      } else {
        if (key.startsWith("attr:")) {
          const name = key.slice(5);
          if (isSubscribable(value)) {
            push(cleanups, $attr(this, name, value));
          } else {
            attr(this, name, value);
          }
        } else {
          // @ts-expect-error unsafe property assign
          others[key] = value;
        }
      }
    }
    if (ref) {
      ref.current = this;
    }
    this.props = others;
    this.#children = children;
  }
  /**
   * The render function, should behave like the functional component.
   */
  public abstract render(): Mountable<any>;
  /**
   * The mount steps. Manually assign the slots or insert named slots,
   * and then attach the component instance to the parent view.
   * @param attach the attach function
   * @returns rendered result
   */
  public mount(attach?: AttachFunc): Rendered<this> {
    let rendered = this.#rendered;
    if (rendered) {
      return rendered;
    }
    const newTarget = this.#newTarget;
    const { tag, shadowRootInit } = newTarget;
    const slotAssignment = shadowRootInit?.slotAssignment;
    const shadow = this.attachShadow({
      ...shadowRootInit,
      mode: "open",
    });
    const [cleanup] = mount(this.render(), shadow);
    addCleanUp(this.cleanups, cleanup);
    const children = this.#children;
    if (children) {
      if (slotAssignment === "manual") {
        assignSlotMap(mount, this, children, this.cleanups);
      } else {
        insertSlotMap(mount, this, children, newTarget.slotTag ?? slotName(tag), this.cleanups);
      }
      // Free the slot map object since it will never be used again.
      this.#children = void 0;
    }
    rendered = this.#rendered = [() => this.unmount(), this, () => [this, this]];
    attach?.(this);
    return rendered;
  }
  /**
   * The unmount steps.
   */
  public unmount(): void {
    if (this.#rendered) {
      applyAll(this.cleanups);
      this.shadowRoot.innerHTML = "";
      this.#rendered = void 0;
    }
  }
}
