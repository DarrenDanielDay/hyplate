/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { $$HyplateElementMeta, $$HyplateSignal } from "./internal.js";
/**
 * `NaN` cannot represented in TypeScript types.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
export type Falsy = false | undefined | void | null | "" | 0 | -0 | 0n;

export type AnyFunc = (...args: any[]) => any;

export type CleanUpFunc = () => void;

export type Effect = () => void | CleanUpFunc;

// @ts-ignore unused type parameter for geneic extension
export interface Subscribable<T> {}

export interface WritableSubscribable<T> extends Subscribable<T> {}

export type BindingPattern<T> = T | Subscribable<T>;

export type SubscribeFunc = <T>(subscribable: Subscribable<T>, subscriber: Subscriber<T>) => CleanUpFunc;

export type SubscribableTester = (value: unknown) => value is Subscribable<unknown>;

export type DispatchFunc = <T>(writable: WritableSubscribable<T>, value: T) => void;

export type WritableTester = (value: unknown) => value is WritableSubscribable<unknown>;

export interface SignalMembers<T extends unknown> {
  [$$HyplateSignal]: boolean;
  /**
   * `Signal` in hyplate is implemented with `EventTarget`.
   * This property exposes the raw event target object.
   */
  readonly target: EventTarget;
  /**
   * @internal
   */
  get(): T;
  /**
   * @internal
   * This method is internal implementation detail. May be changed in the future.
   */
  subscribe(subscriber: Subscriber<T>): CleanUpFunc;
  /**
   * @internal
   * This object is internal implementation detail. May be changed in the future.
   */
  proto?: object;
}

export interface SignalGetter<T extends unknown> {
  (this: void): T;
}

export interface Signal<T extends unknown> extends SignalGetter<T>, SignalMembers<T> {}

export interface WritableSignalMembers<T extends unknown> extends SignalMembers<T> {
  /**
   * Set the signal value.
   * @param newVal the new signal value to dispatch
   */
  set(newValue: T): void;
  /**
   * Mutate the old value and dispatch signal data.
   * Comparator of the signal will be ignored. It will always dispatch a signal update.
   * @param mutation mutation
   */
  mutate(mutation: (oldValue: T) => void): void;
  /**
   * Compute a new value from the previous one, and then `set()` the signal data.
   * @param reducer reduce function
   */
  update(reducer: (previous: T) => T): void;
}

export interface WritableSignal<T extends unknown> extends SignalGetter<T>, WritableSignalMembers<T> {}

export type Subscriber<T extends unknown> = (this: void, latest: T) => void;

export interface Later<E> {
  current: E | null;
}

/**
 * Should return true if the two value is treated as same.
 */
export type Comparator = <T>(a: T, b: T) => boolean;

export type TextInterpolation = string | number | bigint | boolean;

export type AttributeInterpolation = string | number | bigint | boolean | undefined | null;

export type AttributePattern = `attr:${string}`;

export type AttributesMap<T> = AttributeEntries extends infer P
  ? P extends [infer E extends T, infer A]
    ? T extends E
      ? A
      : never
    : never
  : never;

export interface ElementDirectives<E extends Element> {}

export type ElementWithStyle = {
  style: CSSStyleDeclaration;
};

export type StyleProperties = Extract<
  {
    [K in keyof CSSStyleDeclaration]: CSSStyleDeclaration[K] extends string ? K : never;
  }[keyof CSSStyleDeclaration],
  string
>;

export type JSXStyleBindings = {
  [K in StyleProperties as `style:${K | KebabCase<K>}`]?: BindingPattern<string | null>;
};

export type Join<S extends string[], D extends string, R extends string = ""> = S extends [
  infer F extends string,
  ...infer B extends string[]
]
  ? B extends []
    ? `${R}${F}`
    : Join<B, D, `${R}${F}${D}`>
  : R;

export type KebabCase<
  T extends string,
  R extends string[] = [],
  V extends string = ""
> = T extends `${infer F}${infer B}`
  ? F extends Alphabet
    ? KebabCase<B, [...R, V], Lowercase<F>>
    : KebabCase<B, R, `${V}${F}`>
  : Join<[...R, V], "-">;

export type CSSProperties = KebabCase<StyleProperties>;

export interface KnownEventMap extends HTMLElementEventMap, SVGElementEventMap, MathMLElementEventMap {}

export type FunctionalEventHanlder<T extends EventTarget, E extends Event> = (this: T, e: E) => void;

export interface ObjectEventHandler<E extends Event> {
  handleEvent(event: E): void;
  options?: EventHandlerOptions;
}

export type Handler<T extends EventTarget, E extends Event> = FunctionalEventHanlder<T, E> | ObjectEventHandler<E>;

export type Events = keyof KnownEventMap;

export type Alphabet<S = "ABCDEFGHIJKLMNOPQRSTUVWXYZ", U = never> = S extends `${infer C}${infer R}`
  ? Alphabet<R, U | C>
  : U;

export type EventPattern = `on${Alphabet}${string}`;

export type DelegatePattern = `on:${string}`;

export type EventHandlerOptions = boolean | EventListenerOptions;

declare global {
  /**
   * Currently `lib.dom.d.ts` does not have the following definitions.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#parameters
   */
  interface EventListenerOptions {
    once?: boolean;
    passive?: boolean;
    signal?: AbortSignal;
  }
  /**
   * @internal
   * This is the internal type declaration for mixin properties.
   */
  interface EventTarget {
    [handler: `_${string}`]: FunctionalEventHanlder<EventTarget, Event>;
  }
  /**
   * @internal
   * This is the internal type declaration for event delegate mode.
   */
  interface Document {
    $$delegates: Set<string> | undefined;
  }
}

export type EventHost<T extends EventTarget> = {
  <E extends Events>(name: E, handler: Handler<T, KnownEventMap[E]>, options?: EventHandlerOptions): CleanUpFunc;
  (name: string, handler: Handler<T, Event>, options?: EventHandlerOptions): CleanUpFunc;
  <D>(name: string, handler: Handler<T, CustomEvent<D>>, options?: EventHandlerOptions): CleanUpFunc;
};

export type DelegateHost<T extends Element> = <E extends Events>(
  event: E,
  handler: FunctionalEventHanlder<T, KnownEventMap[E]>
) => CleanUpFunc;

export interface InputDirectives {}

export interface TextareaDirectives {}

export interface SelectDirectives {}

export interface InputModelMap {
  string: ["value", string];
  boolean: ["checked", boolean];
  number: ["valueAsNumber", number];
  date: ["valueAsDate", Date | null];
}

export type InputModelDirective = {
  [K in keyof InputModelMap as `h-model:${K}`]?: WritableSubscribable<InputModelMap[K][1]>;
};

export interface GeneralModelDirective<T> {
  "h-model"?: WritableSubscribable<T>;
}

export type InputModelProperties = {
  [K in keyof InputModelMap]: InputModelMap[K][0];
};

export type InputModelProperty = InputModelProperties[keyof InputModelProperties];

export type InputModelTypes = {
  [K in keyof InputModelMap]: HTMLInputElement[InputModelMap[K][0]];
}[keyof InputModelMap];

export interface ModelableElement<T> extends Element {
  value: T;
}

export interface ModelOptions {
  on: "change" | "input" | "blur";
}

export interface InputModelOptions<T extends keyof InputModelMap = keyof InputModelMap> {
  as: T;
}

export interface Hooks {
  /**
   * Get the cleanup collector function.
   * The cleanup collector registers the cleanup function as part of the component cleanup.
   */
  useCleanUpCollector(): (cleanup: CleanUpFunc) => void;
}

export type ShadowRootConfig = Omit<ShadowRootInit, "mode">;

export interface ClassComponentStatic {
  tag: string;
  slotTag: string;
  /**
   * CSS style sheets to apply to the shadow root.
   */
  styles: CSSStyleSheet[];
  shadowRootInit: ShadowRootConfig;
  observedAttributes: string[];
  formAssociated: boolean;
}

export interface ComponentMeta {
  attributes?: Set<string>;
}

export type ComponentOptions = {
  tag: string;
  slotTag?: string;
  styles?: CSSStyleSheet[];
  shadowRootInit?: ShadowRootConfig;
  observedAttributes?: string[];
  formAssociated?: boolean;
};

export interface OnConnected {
  connectedCallback(): void;
}

export interface OnDisconnected {
  disconnectedCallback(): void;
}

export interface OnAdopted {
  adoptedCallback(): void;
}

