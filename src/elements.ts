import { isSubscribable, $attr } from "./binding.js";
import { attr } from "./core.js";
import { reflection, addCleanUp, $$HyplateComponentMeta, enterComponentCtx, quitComponentCtx } from "./internal.js";
import { mount, setRef } from "./jsx-runtime.js";
import { slotName, assignSlotMap, insertSlotMap } from "./slot.js";
import type {
  AttachFunc,
  ClassComponentInstance,
  ClassComponentProps,
  ClassComponentRawProps,
  ClassComponentStatic,
  CleanUpFunc,
  ComponentClass,
  ComponentMeta,
  ComponentOptions,
  Later,
  Mountable,
  PropsBase,
  Reflection,
  Rendered,
  ShadowRootConfig,
  SlotMap,
} from "./types.js";
import { applyAll, defineProp, patch, push } from "./util.js";

const ce = customElements;

export const define = /* #__PURE__ */ ce.define.bind(ce);

export const isComponentClass = (fn: Function): fn is ComponentClass =>
  !!(fn as ComponentClass)?.[$$HyplateComponentMeta];

const observedAttributeProperty = "observedAttributes";

export const component = (options: ComponentOptions) => {
  const meta: ComponentMeta = {};
  enterComponentCtx(meta);
  return (_ctor: ClassComponentStatic, context: ClassDecoratorContext) => {
    context.addInitializer(function () {
      // @ts-expect-error convert type of `this`
      const cls: ComponentClass = this;
      cls[$$HyplateComponentMeta] = meta;
      const { tag, [observedAttributeProperty]: observedAttributes, ...statics } = options;
      cls.tag = tag;
      if (!Object.hasOwn(cls, observedAttributeProperty)) {
        // when `observedAttributes` is not explicitly defined in client class
        if (observedAttributes) {
          // If defined in `component` decorator, use it directly.
          defineProp(cls, observedAttributeProperty, { get: () => observedAttributes });
        } else {
          // Otherwise use attributes collected in metadata.
          const { attributes } = meta;
          if (attributes) {
            defineProp(cls, observedAttributeProperty, { get: () => [...attributes] });
          }
        }
      }
      patch(cls, statics);
      define(tag, cls);
      quitComponentCtx();
    });
  };
};

export { component as CustomElement, component as WebComponent };
export const Component: ComponentClass = class<P extends PropsBase = PropsBase, S extends string = string>
  extends HTMLElement
  implements ClassComponentInstance<P, S>
{
  /**
   * @internal
   */
  static [$$HyplateComponentMeta] = {};
  /**
   * The shadow root init config except `mode`.
   * In hyplate, we force the `mode` option to be `open`.
   */
  public static readonly shadowRootInit: ShadowRootConfig = {};
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
  static styles: CSSStyleSheet[] = [];
  static get observedAttributes(): string[] {
    return [];
  }

  public declare shadowRoot: ShadowRoot;
  public props!: Partial<P>;
  public slots: Reflection<S> = reflection;
  public cleanups: CleanUpFunc[] = [];
  #children: SlotMap<S> | undefined;
  #rendered: Rendered<this> | undefined;
  #newTarget: ComponentClass;
  public constructor(props?: ClassComponentProps<P, S>) {
    super();
    this.#newTarget = new.target;
    this.setup(props);
  }

  public setup(props: ClassComponentRawProps<P, S, this> | undefined): void {
    let ref: Later<this> | undefined, children: SlotMap<S> | undefined;
    const others: Partial<P> = {};
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
            // @ts-expect-error skip generic type check
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
      setRef(ref, this);
    }
    this.props = others;
    this.#children = children;
  }

  public render(): Mountable<any> {
    throw new Error("You should implement `render` in your component subclass");
  }

  public mount(attach?: AttachFunc): Rendered<this> {
    let rendered = this.#rendered;
    if (rendered) {
      return rendered;
    }
    const newTarget = this.#newTarget;
    const { shadowRootInit } = newTarget;
    const slotAssignment = shadowRootInit.slotAssignment;
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
        insertSlotMap(mount, this, children, newTarget.slotTag, this.cleanups);
      }
      // Free the slot map object since it will never be used again.
      this.#children = void 0;
    }
    rendered = this.#rendered = [() => this.unmount(), this, () => [this, this]];
    attach?.(this);
    return rendered;
  }

  public unmount(): void {
    if (this.#rendered) {
      applyAll(this.cleanups);
      this.shadowRoot.innerHTML = "";
      this.#rendered = void 0;
    }
  }

  /**
   * Decleared to supress type errors.
   */
  declare connectedCallback: () => void;
  declare disconnectedCallback: () => void;
  declare attributeChangedCallback: (name: string, oldValue: string | null, newValue: string | null) => void;
};
