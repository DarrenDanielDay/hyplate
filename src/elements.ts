import { isSubscribable, $attr } from "./binding.js";
import { attr } from "./core.js";
import { reflection, addCleanUp } from "./internal.js";
import { mount } from "./jsx-runtime.js";
import { slotName, assignSlotMap, insertSlotMap } from "./slot.js";
import type {
  AttachFunc,
  ClassComponentStatic,
  CleanUpFunc,
  Later,
  Mountable,
  Props,
  PropsBase,
  Reflection,
  Rendered,
  ShadowRootConfig,
  SlotMap,
} from "./types.js";
import { applyAll, defineProp, patch, push } from "./util.js";

const ce = customElements;

export const define = /* #__PURE__ */ ce.define.bind(ce);

export const component = (options: ClassComponentStatic) => (ctor: typeof Component<any, any>) => {
  const { tag, observedAttributes, ...statics } = options;
  if (observedAttributes) {
    defineProp(ctor, "observedAttributes", { get: () => observedAttributes });
  }
  patch(ctor, statics);
  // @ts-expect-error assign to readonly field
  ctor.tag = define(tag, ctor);
};

export { component as CustomElement, component as WebComponent };

export const isComponentClass = (fn: Function): fn is typeof Component => !!(fn as typeof Component)?.__hyplate_comp;

export abstract class Component<P extends PropsBase = PropsBase, S extends string = string> extends HTMLElement {
  /**
   * @internal
   */
  static __hyplate_comp = true;
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
   * By default, hyplate will use `${tag}-slot` as the slot tag.
   * You can define this field in your component class as `div`, `span` or other built-in tags to override it.
   */
  public static get slotTag(): string {
    return slotName(this.tag);
  }
  /**
   * CSS style sheets to apply to the shadow root.
   */
  static styles: CSSStyleSheet[] = [];
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
  /**
   * Infer slot names with type magic.
   */
  public slots: Reflection<S> = reflection;
  /**
   * Clean up function collection.
   */
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
    shadow.adoptedStyleSheets = [...this.#newTarget.styles];
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