export interface OnAttributeChanged {
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks
 */
export interface LifecycleCallbacks extends OnConnected, OnDisconnected, OnAdopted, OnAttributeChanged {}

export interface ExposedElement<T> extends HTMLElement {
  readonly exposed: T;
}

export type NativeSlotContent = Text | Element;

export type SlotContent = Node | JSX.Element;

/**
 * Slot name map for
 */
export type SlotMap<S extends string = string> = Partial<Record<S, SlotContent>>;

export type Reflection<S extends string> = {
  [K in S]: K;
};

export type PropsBase = {};

export type Mountable<E> = (attach: AttachFunc) => Rendered<E>;

export type Renderer = (element: JSX.Element, onto: Node | AttachFunc) => Rendered<any>;

export type WithChildren<C> = { children: C };

export type WithRef<E> = { ref: Later<E> };

export type Props<P extends PropsBase, C = undefined, E = undefined> = Omit<P, "children" | "ref"> &
  (undefined extends C ? Partial<WithChildren<C>> : WithChildren<C>) &
  Partial<WithRef<E>>;

export type FunctionalComponent<P extends PropsBase = PropsBase, C = undefined, E = void> = {
  (props: Props<P, C, E>): Mountable<E>;
  customRef?: boolean;
};

export type ClassComponentProps<P extends PropsBase, S extends string> = Omit<P, "children" | "ref"> & {
  children?: SlotMap<S>;
};

export type ClassComponentRawProps<P extends PropsBase, S extends string, T> = Omit<P, "children" | "ref"> & {
  children?: SlotMap<S>;
  ref?: Later<T>;
};
export type HyplateElementMetadata = {
  [$$HyplateElementMeta]?: ComponentMeta;
};

export interface ComponentClass extends ClassComponentStatic {
  /**
   * @internal
   */
  [Symbol.metadata]: HyplateElementMetadata | null;
  new <P extends PropsBase = PropsBase, S extends string = string>(
    props?: ClassComponentProps<P, S>
  ): ClassComponentInstance<P, S>;
}

export interface ClassComponentInstance<P extends PropsBase = PropsBase, S extends string = string>
  extends HTMLElement {
  /**
   * In a hyplate class component, the `shadowRoot` property is ensured to be not null.
   */
  shadowRoot: ShadowRoot;
  /**
   * The internals returned when calling `attachInternals()` if the element is marked as `formAssociated`.
   */
  internals?: ElementInternals;
  /**
   * Initialized in `setup`.
   */
  props: Partial<P>;
  /**
   * Infer slot names with type magic.
   */
  slots: Reflection<S>;
  /**
   * Clean up function collection.
   */
  cleanups: CleanUpFunc[];
  /**
   * The props setup step.
   * You can override this to do the initialization stuff.
   * Remember to call `super.setup(props)` first to ensure the default behavior.
   */
  setup(props?: ClassComponentRawProps<P, S, this> | undefined): void;
  /**
   * Execute an effect callback which should return a `cleanup` function when the component is mounted.
   * The `cleanup` function will be executed when component unmount.
   */
  effect(callback: () => CleanUpFunc): void;
  /**
   * The render function, should behave like functional components.
   */
  render(): Mountable<any>;
  /**
   * The mount steps. Manually assign the slots or insert named slots,
   * and then attach the component instance to the parent view.
   * @param attach the attach function
   * @returns rendered result
   */
  mount(attach?: AttachFunc): Rendered<this>;
  /**
   * The unmount steps.
   */
  unmount(): void;
}

export type PropsOf<T> = T extends ClassComponentInstance<infer P, any> ? P : never;

export type ContextFactory<Context extends {}> = (fragment: DocumentFragment) => Context;

export type ContextSetupFactory<Context extends {}, S extends SlotMap> = <P extends PropsBase, E>(
  setup?: (props: P, context: Context) => E,
  wrapper?: keyof HTMLElementTagNameMap
) => FunctionalComponent<P, undefined | S, E>;

export interface TemplateContext<R> {
  refs: R;
}

export interface FunctionalComponentTemplateFactory {
  <S extends string = never>(input: string | HTMLTemplateElement): <P extends PropsBase, E>(
    setup?: (props: P) => E,
    wrapper?: keyof HTMLElementTagNameMap
  ) => FunctionalComponent<P, undefined | SlotMap<S>, E>;
  <S extends SlotMap, Context extends {}>(
    input: string | HTMLTemplateElement,
    contextFactory?: ContextFactory<Context>
  ): ContextSetupFactory<Context, S>;
}

export { type FunctionalComponent as FC };

/**
 * Accept a node, attach it to the DOM tree and return its parentNode.
 */
export type AttachFunc = (el: Node) => void;

export type GetRange = () => readonly [Node, Node] | undefined | void;

export type Rendered<E> = [cleanup: CleanUpFunc, exposed: E, getRange: GetRange];

export type BindingHost<T extends Element> = {
  attr<P extends keyof AttributesMap<T>>(name: P, subscribable: Subscribable<AttributesMap<T>[P]>): BindingHost<T>;
  content(subscribable: Subscribable<TextInterpolation>): BindingHost<T>;
  delegate<E extends Events>(name: E, handler: FunctionalEventHanlder<T, KnownEventMap[E]>): BindingHost<T>;
  event<E extends Events>(
    name: E,
    handler: Handler<T, KnownEventMap[E]>,
    options?: boolean | EventListenerOptions
  ): BindingHost<T>;
  text(fragments: TemplateStringsArray, ...bindings: BindingPattern<TextInterpolation>[]): BindingHost<T>;
};

//#region directives

export type TruthyContextMountable<Truthy, T> = (truthy: NonNullable<Truthy>) => Mountable<T>;

export type FalsyContextMountable<T> = () => Mountable<T>;

export interface IfProps<Test, T, F = void> {
  condition: Subscribable<Test>;
  then: TruthyContextMountable<Test, T>;
  else?: FalsyContextMountable<F>;
}

export interface ShowProps<Test, F = void> {
  when: Subscribable<Test>;
  fallback?: FalsyContextMountable<F>;
}

export interface FutureProps<R, F = void, E = void> {
  promise: Promise<R>;
  fallback?: Mountable<F>;
  error?: (reason?: any) => Mountable<E>;
}

export type FutureBuilder<R, T> = (result: R) => Mountable<T>;

export interface ForProps<T extends unknown> {
  /**
   * The iterable query.
   */
  of: Subscribable<ArrayLike<T>>;
}
//#endregion

//#region JSX types
export type ArrayOr<T> = T | T[];

export interface JSXDirective<T> {
  prefix: string;
  requireParams: boolean;
  apply(el: Element, params: string | null, input: T): CleanUpFunc | void;
}

export type JSXChild = JSX.Element | Node | BindingPattern<TextInterpolation>;

export type JSXChildNode = ArrayOr<JSXChild> | JSXChildNode[];

export interface JSXFactory {
  /**
   * native tag overload
   */
  <T extends keyof JSX.IntrinsicElements>(
    type: T,
    props?: (JSX.IntrinsicElements[T] & Partial<WithChildren<JSXChildNode>>) | undefined | null,
    ...children: JSXChild[]
  ): JSX.Element;
  /**
   * functional component overload
   */
  <P extends PropsBase, C, E>(
    type: FunctionalComponent<P, C, E>,
    props?: Props<P, C, E> | undefined | null,
    ...children: JSXChild[]
  ): JSX.Element;
  /**
   * class component overload
   */
  <T extends ComponentClass>(
    type: T,
    props: JSX.IntrinsicClassAttributes<InstanceType<T>> &
      (InstanceType<T> extends ClassComponentInstance<infer P, infer S>
        ? ClassComponentRawProps<P, S, InstanceType<T>>
        : never),
    ...childre: JSXChild[]
  ): JSX.Element;
}

type GeneralAttributeType = string | number | boolean | undefined | null;

type EnumeratedValues<E extends string> = E | (string & {});

type ElementAttributes<E extends Element> = {
  ref?: Later<E> | E;
} & ElementDirectives<E>;

//#region shared attribute enum values
type BooleanAttributeValue = boolean | `${boolean}` | "";
type NumericAttributeValue = string | number;
type TargetOptions = EnumeratedValues<"_self" | "_blank" | "_parent" | "_top">;
type EncryptionTypes = EnumeratedValues<"application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain">;
interface ExperimentalImportance {
  /**
   * @experimental
   */
  importance: EnumeratedValues<"auto" | "high" | "low">;
  /**
   * @experimental
   */
  fetchpriority: EnumeratedValues<"auto" | "high" | "low">;
}
type FormMethods = EnumeratedValues<"post" | "get" | "dialog">;
export interface FormElementAttributes {
  autofocus: BooleanAttributeValue;
  disabled: BooleanAttributeValue;
  form: string;
  formaction: string;
  formenctype: EncryptionTypes;
  formmethod: FormMethods;
  formnovalidate: BooleanAttributeValue;
  formtarget: TargetOptions;
  name: string;
  value: TextInterpolation;
}
interface SizeOptions {
  height: NumericAttributeValue;
  width: NumericAttributeValue;
}
type CORSOptions = EnumeratedValues<"anonymous" | "use-credentials" | "">;
type ReferrerPolicyOptions = EnumeratedValues<
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url"
>;
//#endregion

//#region input attributes
type InputTypes = EnumeratedValues<
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"
>;
type Except<K extends InputTypes> = Exclude<InputTypes, K>;
type AttributeInfo<T, V extends InputTypes> = [type: T, valid: V];
type TextLikeInputTypes = "text" | "search" | "url" | "tel" | "email" | "password";

type NumericInputTypes = "date" | "month" | "week" | "time" | "datetime-local" | "number" | "range";

//#region autocomplete
type AutoCompleteSwitch = EnumeratedValues<"on" | "off">;
type AutoCompleteHints =
  | "off"
  | "on"
  | "name"
  | "honorific-prefix"
  | "given-name"
  | "additional-name"
  | "family-name"
  | "honorific-suffix"
  | "nickname"
  | "email"
  | "username"
  | "new-password"
  | "current-password"
  | "one-time-code"
  | "organization-title"
  | "organization"
  | "street-address"
  | `address-line${1 | 2 | 3}`
  | `address-level${1 | 2 | 3 | 4}`
  | "country"
  | "country-name"
  | "postal-code"
  | "cc-name"
  | "cc-given-name"
  | "cc-additional-name"
  | "cc-family-name"
  | "cc-number"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-csc"
  | "cc-type"
  | "transaction-currency"
  | "transaction-amount"
  | "language"
  | "bday"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "sex"
  | "tel"
  | "tel-country-code"
  | "tel-national"
  | "tel-area-code"
  | "tel-local"
  | "tel-local-prefix"
  | "tel-extension"
  | "impp"
  | "url"
  | "photo";
//#endregion

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
interface MapAttributeToValueAndKeys {
  accept: AttributeInfo<string, "file">;
  alt: AttributeInfo<string, "image">;
  autocomplete: AttributeInfo<AutoCompleteHints, Except<"checkbox" | "radio" | "button">>;
  capture: AttributeInfo<EnumeratedValues<"user" | "environment">, "file">;
  checked: AttributeInfo<BooleanAttributeValue, "checkbox" | "radio">;
  dirname: AttributeInfo<string, "search" | "text">;
  disabled: AttributeInfo<BooleanAttributeValue, InputTypes>;
  form: AttributeInfo<BooleanAttributeValue, InputTypes>;
  formaction: AttributeInfo<string, "image" | "submit">;
  formenctype: AttributeInfo<EncryptionTypes, "image" | "submit">;
  formmethod: AttributeInfo<BooleanAttributeValue, "image" | "submit">;
  formnovalidate: AttributeInfo<BooleanAttributeValue, "image" | "submit">;
  formtarget: AttributeInfo<string, "image" | "submit">;
  height: AttributeInfo<NumericAttributeValue, "image">;
  list: AttributeInfo<string, Except<"hidden" | "password" | "checkbox" | "radio" | "button">>;
  max: AttributeInfo<NumericAttributeValue, NumericInputTypes>;
  maxlength: AttributeInfo<NumericAttributeValue, TextLikeInputTypes>;
  min: AttributeInfo<NumericAttributeValue, NumericInputTypes>;
  minlength: AttributeInfo<NumericAttributeValue, TextLikeInputTypes>;
  multiple: AttributeInfo<BooleanAttributeValue, "email" | "file">;
  name: AttributeInfo<string, InputTypes>;
  pattern: AttributeInfo<string, TextLikeInputTypes>;
  placeholder: AttributeInfo<string, TextLikeInputTypes | "number">;
  readonly: AttributeInfo<
    BooleanAttributeValue,
    Except<"hidden" | "range" | "color" | "checkbox" | "radio" | "button">
  >;
  required: AttributeInfo<BooleanAttributeValue, Except<"hidden" | "range" | "color" | "button">>;
  size: AttributeInfo<NumericAttributeValue, TextLikeInputTypes>;
  src: AttributeInfo<string, "image">;
  step: AttributeInfo<NumericAttributeValue, NumericInputTypes>;
  value: AttributeInfo<TextInterpolation, InputTypes>;
  width: AttributeInfo<NumericAttributeValue, "image">;
}

type ExtractType<
  K extends InputTypes,
  A extends keyof MapAttributeToValueAndKeys
> = MapAttributeToValueAndKeys[A] extends AttributeInfo<unknown, infer V> ? (K extends V ? A : never) : never;

type InputAttributes = {
  [K in InputTypes]: {
    type: K;
  } & {
    [A in keyof MapAttributeToValueAndKeys as ExtractType<K, A>]: MapAttributeToValueAndKeys[A] extends AttributeInfo<
      infer T,
      any
    >
      ? T
      : never;
  };
}[InputTypes];
type ListStyleType = EnumeratedValues<"a" | "A" | "i" | "I" | "1">;
export interface PlayerAttributes {
  autoplay: BooleanAttributeValue;
  controls: BooleanAttributeValue;
  /**
   * @experimental
   */
  controlslist: string;
  /**
   * @experimental
   */
  disableremoteplayback: BooleanAttributeValue;
  crossorigin: CORSOptions;
  loop: BooleanAttributeValue;
  muted: BooleanAttributeValue;
  preload: EnumeratedValues<"none" | "metadata" | "auto">;
  src: string;
}
//#endregion

/**
 * @see https://developer.mozilla.org/docs/Web/HTML/Global_attributes
 */
//#region global attributes
export interface HTMLGlobalEventAttributes {
  onabort: string;
  onautocomplete: string;
  onautocompleteerror: string;
  onblur: string;
  oncancel: string;
  oncanplay: string;
  oncanplaythrough: string;
  onchange: string;
  onclick: string;
  onclose: string;
  oncontextmenu: string;
  oncuechange: string;
  ondblclick: string;
  ondrag: string;
  ondragend: string;
  ondragenter: string;
  ondragleave: string;
  ondragover: string;
  ondragstart: string;
  ondrop: string;
  ondurationchange: string;
  onemptied: string;
  onended: string;
  onerror: string;
  onfocus: string;
  oninput: string;
  oninvalid: string;
  onkeydown: string;
  onkeypress: string;
  onkeyup: string;
  onload: string;
  onloadeddata: string;
  onloadedmetadata: string;
  onloadstart: string;
  onmousedown: string;
  onmouseenter: string;
  onmouseleave: string;
  onmousemove: string;
  onmouseout: string;
  onmouseover: string;
  onmouseup: string;
  onmousewheel: string;
  onpause: string;
  onplay: string;
  onplaying: string;
  onprogress: string;
  onratechange: string;
  onreset: string;
  onresize: string;
  onscroll: string;
  onseeked: string;
  onseeking: string;
  onselect: string;
  onshow: string;
  onsort: string;
  onstalled: string;
  onsubmit: string;
  onsuspend: string;
  ontimeupdate: string;
  ontoggle: string;
  onvolumechange: string;
  onwaiting: string;
}

//#region ARIA
export type AriaWidgetRoles =
  | "button"
  | "checkbox"
  | "gridcell"
  | "link"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "option"
  | "progressbar"
  | "radio"
  | "scrollbar"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "switch"
  | "tab"
  | "tabpanel"
  | "textbox"
  | "treeitem";
export type AriaCompositeRoles =
  | "combobox"
  | "grid"
  | "listbox"
  | "menu"
  | "menubar"
  | "radiogroup"
  | "tablist"
  | "tree"
  | "treegrid";
export type AriaDocumentStructureRoles =
  | "application"
  | "article"
  | "cell"
  | "columnheader"
  | "definition"
  | "directory"
  | "document"
  | "feed"
  | "figure"
  | "group"
  | "heading"
  | "img"
  | "list"
  | "listitem"
  | "math"
  | "none"
  | "note"
  | "presentation"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "separator"
  | "table"
  | "term"
  | "toolbar"
  | "tooltip";
export type AriaLandmarkRoles =
  | "banner"
  | "complementary"
  | "contentinfo"
  | "form"
  | "main"
  | "navigation"
  | "region"
  | "search";
export type AriaLiveRegionRoles = "alert" | "log" | "marquee" | "status" | "timer";
export type AriaWindowRoles = "alertdialog" | "dialog";
export type AriaRoles = EnumeratedValues<
  | AriaWidgetRoles
  | AriaCompositeRoles
  | AriaDocumentStructureRoles
  | AriaLandmarkRoles
  | AriaLiveRegionRoles
  | AriaWindowRoles
>;

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes
 */
export interface AriaStatesAndProperties {
  "aria-activedescendant": string;
  "aria-atomic": BooleanAttributeValue;
  "aria-autocomplete": EnumeratedValues<"none" | "inline" | "list" | "both">;
  "aria-busy": BooleanAttributeValue;
  "aria-checked": BooleanAttributeValue | EnumeratedValues<"mixed">;
  "aria-colcount": NumericAttributeValue;
  "aria-colindex": NumericAttributeValue;
  "aria-colspan": NumericAttributeValue;
  "aria-controls": string;
  "aria-current": BooleanAttributeValue | EnumeratedValues<"page" | "step" | "location" | "date" | "time">;
  "aria-describedby": string;
  "aria-details": string;
  "aria-disabled": BooleanAttributeValue;
  /**
   * @deprecated
   */
  "aria-dropeffect": EnumeratedValues<"none" | "copy" | "execute" | "link" | "move" | "popup">;
  "aria-errormessage": string;
  "aria-expanded": BooleanAttributeValue;
  "aria-flowto": string;
  /**
   * @deprecated
   */
  "aria-grabbed": BooleanAttributeValue;
  "aria-haspopup": BooleanAttributeValue | EnumeratedValues<"menu" | "listbox" | "tree" | "grid" | "dialog">;
  "aria-hidden": BooleanAttributeValue;
  "aria-invalid": BooleanAttributeValue | EnumeratedValues<"grammar" | "spelling">;
  "aria-keyshortcuts": string;
  "aria-label": string;
  "aria-labelledby": string;
  "aria-level": NumericAttributeValue;
  "aria-live": EnumeratedValues<"off" | "assertive" | "polite">;
  "aria-modal": BooleanAttributeValue;
  "aria-multiline": BooleanAttributeValue;
  "aria-multiselectable": BooleanAttributeValue;
  "aria-orientation": EnumeratedValues<"horizontal" | "vertical">;
  "aria-owns": string;
  "aria-placeholder": string;
  "aria-posinset": NumericAttributeValue;
  "aria-pressed": BooleanAttributeValue | EnumeratedValues<"mixed">;
  "aria-readonly": BooleanAttributeValue;
  "aria-relevant": EnumeratedValues<
    | "additions"
    | "additions removals"
    | "additions text"
    | "all"
    | "removals"
    | "removals additions"
    | "removals text"
    | "text"
    | "text additions"
    | "text removals"
  >;
  "aria-required": BooleanAttributeValue;
  "aria-roledescription": string;
  "aria-rowcount": NumericAttributeValue;
  "aria-rowindex": NumericAttributeValue;
  "aria-rowspan": NumericAttributeValue;
  "aria-selected": BooleanAttributeValue;
  "aria-setsize": NumericAttributeValue;
  "aria-sort": EnumeratedValues<"none" | "ascending" | "descending" | "other">;
  "aria-valuemax": NumericAttributeValue;
  "aria-valuemin": NumericAttributeValue;
  "aria-valuenow": NumericAttributeValue;
  "aria-valuetext": string;
}
export interface AriaAttributes extends AriaStatesAndProperties {
  role: AriaRoles;
}
//#endregion

export interface GlobalAttributes extends HTMLGlobalEventAttributes, AriaAttributes {
  accesskey: GeneralAttributeType;
  autocapitalize: EnumeratedValues<"off" | "none" | "on" | "sentences" | "words" | "characters">;
  autofocus: BooleanAttributeValue;
  class: string;
  contenteditable: BooleanAttributeValue;
  /** @deprecated */
  contextmenu: GeneralAttributeType;
  dir: EnumeratedValues<"ltr" | "rtl" | "auto">;
  draggable: BooleanAttributeValue;
  enterkeyhint: EnumeratedValues<"enter" | "done" | "go" | "next" | "previous" | "search" | "send">;
  /** @experimental */
  exportparts: GeneralAttributeType;
  hidden: EnumeratedValues<"" | "hidden" | "until-found">;
  id: GeneralAttributeType;
  inputmode: EnumeratedValues<"none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url">;
  inert: BooleanAttributeValue;
  is: string;
  itemid: GeneralAttributeType;
  itemprop: string;
  itemref: string;
  itemscope: string;
  itemtype: string;
  lang: string;
  nonce: string;
  part: GeneralAttributeType;
  role: AriaRoles;
  slot: string;
  spellcheck: BooleanAttributeValue;
  style: string;
  tabindex: NumericAttributeValue;
  title: string;
  translate: EnumeratedValues<"yes" | "no">;
  /** @deprecated */
  "xml:lang": string;
  /** @deprecated */
  "xml:base": string;
}

//#endregion

//#region HTML attributes
export interface HTMLAnchorElementAttributes extends GlobalAttributes {
  download: string;
  href: string;
  hreflang: string;
  ping: string;
  referrerpolicy: ReferrerPolicyOptions;
  rel: string;
  target: TargetOptions;
  type: string;
}

export interface HTMLAreaElementAttributes extends GlobalAttributes {
  alt: string;
  coords: string;
  download: string;
  href: string;
  /**
   * @deprecated
   */
  hreflang: string;
  referrerpolicy: ReferrerPolicyOptions;
  rel: string;
  shape: string;
  target: TargetOptions;
}

export interface HTMLAudioElementAttributes extends GlobalAttributes, PlayerAttributes {}

export interface HTMLButtonElementAttributes extends GlobalAttributes, FormElementAttributes {
  type: EnumeratedValues<"submit" | "reset" | "button" | "menu">;
}

export interface HTMLCanvasElementAttributes extends GlobalAttributes, SizeOptions {}

export interface HTMLTableColElementAttributes extends GlobalAttributes {
  span: NumericAttributeValue;
}

export interface HTMLDataElementAttributes extends GlobalAttributes {
  value: string;
}

export interface HTMLModElementAttributes extends GlobalAttributes {
  cite: string;
  datatime: string;
}

export interface HTMLDetailsElementAttributes extends GlobalAttributes {
  open: BooleanAttributeValue;
}

export interface HTMLDialogElementAttributes extends Omit<GlobalAttributes, "tabindex"> {
  open: BooleanAttributeValue;
}

export interface HTMLEmbedElementAttributes extends GlobalAttributes, SizeOptions {
  src: string;
  type: string;
}

export interface HTMLFieldSetElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  form: string;
  name: string;
}

export interface HTMLFormElementAttributes extends GlobalAttributes {
  "accept-charset": string;
  action: string;
  autocomplete: AutoCompleteSwitch;
  enctype: EncryptionTypes;
  method: FormMethods;
  name: string;
  novalidate: BooleanAttributeValue;
  rel: string;
  target: TargetOptions;
}

export interface HTMLIFrameElementAttributes extends GlobalAttributes, ExperimentalImportance, SizeOptions {
  allow: string;
  /**
   * @deprecated
   * Use allow="fullscreen" instead.
   */
  allowfullscreen: BooleanAttributeValue;
  /**
   * @deprecated
   * Use allow="payment" instead.
   */
  allowpaymentrequest: BooleanAttributeValue;
  /**
   * @experimental
   */
  csp: string;
  name: string;
  referrerpolicy: ReferrerPolicyOptions;
  sandbox: EnumeratedValues<
    | "allow-downloads-without-user-activation"
    | "allow-forms"
    | "allow-modals"
    | "allow-orientation-lock"
    | "allow-pointer-lock"
    | "allow-popups"
    | "allow-popups-to-escape-sandbox"
    | "allow-presentation"
    | "allow-same-origin"
    | "allow-scripts"
    | "allow-storage-access-by-user-activation"
    | "allow-top-navigation"
    | "allow-top-navigation-by-user-activation"
  >;
  src: string;
  srcdoc: string;
}

export interface HTMLImageElementAttributes extends GlobalAttributes, ExperimentalImportance, SizeOptions {
  alt: string;
  crossorigin: CORSOptions;
  decoding: EnumeratedValues<"sync" | "async" | "auto">;
  ismap: BooleanAttributeValue;
  loading: EnumeratedValues<"eager" | "lazy">;
  referrerpolicy: ReferrerPolicyOptions;
  sizes: string;
  src: string;
  srcset: string;
  usemap: string;
}

export interface HTMLInputElementAttributes extends GlobalAttributes, FormElementAttributes {
  type: InputTypes;
  accept: string;
  alt: string;
  autocomplete: EnumeratedValues<AutoCompleteHints>;
  capture: EnumeratedValues<"user" | "environment">;
  checked: BooleanAttributeValue;
  dirname: string;
  height: NumericAttributeValue;
  list: string;
  max: NumericAttributeValue;
  maxlength: NumericAttributeValue;
  min: NumericAttributeValue;
  minlength: NumericAttributeValue;
  multiple: BooleanAttributeValue;
  pattern: string;
  placeholder: string;
  readonly: BooleanAttributeValue;
  required: BooleanAttributeValue;
  size: NumericAttributeValue;
  src: string;
  step: NumericAttributeValue;
  width: NumericAttributeValue;
}

export interface HTMLLabelElementAttributes extends GlobalAttributes {
  for: string;
}

export interface HTMLLIElementAttributes extends GlobalAttributes {
  value: NumericAttributeValue;
  /**
   * @deprecated
   */
  type: ListStyleType;
}

export interface HTMLLinkElementAttributes extends GlobalAttributes, ExperimentalImportance {
  as: EnumeratedValues<
    | "audio"
    | "document"
    | "embed"
    | "fetch"
    | "font"
    | "image"
    | "object"
    | "script"
    | "style"
    | "track"
    | "video"
    | "worker"
  >;
  crossorigin: CORSOptions;
  href: string;
  hreflang: string;
  imagesizes: string;
  imagesrcset: string;
  integrity: string;
  media: string;
  /**
   * @experimental
   */
  prefetch: BooleanAttributeValue;
  referrerpolicy: ReferrerPolicyOptions;
  rel: string;
  /**
   * @experimental
   */
  sizes: string;
  title: string;
  type: string;
  blocking: string;
}

export interface HTMLMapElementAttributes extends GlobalAttributes {
  name: string;
}

export interface HTMLMeterElementAttributes extends GlobalAttributes {
  value: NumericAttributeValue;
  min: NumericAttributeValue;
  max: NumericAttributeValue;
  low: NumericAttributeValue;
  high: NumericAttributeValue;
  optimum: NumericAttributeValue;
}

export interface HTMLObjectElementAttributes extends GlobalAttributes, SizeOptions {
  data: string;
  form: string;
  type: string;
  usemap: string;
}

export interface HTMLOListElementAttributes extends GlobalAttributes {
  reversed: BooleanAttributeValue;
  start: NumericAttributeValue;
  type: ListStyleType;
}

export interface HTMLOptGroupElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  label: string;
}

export interface HTMLOptionElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  label: string;
  selected: BooleanAttributeValue;
  value: string;
}

export interface HTMLOutputElementAttributes extends GlobalAttributes {
  for: string;
  form: string;
  name: string;
}

export interface HTMLProgressElementAttributes extends GlobalAttributes {
  max: NumericAttributeValue;
  value: NumericAttributeValue;
}

export interface HTMLQuoteElementAttributes extends GlobalAttributes {
  cite: string;
}

export interface HTMLScriptElementAttributes extends GlobalAttributes, ExperimentalImportance {
  async: BooleanAttributeValue;
  crossorigin: CORSOptions;
  defer: BooleanAttributeValue;
  integrity: string;
  nomodule: BooleanAttributeValue;
  nonce: string;
  referrerpolicy: ReferrerPolicyOptions;
  src: string;
  type: string;
  blocking: string;
}

export interface HTMLSelectElementAttributes extends GlobalAttributes {
  autocomplete: AutoCompleteHints;
  autofocus: BooleanAttributeValue;
  disabled: BooleanAttributeValue;
  form: string;
  multiple: BooleanAttributeValue;
  name: string;
  required: BooleanAttributeValue;
  size: NumericAttributeValue;
}

export interface HTMLSlotElementAttributes extends GlobalAttributes {
  name: string;
}

export interface HTMLSourceElementAttributes extends GlobalAttributes, SizeOptions {
  type: string;
  src: string;
  srcset: string;
  sizes: string;
  media: string;
}

export interface HTMLStyleElementAttributes extends GlobalAttributes {
  media: string;
  nonce: string;
  title: string;
  blocking: string;
}

export interface HTMLTDElementAttributes extends GlobalAttributes {
  colspan: NumericAttributeValue;
  headers: string;
  rowspan: NumericAttributeValue;
}

export interface HTMLTextAreaElementAttributes extends GlobalAttributes {
  autocomplete: AutoCompleteSwitch;
  autofocus: BooleanAttributeValue;
  cols: NumericAttributeValue;
  disabled: BooleanAttributeValue;
  form: string;
  maxlength: NumericAttributeValue;
  minlength: NumericAttributeValue;
  name: string;
  placeholder: string;
  readonly: BooleanAttributeValue;
  required: BooleanAttributeValue;
  rows: NumericAttributeValue;
  wrap: EnumeratedValues<"hard" | "soft">;
}

export interface HTMLTHElementAttributes extends GlobalAttributes {
  abbr: string;
  colspan: NumericAttributeValue;
  headers: string;
  rowspan: NumericAttributeValue;
  scope: EnumeratedValues<"row" | "col" | "rowgroup" | "colgroup">;
}

export interface HTMLTimeElementAttributes extends GlobalAttributes {
  datetime: string;
}

export interface HTMLTrackElementAttributes extends GlobalAttributes {
  default: BooleanAttributeValue;
  kind: EnumeratedValues<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
  label: string;
  src: string;
  srclang: string;
}

export interface HTMLVideoElementAttributes extends GlobalAttributes, SizeOptions, PlayerAttributes {
  /**
   * @experimental
   */
  autopictureinpicture: BooleanAttributeValue;
  /**
   * @experimental
   */
  disablepictureinpicture: BooleanAttributeValue;
  playsinline: BooleanAttributeValue;
  poster: string;
}
//#endregion

//#region MathML

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/MathML/Global_attributes
 */
export interface MathMLGlobalAttributes {
  class: string;
  dir: EnumeratedValues<"ltr" | "rtl">;
  displaystyle: BooleanAttributeValue;
  id: string;
  mathbackground: string;
  mathcolor: string;
  mathsize: string;
  mathvariant: EnumeratedValues<
    | "normal"
    | "bold"
    | "italic"
    | "bold-italic"
    | "double-struck"
    | "bold-fraktur"
    | "script"
    | "bold-script"
    | "fraktur"
    | "sans-serif"
    | "bold-sans-serif"
    | "sans-serif-italic"
    | "sans-serif-bold-italic"
    | "monospace"
    | "initial"
    | "tailed"
    | "looped"
    | "stretched"
  >;
  nonce: string;
  scriptlevel: `${"+" | "-" | ""}${number}`;
  style: string;
  tabindex: NumericAttributeValue;
}

/**
 * `<math>`
 */
export interface MathElementAttributes extends MathMLGlobalAttributes {
  display: EnumeratedValues<"block" | "inline">;
}

//#region Token elements

/**
 * `<mi>`
 */
export interface MathIdentifierAttributes extends MathMLGlobalAttributes {}

/**
 * `<mn>`
 */
export interface MathNumericAttributes extends MathMLGlobalAttributes {}

/**
 * `<mo>`
 */
export interface MathOperatorAttributes extends MathMLGlobalAttributes {
  fence: BooleanAttributeValue;
  largeop: BooleanAttributeValue;
  lspace: string;
  maxsize: string;
  minsize: string;
  movablelimits: BooleanAttributeValue;
  rspace: string;
  separator: BooleanAttributeValue;
  stretchy: BooleanAttributeValue;
  symmetric: BooleanAttributeValue;
}

/**
 * `<ms>`
 */
export interface MathStringAttributes extends MathMLGlobalAttributes {
  /**
   * @deprecated
   */
  lquote: string;
  /**
   * @deprecated
   */
  rquote: string;
}

/**
 * `<mspace>`
 */
export interface MathSpaceAttributes extends MathMLGlobalAttributes {
  depth: string;
  height: string;
  width: string;
}

/**
 * `<mtext>`
 */
export interface MathTextAttributes extends MathMLGlobalAttributes {}

//#endregion

//#region General layout

/**
 * `<merror>`
 */
export interface MathErrorAttributes extends MathMLGlobalAttributes {}

/**
 * `<mfrac>`
 */
export interface MathFractionAttributes extends MathMLGlobalAttributes {
  linethickness: string;
}

/**
 * `<mpadded>`
 */
export interface MathPaddedAttributes extends MathMLGlobalAttributes {
  depth: string;
  height: string;
  lspace: string;
  voffset: string;
  width: string;
}

/**
 * `<mphantom>`
 */
export interface MathPhantomAttributes extends MathMLGlobalAttributes {}

/**
 * `<mroot>`
 */
export interface MathRootAttributes extends MathMLGlobalAttributes {}

/**
 * `<mrow>`
 */
export interface MathRowAttributes extends MathMLGlobalAttributes {}
/**
 * `<msqrt>`
 */
export interface MathSquareRootAttributes extends MathMLGlobalAttributes {}
/**
 * `<mstyle>`
 */
export interface MathStyleAttributes extends MathMLGlobalAttributes {}

//#endregion

//#region Script and limit elements

/**
 * `<mmultiscripts>`
 */
export interface MathMultipleScriptsAttributes extends MathMLGlobalAttributes {}

/**
 * `<mover>`
 */
export interface MathOverAttributes extends MathMLGlobalAttributes {
  accent: BooleanAttributeValue;
}

/**
 * `<mprescripts>`
 */
export interface MathPrescriptAttributes extends MathMLGlobalAttributes {}
/**
 * `<msub>`
 */
export interface MathSubscriptAttributes extends MathMLGlobalAttributes {}
/**
 * `<msubsup>`
 */
export interface MathSubscriptAndSuperscriptAttributes extends MathMLGlobalAttributes {}

/**
 * `<msup>`
 */
export interface MathSuperscriptAttributes extends MathMLGlobalAttributes {}

/**
 * `<munder>`
 */
export interface MathUnderAttributes extends MathMLGlobalAttributes {
  accentunder: BooleanAttributeValue;
}

/**
 * `<munderover>`
 */
export interface MathUnderAndOverAttributes extends MathMLGlobalAttributes {
  accent: BooleanAttributeValue;
  accentunder: BooleanAttributeValue;
}

//#endregion

//#region Tabular math

/**
 * `<mtable>`
 */
export interface MathTableAttributes extends MathMLGlobalAttributes {}

/**
 * `<mtd>`
 */
export interface MathTableCellAttributes extends MathMLGlobalAttributes {}

/**
 * `<mtr>`
 */
export interface MathTableRowAttributes extends MathMLGlobalAttributes {
  columnspan: NumericAttributeValue;
  rowspan: NumericAttributeValue;
}

//#endregion

//#region Semantic annotations

/**
 * `<annotation>`, `<annotation-xml>`, `<semantics>`
 */
export interface MathSemanticsAttributes extends MathMLGlobalAttributes {
  encoding: EnumeratedValues<
    | "application/mathml-presentation+xml"
    | "MathML-Presentation"
    | "SVG1.1"
    | "text/html"
    | "image/svg+xml"
    | "application/xml"
  >;
}

export interface MathMLElementAllAttributes
  extends MathMLGlobalAttributes,
    MathSemanticsAttributes,
    MathElementAttributes,
    MathErrorAttributes,
    MathFractionAttributes,
    MathIdentifierAttributes,
    MathMultipleScriptsAttributes,
    MathNumericAttributes,
    MathOperatorAttributes,
    MathOverAttributes,
    MathPaddedAttributes,
    MathPhantomAttributes,
    MathRootAttributes,
    MathRowAttributes,
    MathStringAttributes,
    MathSpaceAttributes,
    MathSquareRootAttributes,
    MathStyleAttributes,
    MathSubscriptAttributes,
    MathSubscriptAndSuperscriptAttributes,
    MathSuperscriptAttributes,
    MathTableAttributes,
    MathTableCellAttributes,
    MathTextAttributes,
    MathTableRowAttributes,
    MathUnderAttributes,
    MathUnderAndOverAttributes {}

//#endregion

//#endregion

//#region SVG shared attributes
export interface SVGCoreAttributes {
  id: string;
  lang: string;
  tabIndex: string;
  "xml:base": string;
  "xml:lang": string;
  /** @deprecated */
  "xml:space": EnumeratedValues<"default" | "preserve">;
}

export interface StylingAttributes {
  class: string;
  style: string;
}

export interface PresentationAttributes {
  "clip-path": string;
  "clip-rule": string;
  color: string;
  "color-interpolation": string;
  cursor: string;
  display: string;
  fill: string;
  "fill-opacity": string;
  "fill-rule": string;
  filter: string;
  mask: string;
  opacity: string;
  "pointer-events": string;
  "shape-rendering": string;
  stroke: string;
  "stroke-dasharray": string;
  "stroke-dashoffset": string;
  "stroke-linecap": EnumeratedValues<"butt" | "round" | "square" | "inherit">;
  "stroke-linejoin": EnumeratedValues<"miter" | "round" | "bevel" | "inherit">;
  "stroke-miterlimit": string;
  "stroke-opacity": string;
  "stroke-width": string;
  transform: string;
  "vector-effect": string;
  visibility: string;
}

export interface AnimationTimingAttributes {
  begin: string;
  dur: string;
  end: string;
  min: string;
  max: string;
  restart: string;
  repeatCount: string;
  repeatDur: string;
  fill: string;
}

export interface AnimationValueAttributes {
  calcMode: string;
  values: string;
  keyTimes: string;
  keySplines: string;
  from: string;
  to: string;
  by: string;
}

export interface AnimationAdditionAttributes {
  additive: string;
  accumulate: string;
}
export interface DocumentEventAttributes {
  onabort: string;
  onerror: string;
  onresize: string;
  onscroll: string;
  onunload: string;
}

export interface DocumentElementEventAttributes {
  oncopy: string;
  oncut: string;
  onpaste: string;
}

export interface SVGGlobalEventAttributes {
  oncancel: string;
  oncanplay: string;
  oncanplaythrough: string;
  onchange: string;
  onclick: string;
  onclose: string;
  oncuechange: string;
  ondblclick: string;
  ondrag: string;
  ondragend: string;
  ondragenter: string;
  ondragleave: string;
  ondragover: string;
  ondragstart: string;
  ondrop: string;
  ondurationchange: string;
  onemptied: string;
  onended: string;
  onerror: string;
  onfocus: string;
  oninput: string;
  oninvalid: string;
  onkeydown: string;
  onkeypress: string;
  onkeyup: string;
  onload: string;
  onloadeddata: string;
  onloadedmetadata: string;
  onloadstart: string;
  onmousedown: string;
  onmouseenter: string;
  onmouseleave: string;
  onmousemove: string;
  onmouseout: string;
  onmouseover: string;
  onmouseup: string;
  onmousewheel: string;
  onpause: string;
  onplay: string;
  onplaying: string;
  onprogress: string;
  onratechange: string;
  onreset: string;
  onresize: string;
  onscroll: string;
  onseeked: string;
  onseeking: string;
  onselect: string;
  onshow: string;
  onstalled: string;
  onsubmit: string;
  onsuspend: string;
  ontimeupdate: string;
  ontoggle: string;
  onvolumechange: string;
  onwaiting: string;
}

export interface AnimationAttributeTargetAttributes {
  /** @deprecated */
  attributeType: string;
  attributeName: string;
}

export interface ConditionalProcessingAttributes {
  systemLanguage: string;
}

export interface GraphicalEventAttributes {
  onactivate: string;
  onfocusin: string;
  onfocusout: string;
}

type BlendMode = EnumeratedValues<
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity"
>;

type InOrIn2Attributes = EnumeratedValues<
  "SourceGraphic" | "SourceAlpha" | "BackgroundImage" | "BackgroundAlpha" | "FillPaint" | "StrokePaint"
>;

export interface SVGFilterAttributes {
  width: string;
  height: string;
  x: string;
  y: string;
  result: string;
}

export interface TransferFunctionAttributes {
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
  tableValues: string;
  /** @deprecated */
  slope: string;
  intercept: string;
  amplitude: string;
  exponent: string;
}
//#endregion

//#region SVG attributes
export interface SVGAElementAttributes
  extends Omit<HTMLAnchorElementAttributes, keyof GlobalAttributes>,
    SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes {}

export interface SVGAnimateElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    AnimationTimingAttributes,
    AnimationValueAttributes,
    AnimationAdditionAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {}
export interface SVGAnimateMotionElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    AnimationTimingAttributes,
    AnimationValueAttributes,
    AnimationAdditionAttributes,
    AnimationAttributeTargetAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {
  keyPoints: string;
  path: string;
  rotate: string;
}
export interface SVGAnimateTransformElementAttributes
  extends ConditionalProcessingAttributes,
    SVGCoreAttributes,
    AnimationAttributeTargetAttributes,
    AnimationTimingAttributes,
    AnimationValueAttributes,
    AnimationAdditionAttributes {
  by: string;
  from: string;
  to: string;
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
}
export interface SVGCircleElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  cx: string;
  cy: string;
  r: string;
  pathLength: string;
}
export interface SVGClipPathElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes {
  clipPathUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
}
export interface SVGDefsElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes,
    GraphicalEventAttributes {}
export interface SVGDescElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {}
export interface SVGDiscardElementAttributes
  extends ConditionalProcessingAttributes,
    SVGCoreAttributes,
    PresentationAttributes {
  begin: string;
  href: string;
}
export interface SVGEllipseElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  cx: string;
  cy: string;
  rx: string;
  ry: string;
  pathLength: string;
}
export interface SVGFEBlendElementAttributes
  extends SVGCoreAttributes,
    PresentationAttributes,
    SVGFilterAttributes,
    StylingAttributes {
  in: InOrIn2Attributes;
  in2: InOrIn2Attributes;
  mode: BlendMode;
}
export interface SVGFEColorMatrixElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
  values: string;
}
export interface SVGFEComponentTransferElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
}
export interface SVGFECompositeElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  in2: InOrIn2Attributes;
  operator: EnumeratedValues<"over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic">;
  k1: string;
  k2: string;
  k3: string;
  k4: string;
}
export interface SVGFEConvolveMatrixElementAttributes
  extends SVGCoreAttributes,
    PresentationAttributes,
    SVGFilterAttributes,
    StylingAttributes {
  in: InOrIn2Attributes;
  order: string;
  kernelMatrix: string;
  divisor: string;
  bias: string;
  targetX: string;
  targetY: string;
  edgeMode: EnumeratedValues<"duplicate" | "wrap" | "none">;
  /** @deprecated */
  kernelUnitLength: string;
  preserveAlpha: EnumeratedValues<"true" | "false">;
}
export interface SVGFEDiffuseLightingElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  surfaceScale: string;
  diffuseConstant: string;
  /** @deprecated */
  kernelUnitLength: string;
}
export interface SVGFEDisplacementMapElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  in2: InOrIn2Attributes;
  scale: string;
  xChannelSelector: EnumeratedValues<"R" | "G" | "B" | "A">;
  yChannelSelector: EnumeratedValues<"R" | "G" | "B" | "A">;
}
export interface SVGFEDistantLightElementAttributes extends SVGCoreAttributes {
  azimuth: string;
  elevation: string;
}
export interface SVGFEDropShadowElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    SVGFilterAttributes,
    PresentationAttributes {
  dx: string;
  dy: string;
  stdDeviation: string;
}
export interface SVGFEFloodElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  "flood-color": string;
  "flood-opacity": string;
}
export interface SVGFEFuncAElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
export interface SVGFEFuncBElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
export interface SVGFEFuncGElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
export interface SVGFEFuncRElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
export interface SVGFEGaussianBlurElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  stdDeviation: string;
  edgeMode: EnumeratedValues<"duplicate" | "wrap" | "none">;
}
export interface SVGFEImageElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  preserveAspectRatio: string;
  "xlink:href": string;
}
export interface SVGFEMergeElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {}
export interface SVGFEMergeNodeElementAttributes extends SVGCoreAttributes {
  in: InOrIn2Attributes;
}
export interface SVGFEMorphologyElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  operator: EnumeratedValues<"over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic">;
  radius: string;
}
export interface SVGFEOffsetElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  dx: string;
  dy: string;
}
export interface SVGFEPointLightElementAttributes extends SVGCoreAttributes {
  x: string;
  y: string;
  z: string;
}
export interface SVGFESpecularLightingElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  surfaceScale: string;
  speculatConstant: string;
  specularExponent: string;
  /** @deprecated */
  kernelUnitLength: string;
}
export interface SVGFESpotLightElementAttributes extends SVGCoreAttributes {
  x: string;
  y: string;
  z: string;
  pointsAtX: string;
  pointsAtY: string;
  pointsAtZ: string;
  specularExponent: string;
  limitingConeAngle: string;
}
export interface SVGFETileElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
}
export interface SVGFETurbulenceElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  baseFrequency: string;
  numOctaves: string;
  seed: string;
  stitchTiles: EnumeratedValues<"noStitch" | "stitch">;
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
}
export interface SVGFilterElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    Omit<SVGFilterAttributes, "result"> {
  filterUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  primitiveUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  "xlink:href": string;
}
export interface SVGForeignObjectElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    Omit<SVGFilterAttributes, "result">,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes,
    DocumentEventAttributes,
    DocumentElementEventAttributes {}
export interface SVGGElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {}
export interface SVGImageElementAttributes
  extends SVGCoreAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    Omit<SVGFilterAttributes, "result">,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  href: string;
  "xlink:href": string;
  preserveAspectRatio: string;
  crossorigin: EnumeratedValues<"anonymous" | "use-credentials" | "">;
}
export interface SVGLineElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  x1: string;
  x2: string;
  y1: string;
  y2: string;
  pathLength: string;
}
export interface SVGLinearGradientElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {
  gradientUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  gradientTransform: string;
  href: string;
  spreadMethod: EnumeratedValues<"pad" | "reflect" | "repeat">;
  x1: string;
  x2: string;
  /** @deprecated */
  "xlink:href": string;
  y1: string;
  y2: string;
}
export interface SVGMarkerElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes {
  markerHeight: string;
  markerUnits: string;
  markerWidth: string;
  orient: string;
  preserveAspectRatio: string;
  refX: string;
  refY: string;
  viewBox: string;
}
export interface SVGMaskElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes {
  width: string;
  height: string;
  maskContentUnits: EnumeratedValues<"userSpaceOnUse" | "userSpaceOnUse">;
  maskUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  x: string;
  y: string;
}
export interface SVGMetadataElementAttributes extends SVGCoreAttributes, SVGGlobalEventAttributes {}
export interface SVGMPathElementAttributes extends SVGCoreAttributes {
  "xlink:href": string;
}
export interface SVGPathElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  d: string;
  pathLength: string;
}
export interface SVGPatternElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes {
  width: string;
  height: string;
  href: string;
  patternContentUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  patternTransform: string;
  patternUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  preserveAspectRatio: string;
  viewBox: string;
  x: string;
  y: string;
}
export interface SVGPolygonElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  points: string;
  pathLength: string;
}
export interface SVGPolylineElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  points: string;
  pathLength: string;
}
export interface SVGRadialGradientElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {
  cx: string;
  xy: string;
  fr: string;
  fx: string;
  fy: string;
  gradientUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  gradientTransform: string;
  href: string;
  r: string;
  spreadMethod: string;
  "xlink:href": string;
}
export interface SVGRectElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  x: string;
  y: string;
  width: string;
  height: string;
  rx: string;
  ry: string;
  pathLength: string;
}
export interface SVGSetElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    AnimationTimingAttributes,
    AnimationAttributeTargetAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {
  to: string;
}
export interface SVGStopElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {
  /** @deprecated */
  offset: string;
  "stop-color": string;
  "stop-opacity": string;
}
export interface SVGSVGElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes,
    DocumentEventAttributes,
    DocumentElementEventAttributes {
  viewBox: string;
  xmlns: string;
  width: string;
  height: string;
  preserveAspectRatio: string;
  "xmlns:xlink": string;
  x: string;
  y: string;
}
export interface SVGSwitchElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    GraphicalEventAttributes {
  transform: string;
}
export interface SVGSymbolElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes,
    GraphicalEventAttributes {
  width: string;
  height: string;
  preserveAspectRatio: string;
  refX: string;
  refY: string;
  viewBox: string;
  x: string;
  y: string;
}
export interface SVGTextElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  "font-family": string;
  "font-size": string;
  "font-size-adjust": string;
  "font-stretch": string;
  "font-style": string;
  "font-variant": string;
  "font-weight": string;
  x: string;
  y: string;
  dx: string;
  dy: string;
  rotate: string;
  lengthAdjust: EnumeratedValues<"pacing" | "spacingAndGlyphs">;
  textLength: string;
}
export interface SVGTextPathElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  href: string;
  lengthAdjust: EnumeratedValues<"pacing" | "spacingAndGlyphs">;
  method: EnumeratedValues<"align" | "stretch">;
  /** @experimental */
  path: string;
  /** @experimental */
  side: EnumeratedValues<"left" | "right">;
  spacing: EnumeratedValues<"auto" | "exact">;
  startOffset: string;
  textLength: string;
}
export interface SVGTitleElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    SVGGlobalEventAttributes,
    DocumentElementEventAttributes {}
export interface SVGTSpanElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  x: string;
  y: string;
  dx: string;
  dy: string;
  rotate: string;
  lengthAdjust: EnumeratedValues<"pacing" | "spacingAndGlyphs">;
  textLength: string;
}
export interface SVGUseElementAttributes
  extends SVGCoreAttributes,
    AriaAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes,
    GraphicalEventAttributes {
  href: string;
  /** @deprecated  */
  "xlink:href": string;
  x: string;
  y: string;
  width: string;
  height: string;
}
export interface SVGViewElementAttributes extends SVGCoreAttributes, SVGGlobalEventAttributes {
  viewBox: string;
  preserveAspectRatio: string;
}

//#endregion

//#region Element attribute mapping entries union
type AttributeEntries =
  | [HTMLAnchorElement, HTMLAnchorElementAttributes]
  | [HTMLElement, GlobalAttributes]
  | [HTMLAreaElement, HTMLAreaElementAttributes]
  | [HTMLAudioElement, HTMLAudioElementAttributes]
  | [HTMLQuoteElement, HTMLQuoteElementAttributes]
  | [HTMLBRElement, GlobalAttributes]
  | [HTMLButtonElement, HTMLButtonElementAttributes]
  | [HTMLCanvasElement, HTMLCanvasElementAttributes]
  | [HTMLTableCaptionElement, GlobalAttributes]
  | [HTMLTableColElement, HTMLTableColElementAttributes]
  | [HTMLDataElement, HTMLDataElementAttributes]
  | [HTMLDataListElement, GlobalAttributes]
  | [HTMLModElement, HTMLModElementAttributes]
  | [HTMLDetailsElement, HTMLDetailsElementAttributes]
  | [HTMLDialogElement, HTMLDialogElementAttributes]
  | [HTMLDivElement, GlobalAttributes]
  | [HTMLDListElement, GlobalAttributes]
  | [HTMLEmbedElement, HTMLEmbedElementAttributes]
  | [HTMLFieldSetElement, HTMLFieldSetElementAttributes]
  | [HTMLFormElement, HTMLFormElementAttributes]
  | [HTMLHeadingElement, GlobalAttributes]
  | [HTMLHeadElement, GlobalAttributes]
  | [HTMLIFrameElement, HTMLIFrameElementAttributes]
  | [HTMLImageElement, HTMLImageElementAttributes]
  | [HTMLInputElement, HTMLInputElementAttributes]
  | [HTMLLabelElement, HTMLLabelElementAttributes]
  | [HTMLLIElement, HTMLLIElementAttributes]
  | [HTMLLinkElement, HTMLLinkElementAttributes]
  | [HTMLMapElement, HTMLMapElementAttributes]
  | [HTMLMenuElement, GlobalAttributes]
  | [HTMLMeterElement, HTMLMeterElementAttributes]
  | [HTMLObjectElement, HTMLObjectElementAttributes]
  | [HTMLOListElement, HTMLOListElementAttributes]
  | [HTMLOptGroupElement, HTMLOptGroupElementAttributes]
  | [HTMLOptionElement, HTMLOptionElementAttributes]
  | [HTMLOutputElement, HTMLOutputElementAttributes]
  | [HTMLParagraphElement, GlobalAttributes]
  | [HTMLPictureElement, GlobalAttributes]
  | [HTMLPreElement, GlobalAttributes]
  | [HTMLProgressElement, HTMLProgressElementAttributes]
  | [HTMLScriptElement, HTMLScriptElementAttributes]
  | [HTMLSelectElement, HTMLSelectElementAttributes]
  | [HTMLSlotElement, HTMLSlotElementAttributes]
  | [HTMLSourceElement, HTMLSourceElementAttributes]
  | [HTMLSpanElement, GlobalAttributes]
  | [HTMLStyleElement, HTMLStyleElementAttributes]
  | [HTMLTableElement, GlobalAttributes]
  | [HTMLTableSectionElement, GlobalAttributes]
  | [HTMLTableCellElement, HTMLTHElementAttributes | HTMLTDElementAttributes]
  | [HTMLTemplateElement, GlobalAttributes]
  | [HTMLTextAreaElement, HTMLTextAreaElementAttributes]
  | [HTMLTimeElement, HTMLTimeElementAttributes]
  | [HTMLTableRowElement, GlobalAttributes]
  | [HTMLTrackElement, HTMLTrackElementAttributes]
  | [HTMLUListElement, GlobalAttributes]
  | [HTMLVideoElement, HTMLVideoElementAttributes]
  | [MathMLElement, MathMLElementAllAttributes]
  | [SVGAElement, SVGAElementAttributes]
  | [SVGAnimateElement, SVGAnimateElementAttributes]
  | [SVGAnimateMotionElement, SVGAnimateMotionElementAttributes]
  | [SVGAnimateTransformElement, SVGAnimateTransformElementAttributes]
  | [SVGCircleElement, SVGCircleElementAttributes]
  | [SVGClipPathElement, SVGClipPathElementAttributes]
  | [SVGDefsElement, SVGDefsElementAttributes]
  | [SVGDescElement, SVGDescElementAttributes]
  | [SVGEllipseElement, SVGEllipseElementAttributes]
  | [SVGFEBlendElement, SVGFEBlendElementAttributes]
  | [SVGFEColorMatrixElement, SVGFEColorMatrixElementAttributes]
  | [SVGFEComponentTransferElement, SVGFEComponentTransferElementAttributes]
  | [SVGFECompositeElement, SVGFECompositeElementAttributes]
  | [SVGFEConvolveMatrixElement, SVGFEConvolveMatrixElementAttributes]
  | [SVGFEDiffuseLightingElement, SVGFEDiffuseLightingElementAttributes]
  | [SVGFEDisplacementMapElement, SVGFEDisplacementMapElementAttributes]
  | [SVGFEDistantLightElement, SVGFEDistantLightElementAttributes]
  | [SVGFEDropShadowElement, SVGFEDropShadowElementAttributes]
  | [SVGFEFloodElement, SVGFEFloodElementAttributes]
  | [SVGFEFuncAElement, SVGFEFuncAElementAttributes]
  | [SVGFEFuncBElement, SVGFEFuncBElementAttributes]
  | [SVGFEFuncGElement, SVGFEFuncGElementAttributes]
  | [SVGFEFuncRElement, SVGFEFuncRElementAttributes]
  | [SVGFEGaussianBlurElement, SVGFEGaussianBlurElementAttributes]
  | [SVGFEImageElement, SVGFEImageElementAttributes]
  | [SVGFEMergeElement, SVGFEMergeElementAttributes]
  | [SVGFEMergeNodeElement, SVGFEMergeNodeElementAttributes]
  | [SVGFEMorphologyElement, SVGFEMorphologyElementAttributes]
  | [SVGFEOffsetElement, SVGFEOffsetElementAttributes]
  | [SVGFEPointLightElement, SVGFEPointLightElementAttributes]
  | [SVGFESpecularLightingElement, SVGFESpecularLightingElementAttributes]
  | [SVGFESpotLightElement, SVGFESpotLightElementAttributes]
  | [SVGFETileElement, SVGFETileElementAttributes]
  | [SVGFETurbulenceElement, SVGFETurbulenceElementAttributes]
  | [SVGFilterElement, SVGFilterElementAttributes]
  | [SVGForeignObjectElement, SVGForeignObjectElementAttributes]
  | [SVGGElement, SVGGElementAttributes]
  | [SVGImageElement, SVGImageElementAttributes]
  | [SVGLineElement, SVGLineElementAttributes]
  | [SVGLinearGradientElement, SVGLinearGradientElementAttributes]
  | [SVGMarkerElement, SVGMarkerElementAttributes]
  | [SVGMaskElement, SVGMaskElementAttributes]
  | [SVGMetadataElement, SVGMetadataElementAttributes]
  | [SVGMPathElement, SVGMPathElementAttributes]
  | [SVGPathElement, SVGPathElementAttributes]
  | [SVGPatternElement, SVGPatternElementAttributes]
  | [SVGPolygonElement, SVGPolygonElementAttributes]
  | [SVGPolylineElement, SVGPolylineElementAttributes]
  | [SVGRadialGradientElement, SVGRadialGradientElementAttributes]
  | [SVGRectElement, SVGRectElementAttributes]
  | [SVGScriptElement, HTMLScriptElementAttributes]
  | [SVGSetElement, SVGSetElementAttributes]
  | [SVGStopElement, SVGStopElementAttributes]
  | [SVGStyleElement, HTMLStyleElementAttributes]
  | [SVGSVGElement, SVGSVGElementAttributes]
  | [SVGSwitchElement, SVGSwitchElementAttributes]
  | [SVGSymbolElement, SVGSymbolElementAttributes]
  | [SVGTextElement, SVGTextElementAttributes]
  | [SVGTextPathElement, SVGTextPathElementAttributes]
  | [SVGTitleElement, SVGTitleElementAttributes]
  | [SVGTSpanElement, SVGTSpanElementAttributes]
  | [SVGUseElement, SVGUseElementAttributes]
  | [SVGViewElement, SVGViewElementAttributes];

//#endregion
declare global {
  namespace JSX {
    type Element = Mountable<any>;
    type ElementType = string | ((props: any) => Element) | (new (props?: any) => ClassComponentInstance);
    interface JSXTypeConfig {}
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicClassAttributes<T extends ClassComponentInstance<PropsBase, string>>
      extends ClassComponentNativeAttributes<T> {
      ref?: Later<T>;
      // [attribute: AttributePattern]: BindingPattern<AttributeInterpolation>;
      [attribute: AttributePattern]: BindingPattern<AttributeInterpolation>;
    }
    type JSXEventHandlerAttributes<E extends globalThis.Element> = {
      [K in keyof KnownEventMap as `on${Capitalize<K>}`]?: Handler<E, KnownEventMap[K]>;
    };

    type JSXAttributes<T extends {}, E extends globalThis.Element> = {
      [K in keyof T]?: BindingPattern<T[K] | undefined | null>;
    } & ElementAttributes<E> &
      JSX.IntrinsicAttributes &
      JSXEventHandlerAttributes<E> & {
        /**
         * Custom event handlers.
         */
        [event: EventPattern]: Handler<E, any>;
        /**
         * Allow any custom attributes.
         */
        [key: string]: unknown;
      };

    type ClassComponentNativeAttributes<T> = {
      [K in keyof GlobalAttributes as `attr:${K}`]?: BindingPattern<GlobalAttributes[K]>;
    };

    interface JSXHTMLElements {
      a: JSXAttributes<HTMLAnchorElementAttributes, HTMLAnchorElement>;
      abbr: JSXAttributes<GlobalAttributes, HTMLElement>;
      address: JSXAttributes<GlobalAttributes, HTMLElement>;
      area: JSXAttributes<HTMLAreaElementAttributes, HTMLAreaElement>;
      article: JSXAttributes<GlobalAttributes, HTMLElement>;
      aside: JSXAttributes<GlobalAttributes, HTMLElement>;
      audio: JSXAttributes<HTMLAudioElementAttributes, HTMLAudioElement>;
      b: JSXAttributes<GlobalAttributes, HTMLElement>;
      bdi: JSXAttributes<GlobalAttributes, HTMLElement>;
      bdo: JSXAttributes<GlobalAttributes, HTMLElement>;
      blockquote: JSXAttributes<GlobalAttributes, HTMLQuoteElement>;
      br: JSXAttributes<GlobalAttributes, HTMLBRElement>;
      button: JSXAttributes<HTMLButtonElementAttributes, HTMLButtonElement>;
      canvas: JSXAttributes<HTMLCanvasElementAttributes, HTMLCanvasElement>;
      caption: JSXAttributes<GlobalAttributes, HTMLTableCaptionElement>;
      cite: JSXAttributes<GlobalAttributes, HTMLElement>;
      code: JSXAttributes<GlobalAttributes, HTMLElement>;
      col: JSXAttributes<HTMLTableColElementAttributes, HTMLTableColElement>;
      colgroup: JSXAttributes<HTMLTableColElementAttributes, HTMLTableColElement>;
      data: JSXAttributes<HTMLDataElementAttributes, HTMLDataElement>;
      datalist: JSXAttributes<GlobalAttributes, HTMLDataListElement>;
      dd: JSXAttributes<GlobalAttributes, HTMLElement>;
      del: JSXAttributes<HTMLModElementAttributes, HTMLModElement>;
      details: JSXAttributes<HTMLDetailsElementAttributes, HTMLDetailsElement>;
      dfn: JSXAttributes<GlobalAttributes, HTMLElement>;
      dialog: JSXAttributes<HTMLDialogElementAttributes, HTMLDialogElement>;
      div: JSXAttributes<GlobalAttributes, HTMLDivElement>;
      dl: JSXAttributes<GlobalAttributes, HTMLDListElement>;
      dt: JSXAttributes<GlobalAttributes, HTMLElement>;
      em: JSXAttributes<GlobalAttributes, HTMLElement>;
      embed: JSXAttributes<HTMLEmbedElementAttributes, HTMLEmbedElement>;
      fieldset: JSXAttributes<HTMLFieldSetElementAttributes, HTMLFieldSetElement>;
      figcaption: JSXAttributes<GlobalAttributes, HTMLElement>;
      figure: JSXAttributes<GlobalAttributes, HTMLElement>;
      footer: JSXAttributes<GlobalAttributes, HTMLElement>;
      form: JSXAttributes<HTMLFormElementAttributes, HTMLFormElement>;
      h1: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      h2: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      h3: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      h4: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      h5: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      h6: JSXAttributes<GlobalAttributes, HTMLHeadingElement>;
      head: JSXAttributes<GlobalAttributes, HTMLHeadElement>;
      header: JSXAttributes<GlobalAttributes, HTMLElement>;
      hgroup: JSXAttributes<GlobalAttributes, HTMLElement>;
      hr: JSXAttributes<GlobalAttributes, HTMLElement>;
      i: JSXAttributes<GlobalAttributes, HTMLElement>;
      iframe: JSXAttributes<HTMLIFrameElementAttributes, HTMLIFrameElement>;
      img: JSXAttributes<HTMLImageElementAttributes, HTMLImageElement>;
      input: JSXAttributes<
        JSXTypeConfig extends { strictInput: boolean } ? InputAttributes : HTMLInputElementAttributes,
        HTMLInputElement
      > &
        InputDirectives;
      ins: JSXAttributes<HTMLModElementAttributes, HTMLModElement>;
      kbd: JSXAttributes<GlobalAttributes, HTMLElement>;
      label: JSXAttributes<HTMLLabelElementAttributes, HTMLLabelElement>;
      legend: JSXAttributes<GlobalAttributes, HTMLElement>;
      li: JSXAttributes<HTMLLIElementAttributes, HTMLLIElement>;
      link: JSXAttributes<HTMLLinkElementAttributes, HTMLLinkElement>;
      main: JSXAttributes<GlobalAttributes, HTMLElement>;
      map: JSXAttributes<HTMLMapElementAttributes, HTMLMapElement>;
      mark: JSXAttributes<GlobalAttributes, HTMLElement>;
      menu: JSXAttributes<GlobalAttributes, HTMLMenuElement>;
      meter: JSXAttributes<HTMLMeterElementAttributes, HTMLMeterElement>;
      nav: JSXAttributes<GlobalAttributes, HTMLElement>;
      noscript: JSXAttributes<GlobalAttributes, HTMLElement>;
      object: JSXAttributes<HTMLObjectElementAttributes, HTMLObjectElement>;
      ol: JSXAttributes<HTMLOListElementAttributes, HTMLOListElement>;
      optgroup: JSXAttributes<HTMLOptGroupElementAttributes, HTMLOptGroupElement>;
      option: JSXAttributes<HTMLOptionElementAttributes, HTMLOptionElement>;
      output: JSXAttributes<HTMLOutputElementAttributes, HTMLOutputElement>;
      p: JSXAttributes<GlobalAttributes, HTMLParagraphElement>;
      picture: JSXAttributes<GlobalAttributes, HTMLPictureElement>;
      pre: JSXAttributes<GlobalAttributes, HTMLPreElement>;
      progress: JSXAttributes<HTMLProgressElementAttributes, HTMLProgressElement>;
      q: JSXAttributes<HTMLQuoteElementAttributes, HTMLQuoteElement>;
      rp: JSXAttributes<GlobalAttributes, HTMLElement>;
      rt: JSXAttributes<GlobalAttributes, HTMLElement>;
      ruby: JSXAttributes<GlobalAttributes, HTMLElement>;
      s: JSXAttributes<GlobalAttributes, HTMLElement>;
      samp: JSXAttributes<GlobalAttributes, HTMLElement>;
      script: JSXAttributes<HTMLScriptElementAttributes, HTMLScriptElement>;
      section: JSXAttributes<GlobalAttributes, HTMLElement>;
      select: JSXAttributes<HTMLSelectElementAttributes, HTMLSelectElement> & SelectDirectives;
      slot: JSXAttributes<HTMLSlotElementAttributes, HTMLSlotElement>;
      small: JSXAttributes<GlobalAttributes, HTMLElement>;
      source: JSXAttributes<HTMLSourceElementAttributes, HTMLSourceElement>;
      span: JSXAttributes<GlobalAttributes, HTMLSpanElement>;
      strong: JSXAttributes<GlobalAttributes, HTMLElement>;
      style: JSXAttributes<HTMLStyleElementAttributes, HTMLStyleElement>;
      sub: JSXAttributes<GlobalAttributes, HTMLElement>;
      summary: JSXAttributes<GlobalAttributes, HTMLElement>;
      sup: JSXAttributes<GlobalAttributes, HTMLElement>;
      table: JSXAttributes<GlobalAttributes, HTMLTableElement>;
      tbody: JSXAttributes<GlobalAttributes, HTMLTableSectionElement>;
      td: JSXAttributes<HTMLTDElementAttributes, HTMLTableCellElement>;
      template: JSXAttributes<GlobalAttributes, HTMLTemplateElement>;
      textarea: JSXAttributes<HTMLTextAreaElementAttributes, HTMLTextAreaElement> & TextareaDirectives;
      tfoot: JSXAttributes<GlobalAttributes, HTMLTableSectionElement>;
      th: JSXAttributes<HTMLTHElementAttributes, HTMLTableCellElement>;
      thead: JSXAttributes<GlobalAttributes, HTMLTableSectionElement>;
      time: JSXAttributes<HTMLTimeElementAttributes, HTMLTimeElement>;
      tr: JSXAttributes<GlobalAttributes, HTMLTableRowElement>;
      track: JSXAttributes<HTMLTrackElementAttributes, HTMLTrackElement>;
      u: JSXAttributes<GlobalAttributes, HTMLElement>;
      ul: JSXAttributes<GlobalAttributes, HTMLUListElement>;
      var: JSXAttributes<GlobalAttributes, HTMLElement>;
      video: JSXAttributes<HTMLVideoElementAttributes, HTMLVideoElement>;
      wbr: JSXAttributes<GlobalAttributes, HTMLElement>;
    }
    interface JSXMathMLElements {
      annotation: JSXAttributes<MathSemanticsAttributes, MathMLElement>;
      "annotation-xml": JSXAttributes<MathSemanticsAttributes, MathMLElement>;
      math: JSXAttributes<MathElementAttributes, MathMLElement>;
      merror: JSXAttributes<MathErrorAttributes, MathMLElement>;
      mfrac: JSXAttributes<MathFractionAttributes, MathMLElement>;
      mi: JSXAttributes<MathIdentifierAttributes, MathMLElement>;
      mmultiscripts: JSXAttributes<MathMultipleScriptsAttributes, MathMLElement>;
      mn: JSXAttributes<MathNumericAttributes, MathMLElement>;
      mo: JSXAttributes<MathOperatorAttributes, MathMLElement>;
      mover: JSXAttributes<MathOverAttributes, MathMLElement>;
      mpadded: JSXAttributes<MathPaddedAttributes, MathMLElement>;
      mphantom: JSXAttributes<MathPhantomAttributes, MathMLElement>;
      mroot: JSXAttributes<MathRootAttributes, MathMLElement>;
      mrow: JSXAttributes<MathRowAttributes, MathMLElement>;
      ms: JSXAttributes<MathStringAttributes, MathMLElement>;
      mspace: JSXAttributes<MathSpaceAttributes, MathMLElement>;
      msqrt: JSXAttributes<MathSquareRootAttributes, MathMLElement>;
      mstyle: JSXAttributes<MathStyleAttributes, MathMLElement>;
      msub: JSXAttributes<MathSubscriptAttributes, MathMLElement>;
      msubsup: JSXAttributes<MathSubscriptAndSuperscriptAttributes, MathMLElement>;
      msup: JSXAttributes<MathSuperscriptAttributes, MathMLElement>;
      mtable: JSXAttributes<MathTableAttributes, MathMLElement>;
      mtd: JSXAttributes<MathTableCellAttributes, MathMLElement>;
      mtext: JSXAttributes<MathTextAttributes, MathMLElement>;
      mtr: JSXAttributes<MathTableRowAttributes, MathMLElement>;
      munder: JSXAttributes<MathUnderAttributes, MathMLElement>;
      munderover: JSXAttributes<MathUnderAndOverAttributes, MathMLElement>;
      semantics: JSXAttributes<MathSemanticsAttributes, MathMLElement>;
    }
    interface JSXSVGElements {
      animate: JSXAttributes<SVGAnimateElementAttributes, SVGAnimateElement>;
      animateMotion: JSXAttributes<SVGAnimateMotionElementAttributes, SVGAnimateMotionElement>;
      animateTransform: JSXAttributes<SVGAnimateTransformElementAttributes, SVGAnimateTransformElement>;
      circle: JSXAttributes<SVGCircleElementAttributes, SVGCircleElement>;
      clipPath: JSXAttributes<SVGClipPathElementAttributes, SVGClipPathElement>;
      defs: JSXAttributes<SVGDefsElementAttributes, SVGDefsElement>;
      desc: JSXAttributes<SVGDescElementAttributes, SVGDescElement>;
      /** @experimental */
      discard: JSXAttributes<SVGDiscardElementAttributes, SVGElement>;
      ellipse: JSXAttributes<SVGEllipseElementAttributes, SVGEllipseElement>;
      feblend: JSXAttributes<SVGFEBlendElementAttributes, SVGFEBlendElement>;
      feColorMatrix: JSXAttributes<SVGFEColorMatrixElementAttributes, SVGFEColorMatrixElement>;
      feComponentTransfer: JSXAttributes<SVGFEComponentTransferElementAttributes, SVGFEComponentTransferElement>;
      feComposite: JSXAttributes<SVGFECompositeElementAttributes, SVGFECompositeElement>;
      feConvolveMatrix: JSXAttributes<SVGFEConvolveMatrixElementAttributes, SVGFEConvolveMatrixElement>;
      feDiffuseLighting: JSXAttributes<SVGFEDiffuseLightingElementAttributes, SVGFEDiffuseLightingElement>;
      feDisplacementMap: JSXAttributes<SVGFEDisplacementMapElementAttributes, SVGFEDisplacementMapElement>;
      feDistantLight: JSXAttributes<SVGFEDistantLightElementAttributes, SVGFEDistantLightElement>;
      feDropShadow: JSXAttributes<SVGFEDropShadowElementAttributes, SVGFEDropShadowElement>;
      feFlood: JSXAttributes<SVGFEFloodElementAttributes, SVGFEFloodElement>;
      feFuncA: JSXAttributes<SVGFEFuncAElementAttributes, SVGFEFuncAElement>;
      feFuncB: JSXAttributes<SVGFEFuncBElementAttributes, SVGFEFuncBElement>;
      feFuncG: JSXAttributes<SVGFEFuncGElementAttributes, SVGFEFuncGElement>;
      feFuncR: JSXAttributes<SVGFEFuncRElementAttributes, SVGFEFuncRElement>;
      feGaussianBlur: JSXAttributes<SVGFEGaussianBlurElementAttributes, SVGFEGaussianBlurElement>;
      feImage: JSXAttributes<SVGFEImageElementAttributes, SVGFEImageElement>;
      feMerge: JSXAttributes<SVGFEMergeElementAttributes, SVGFEMergeElement>;
      feMergeNode: JSXAttributes<SVGFEMergeNodeElementAttributes, SVGFEMergeElement>;
      feMorphology: JSXAttributes<SVGFEMorphologyElementAttributes, SVGFEMorphologyElement>;
      feOffset: JSXAttributes<SVGFEOffsetElementAttributes, SVGFEOffsetElement>;
      fePointLight: JSXAttributes<SVGFEPointLightElementAttributes, SVGFEPointLightElement>;
      feSpecularLighting: JSXAttributes<SVGFESpecularLightingElementAttributes, SVGFESpecularLightingElement>;
      feSpotLight: JSXAttributes<SVGFESpotLightElementAttributes, SVGFESpotLightElement>;
      feTile: JSXAttributes<SVGFETileElementAttributes, SVGFETileElement>;
      feTurbulence: JSXAttributes<SVGFETurbulenceElementAttributes, SVGFETurbulenceElement>;
      filter: JSXAttributes<SVGFilterElementAttributes, SVGFilterElement>;
      foreignObject: JSXAttributes<SVGForeignObjectElementAttributes, SVGForeignObjectElement>;
      g: JSXAttributes<SVGGElementAttributes, SVGGElement>;
      image: JSXAttributes<SVGImageElementAttributes, SVGImageElement>;
      line: JSXAttributes<SVGLineElementAttributes, SVGLineElement>;
      linearGradient: JSXAttributes<SVGLinearGradientElementAttributes, SVGLinearGradientElement>;
      marker: JSXAttributes<SVGMarkerElementAttributes, SVGMarkerElement>;
      mask: JSXAttributes<SVGMaskElementAttributes, SVGMaskElement>;
      metadata: JSXAttributes<SVGMetadataElementAttributes, SVGMetadataElement>;
      mpath: JSXAttributes<SVGMPathElementAttributes, SVGMPathElement>;
      path: JSXAttributes<SVGPathElementAttributes, SVGPathElement>;
      pattern: JSXAttributes<SVGPatternElementAttributes, SVGPatternElement>;
      polygon: JSXAttributes<SVGPolygonElementAttributes, SVGPolygonElement>;
      polyline: JSXAttributes<SVGPolylineElementAttributes, SVGPolylineElement>;
      radialGradient: JSXAttributes<SVGRadialGradientElementAttributes, SVGRadialGradientElement>;
      rect: JSXAttributes<SVGRectElementAttributes, SVGRectElement>;
      set: JSXAttributes<SVGSetElementAttributes, SVGSetElement>;
      stop: JSXAttributes<SVGStopElementAttributes, SVGStopElement>;
      svg: JSXAttributes<SVGSVGElementAttributes, SVGSVGElement>;
      switch: JSXAttributes<SVGSwitchElementAttributes, SVGSwitchElement>;
      symbol: JSXAttributes<SVGSymbolElementAttributes, SVGSymbolElement>;
      text: JSXAttributes<SVGTextElementAttributes, SVGTextElement>;
      textPath: JSXAttributes<SVGTextPathElementAttributes, SVGTextPathElement>;
      /**
       * `<title>` is only considered to be used in SVG.
       */
      title: JSXAttributes<SVGTitleElementAttributes, SVGTitleElement>;
      tspan: JSXAttributes<SVGTSpanElementAttributes, SVGTSpanElement>;
      use: JSXAttributes<SVGUseElementAttributes, SVGUseElement>;
      view: JSXAttributes<SVGViewElementAttributes, SVGViewElement>;
    }

    interface IntrinsicElements extends JSXHTMLElements, JSXSVGElements, JSXMathMLElements {}

    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
