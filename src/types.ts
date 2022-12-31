/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * `NaN` cannot represented in TypeScript types.
 * @see https://developer.mozilla.org/en-US/docs/Glossary/Falsy
 */
export type Falsy = false | undefined | void | null | "" | 0 | -0 | 0n;

export type AnyFunc = (...args: any[]) => any;

export type CleanUpFunc = () => void;

// @ts-ignore unused type parameter for geneic extension
export interface Subscribable<T> {}

export type SubscribeFunc = <T>(subscribable: Subscribable<T>, subscriber: Subscriber<T>) => CleanUpFunc;

export type SubscribableTester = (value: unknown) => value is Subscribable<unknown>;

export interface Query<T extends unknown> {
  readonly val: T;
}

export interface Source<T extends unknown> extends Query<T> {
  set(newVal: T): void;
}

export type Subscriber<T extends unknown> = (latest: T) => void;

export interface Later<E extends {}> {
  current: E | null;
}

/**
 * Should return true if the two value is treated as same.
 */
export type Differ = <T>(a: T, b: T) => boolean;

export type TextInterpolation = string | number | bigint | boolean;

export type AttributeInterpolation = string | number | boolean | undefined | null;

export type AttributesMap<T> = AttributeEntries extends infer P ? (P extends [T, infer A] ? A : never) : never;

export type EventMap<T extends EventTarget> = T extends HTMLElement
  ? HTMLElementEventMap
  : T extends SVGElement
  ? SVGElementEventMap
  : T extends XMLHttpRequestEventTarget
  ? XMLHttpRequestEventMap
  : never;

export type Handler<T extends EventTarget, E extends Extract<keyof EventMap<T>, string>> = (
  this: T,
  e: EventMap<T>[E]
) => any;

export type Events<T extends EventTarget> = Extract<keyof EventMap<T>, string>;

export type EventHost<T extends EventTarget> = <E extends Events<T>>(
  name: E,
  handler: Handler<T, E>,
  options?: boolean | EventListenerOptions
) => CleanUpFunc;

export interface Hooks {
  /**
   * Get the cleanup collector function.
   */
  useCleanUpCollector(): (cleanup: CleanUpFunc) => CleanUpFunc;
  /**
   * Get the hosting element of the component instance.
   */
  useHost(): ParentNode;
  /**
   * Get the parent element of the component instance.
   */
  useParent(): Element;
}

export interface HyplateElement<T> extends HTMLElement {
  readonly exposed: T;
}

export type SlotContent = Element | DocumentFragment | Mountable<any>;

/**
 * Slot name map for
 */
export type SlotMap<S extends string = string> = [S] extends [never] ? undefined : Partial<Record<S, SlotContent>>;

export type ExposeBase = {} | void;

export type PropsBase = {};

export type Mountable<E extends ExposeBase> = (attach: AttachFunc) => Rendered<E>;

export type ConditionalMountable<Test, E extends ExposeBase> = (
  attach: AttachFunc,
  value: Exclude<Test, Falsy>
) => Rendered<E>;

export type WithChildren<C> = { children: C };

export type WithRef<E extends {}> = { ref: Later<E> };

export type Props<P extends PropsBase, C = undefined, E = undefined> = Omit<P, "children" | "ref"> &
  (C extends undefined ? Partial<WithChildren<C>> : WithChildren<C>) &
  (E extends {} ? Partial<WithRef<E>> : {});

export type FunctionalComponent<P extends PropsBase = PropsBase, C = undefined, E extends ExposeBase = void> = (
  props: Props<P, C, E>
) => Mountable<E>;

export type ContextFactory<Context extends {}> = (fragment: DocumentFragment) => Context;

export type ContextSetupFactory<Context extends {}, S extends SlotMap> = <P extends PropsBase, E extends ExposeBase>(
  setup?: (props: P, context: Context) => E,
  name?: string
) => FunctionalComponent<P, undefined | S, E>;

export interface TemplateContext<R> {
  refs: R;
}

export interface FunctionalComponentTemplateFactory {
  <S extends string = never>(input: string | HTMLTemplateElement): <P extends PropsBase, E extends ExposeBase>(
    setup?: (props: P) => E,
    name?: string
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
export type AttachFunc = (el: Node) => Element;

export type GetRange = () => readonly [Node, Node] | undefined | void;

export type Rendered<E extends ExposeBase> = [unmount: CleanUpFunc, exposed: E, range: GetRange];

//#region JSX types
type ArrayOr<T> = T | T[];

export type JSXChild = JSX.Element | Node | TextInterpolation | Subscribable<TextInterpolation>;

export type JSXChildNode = ArrayOr<JSXChild>;

type GeneralAttributeType = string | number | boolean | undefined | null;

type GeneralAttributes<K extends string> = {
  [P in K]: GeneralAttributeType;
};

type BooleanAttributes<K extends string> = {
  [P in K]: BooleanAttributeValue;
};

type EnumeratedValues<E extends string> = E | (string & {});

type ElementAttributes<E extends Element> = {
  ref?: Later<E>;
};

type Attributes<T extends {}, E extends Element> = {
  [K in keyof T]?: T[K] | Subscribable<T[K]>;
} & ElementAttributes<E> &
  JSX.IntrinsicAttributes;

type _EventName<E extends string> = E extends `on${infer e}` ? e : never;

type FunctionalGlobalEventHandler = {
  [K in keyof GlobalEventHandlers as `on${Capitalize<_EventName<K>>}`]: (
    event: Parameters<Extract<GlobalEventHandlers[K], (...args: any[]) => any>>[0]
  ) => void;
};

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
interface FormElementAttributes {
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
type InputTypes =
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
  | "week";
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
interface PlayerAttributes {
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
interface GlobalAttributes
  //#region general attributes
  extends GeneralAttributes<
      | "accesskey"
      | "class"
      | `data-${string}`
      | "enterkeyhint"
      | "id"
      | "is"
      | "itemid"
      | "itemprop"
      | "itemref"
      | "itemscope"
      | "itemtype"
      | "lang"
      | "nonce"
      | "onabort"
      | "onautocomplete"
      | "onautocompleteerror"
      | "onblur"
      | "oncancel"
      | "oncanplay"
      | "oncanplaythrough"
      | "onchange"
      | "onclick"
      | "onclose"
      | "oncontextmenu"
      | "oncuechange"
      | "ondblclick"
      | "ondrag"
      | "ondragend"
      | "ondragenter"
      | "ondragleave"
      | "ondragover"
      | "ondragstart"
      | "ondrop"
      | "ondurationchange"
      | "onemptied"
      | "onended"
      | "onerror"
      | "onfocus"
      | "oninput"
      | "oninvalid"
      | "onkeydown"
      | "onkeypress"
      | "onkeyup"
      | "onload"
      | "onloadeddata"
      | "onloadedmetadata"
      | "onloadstart"
      | "onmousedown"
      | "onmouseenter"
      | "onmouseleave"
      | "onmousemove"
      | "onmouseout"
      | "onmouseover"
      | "onmouseup"
      | "onmousewheel"
      | "onpause"
      | "onplay"
      | "onplaying"
      | "onprogress"
      | "onratechange"
      | "onreset"
      | "onresize"
      | "onscroll"
      | "onseeked"
      | "onseeking"
      | "onselect"
      | "onshow"
      | "onsort"
      | "onstalled"
      | "onsubmit"
      | "onsuspend"
      | "ontimeupdate"
      | "ontoggle"
      | "onvolumechange"
      | "onwaiting"
      | "part"
      | "title"
    >,
    //#endregion
    BooleanAttributes<"autofocus" | "contenteditable" | "draggable" | "inert" | "spellcheck">,
    FunctionalGlobalEventHandler {
  /** @deprecated */
  "xml:lang": string;
  /** @deprecated */
  "xml:base": string;
  autocapitalize: EnumeratedValues<"off" | "none" | "on" | "sentences" | "words" | "characters">;
  /** @deprecated */
  contextmenu: GeneralAttributeType;
  dir: EnumeratedValues<"ltr" | "rtl" | "auto">;
  /** @experimental */
  exportparts: GeneralAttributeType;
  hidden: EnumeratedValues<"" | "hidden" | "until-found">;
  inputmode: EnumeratedValues<"none" | "text" | "decimal" | "numeric" | "tel" | "search" | "email" | "url">;
  //#region ARIA role
  role: EnumeratedValues<
    | "alert"
    | "alertdialog"
    | "application"
    | "article"
    | "banner"
    | "button"
    | "cell"
    | "checkbox"
    | "columnheader"
    | "combobox"
    | "complementary"
    | "contentinfo"
    | "definition"
    | "dialog"
    | "directory"
    | "document"
    | "feed"
    | "figure"
    | "form"
    | "grid"
    | "gridcell"
    | "group"
    | "heading"
    | "img"
    | "link"
    | "list"
    | "listbox"
    | "listitem"
    | "log"
    | "main"
    | "marquee"
    | "math"
    | "menu"
    | "menubar"
    | "menuitem"
    | "menuitemcheckbox"
    | "menuitemradio"
    | "meter"
    | "navigation"
    | "none"
    | "note"
    | "option"
    | "presentation"
    | "progressbar"
    | "radio"
    | "radiogroup"
    | "region"
    | "row"
    | "rowgroup"
    | "rowheader"
    | "scrollbar"
    | "search"
    | "searchbox"
    | "separator"
    | "slider"
    | "spinbutton"
    | "status"
    | "switch"
    | "tab"
    | "table"
    | "tablist"
    | "tabpanel"
    | "term"
    | "textbox"
    | "timer"
    | "toolbar"
    | "tooltip"
    | "tree"
    | "treegrid"
    | "treeitem"
  >;
  //#endregion
  /**
   * `slot` is handled. Do not use.
   */
  slot: never;
  style: string;
  tabindex: number;
  translate: EnumeratedValues<"yes" | "no">;
  [ariaAttributes: `aria-${string}`]: string;
  [dataAttributes: `data-${string}`]: string;
  /**
   * Allow any attributes.
   */
  [key: string]: unknown;
}
//#endregion

//#region HTML attributes
interface HTMLAnchorElementAttributes extends GlobalAttributes {
  download: string;
  href: string;
  hreflang: string;
  ping: string;
  referrerpolicy: ReferrerPolicyOptions;
  rel: string;
  target: TargetOptions;
  type: string;
}

interface HTMLAreaElementAttributes extends GlobalAttributes {
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

interface HTMLAudioElementAttributes extends GlobalAttributes, PlayerAttributes {}

interface HTMLButtonElementAttributes extends GlobalAttributes, FormElementAttributes {
  type: EnumeratedValues<"submit" | "reset" | "button" | "menu">;
}

interface HTMLCanvasElementAttributes extends GlobalAttributes, SizeOptions {}

interface HTMLTableColElementAttributes extends GlobalAttributes {
  span: NumericAttributeValue;
}

interface HTMLDataElementAttributes extends GlobalAttributes {
  value: string;
}

interface HTMLModElementAttributes extends GlobalAttributes {
  cite: string;
  datatime: string;
}

interface HTMLDetailsElementAttributes extends GlobalAttributes {
  open: BooleanAttributeValue;
}

interface HTMLDialogElementAttributes extends Omit<GlobalAttributes, "tabindex"> {
  open: BooleanAttributeValue;
}

interface HTMLEmbedElementAttributes extends GlobalAttributes, SizeOptions {
  src: string;
  type: string;
}

interface HTMLFieldSetElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  form: string;
  name: string;
}

interface HTMLFormElementAttributes extends GlobalAttributes {
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

interface HTMLIFrameElementAttributes extends GlobalAttributes, ExperimentalImportance, SizeOptions {
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

interface HTMLImageElementAttributes extends GlobalAttributes, ExperimentalImportance, SizeOptions {
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

interface HTMLInputElementAttributes extends GlobalAttributes, FormElementAttributes {
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

interface HTMLLabelElementAttributes extends GlobalAttributes {
  for: string;
}

interface HTMLLIElementAttributes extends GlobalAttributes {
  value: NumericAttributeValue;
  /**
   * @deprecated
   */
  type: ListStyleType;
}

interface HTMLLinkElementAttributes extends GlobalAttributes, ExperimentalImportance {
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

interface HTMLMapElementAttributes extends GlobalAttributes {
  name: string;
}

interface HTMLMeterElementAttributes extends GlobalAttributes {
  value: NumericAttributeValue;
  min: NumericAttributeValue;
  max: NumericAttributeValue;
  low: NumericAttributeValue;
  high: NumericAttributeValue;
  optimum: NumericAttributeValue;
}

interface HTMLObjectElementAttributes extends GlobalAttributes, SizeOptions {
  data: string;
  form: string;
  type: string;
  usemap: string;
}

interface HTMLOListElementAttributes extends GlobalAttributes {
  reversed: BooleanAttributeValue;
  start: NumericAttributeValue;
  type: ListStyleType;
}

interface HTMLOptGroupElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  label: string;
}

interface HTMLOptionElementAttributes extends GlobalAttributes {
  disabled: BooleanAttributeValue;
  label: string;
  selected: BooleanAttributeValue;
  value: string;
}

interface HTMLOutputElementAttributes extends GlobalAttributes {
  for: string;
  form: string;
  name: string;
}

interface HTMLProgressElementAttributes extends GlobalAttributes {
  max: NumericAttributeValue;
  value: NumericAttributeValue;
}

interface HTMLQuoteElementAttributes extends GlobalAttributes {
  cite: string;
}

interface HTMLScriptElementAttributes extends GlobalAttributes, ExperimentalImportance {
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

interface HTMLSelectElementAttributes extends GlobalAttributes {
  autocomplete: AutoCompleteHints;
  autofocus: BooleanAttributeValue;
  disabled: BooleanAttributeValue;
  form: string;
  multiple: BooleanAttributeValue;
  name: string;
  required: BooleanAttributeValue;
  size: NumericAttributeValue;
}

interface HTMLSlotElementAttributes extends GlobalAttributes {
  name: string;
}

interface HTMLSourceElementAttributes extends GlobalAttributes, SizeOptions {
  type: string;
  src: string;
  srcset: string;
  sizes: string;
  media: string;
}

interface HTMLStyleElementAttributes extends GlobalAttributes {
  media: string;
  nonce: string;
  title: string;
  blocking: string;
}

interface HTMLTDElementAttributes extends GlobalAttributes {
  colspan: NumericAttributeValue;
  headers: string;
  rowspan: NumericAttributeValue;
}

interface HTMLTextAreaElementAttributes extends Omit<GlobalAttributes, "spellcheck"> {
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
  spellcheck: BooleanAttributeValue | "default";
  wrap: EnumeratedValues<"hard" | "soft">;
}

interface HTMLTHElementAttributes extends GlobalAttributes {
  abbr: string;
  colspan: NumericAttributeValue;
  headers: string;
  rowspan: NumericAttributeValue;
  scope: EnumeratedValues<"row" | "col" | "rowgroup" | "colgroup">;
}

interface HTMLTimeElementAttributes extends GlobalAttributes {
  datetime: string;
}

interface HTMLTrackElementAttributes extends GlobalAttributes {
  default: BooleanAttributeValue;
  kind: EnumeratedValues<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
  label: string;
  src: string;
  srclang: string;
}

interface HTMLVideoElementAttributes extends GlobalAttributes, SizeOptions, PlayerAttributes {
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

//#region SVG shared attributes
interface SVGCoreAttributes {
  id: string;
  lang: string;
  tabIndex: string;
  "xml:base": string;
  "xml:lang": string;
  /** @deprecated */
  "xml:space": EnumeratedValues<"default" | "preserve">;
  /**
   * Allow any attributes.
   */
  [key: string]: unknown;
}

interface StylingAttributes {
  class: string;
  style: string;
}

interface PresentationAttributes {
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

interface AnimationTimingAttributes {
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

interface AnimationValueAttributes {
  calcMode: string;
  values: string;
  keyTimes: string;
  keySplines: string;
  from: string;
  to: string;
  by: string;
}

interface AnimationAdditionAttributes {
  additive: string;
  accumulate: string;
}
interface DocumentEventAttributes
  extends GeneralAttributes<"onabort" | "onerror" | "onresize" | "onscroll" | "onunload">,
    FunctionalGlobalEventHandler {}

type FunctionalDocumentElementEventHandler = {
  [K in keyof DocumentAndElementEventHandlers as `on${Capitalize<_EventName<K>>}`]: (
    event: Parameters<Extract<DocumentAndElementEventHandlers[K], (...args: any[]) => any>>[0]
  ) => void;
};

interface DocumentElementEventAttributes
  extends GeneralAttributes<"oncopy" | "oncut" | "onpaste">,
    FunctionalDocumentElementEventHandler {}

interface GlobalEventAttributes
  extends GeneralAttributes<
      | "oncancel"
      | "oncanplay"
      | "oncanplaythrough"
      | "onchange"
      | "onclick"
      | "onclose"
      | "oncuechange"
      | "ondblclick"
      | "ondrag"
      | "ondragend"
      | "ondragenter"
      | "ondragleave"
      | "ondragover"
      | "ondragstart"
      | "ondrop"
      | "ondurationchange"
      | "onemptied"
      | "onended"
      | "onerror"
      | "onfocus"
      | "oninput"
      | "oninvalid"
      | "onkeydown"
      | "onkeypress"
      | "onkeyup"
      | "onload"
      | "onloadeddata"
      | "onloadedmetadata"
      | "onloadstart"
      | "onmousedown"
      | "onmouseenter"
      | "onmouseleave"
      | "onmousemove"
      | "onmouseout"
      | "onmouseover"
      | "onmouseup"
      | "onmousewheel"
      | "onpause"
      | "onplay"
      | "onplaying"
      | "onprogress"
      | "onratechange"
      | "onreset"
      | "onresize"
      | "onscroll"
      | "onseeked"
      | "onseeking"
      | "onselect"
      | "onshow"
      | "onstalled"
      | "onsubmit"
      | "onsuspend"
      | "ontimeupdate"
      | "ontoggle"
      | "onvolumechange"
      | "onwaiting"
    >,
    FunctionalGlobalEventHandler {}

interface AnimationAttributeTargetAttributes {
  /** @deprecated */
  attributeType: string;
  attributeName: string;
}

interface ConditionalProcessingAttributes {
  systemLanguage: string;
}

interface GraphicalEventAttributes
  extends GeneralAttributes<"onactivate" | "onfocusin" | "onfocusout">,
    FunctionalDocumentElementEventHandler {}

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

interface SVGFilterAttributes {
  width: string;
  height: string;
  x: string;
  y: string;
  result: string;
}

interface TransferFunctionAttributes {
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
interface SVGAElementAttributes
  extends Omit<HTMLAnchorElementAttributes, "lang" | keyof GlobalAttributes>,
    SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes {}

interface SVGAnimateElementAttributes
  extends StylingAttributes,
    AnimationTimingAttributes,
    AnimationValueAttributes,
    AnimationAdditionAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {}
interface SVGAnimateMotionElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    AnimationTimingAttributes,
    AnimationValueAttributes,
    AnimationAdditionAttributes,
    AnimationAttributeTargetAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {
  keyPoints: string;
  path: string;
  rotate: string;
}
interface SVGAnimateTransformElementAttributes
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
interface SVGCircleElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  cx: string;
  cy: string;
  r: string;
  pathLength: string;
}
interface SVGClipPathElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes {
  clipPathUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
}
interface SVGDefsElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes,
    GraphicalEventAttributes {}
interface SVGDescElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {}
interface SVGDiscardElementAttributes
  extends ConditionalProcessingAttributes,
    SVGCoreAttributes,
    PresentationAttributes {
  begin: string;
  href: string;
}
interface SVGEllipseElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  cx: string;
  cy: string;
  rx: string;
  ry: string;
  pathLength: string;
}
interface SVGFEBlendElementAttributes
  extends SVGCoreAttributes,
    PresentationAttributes,
    SVGFilterAttributes,
    StylingAttributes {
  in: InOrIn2Attributes;
  in2: InOrIn2Attributes;
  mode: BlendMode;
}
interface SVGFEColorMatrixElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
  values: string;
}
interface SVGFEComponentTransferElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
}
interface SVGFECompositeElementAttributes
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
interface SVGFEConvolveMatrixElementAttributes
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
interface SVGFEDiffuseLightingElementAttributes
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
interface SVGFEDisplacementMapElementAttributes
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
interface SVGFEDistantLightElementAttributes extends SVGCoreAttributes {
  azimuth: string;
  elevation: string;
}
interface SVGFEDropShadowElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    SVGFilterAttributes,
    PresentationAttributes {
  dx: string;
  dy: string;
  stdDeviation: string;
}
interface SVGFEFloodElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  "flood-color": string;
  "flood-opacity": string;
}
interface SVGFEFuncAElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
interface SVGFEFuncBElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
interface SVGFEFuncGElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
interface SVGFEFuncRElementAttributes extends SVGCoreAttributes, TransferFunctionAttributes {}
interface SVGFEGaussianBlurElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  stdDeviation: string;
  edgeMode: EnumeratedValues<"duplicate" | "wrap" | "none">;
}
interface SVGFEImageElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  preserveAspectRatio: string;
  "xlink:href": string;
}
interface SVGFEMergeElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {}
interface SVGFEMergeNodeElementAttributes extends SVGCoreAttributes {
  in: InOrIn2Attributes;
}
interface SVGFEMorphologyElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  operator: EnumeratedValues<"over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic">;
  radius: string;
}
interface SVGFEOffsetElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
  dx: string;
  dy: string;
}
interface SVGFEPointLightElementAttributes extends SVGCoreAttributes {
  x: string;
  y: string;
  z: string;
}
interface SVGFESpecularLightingElementAttributes
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
interface SVGFESpotLightElementAttributes extends SVGCoreAttributes {
  x: string;
  y: string;
  z: string;
  pointsAtX: string;
  pointsAtY: string;
  pointsAtZ: string;
  specularExponent: string;
  limitingConeAngle: string;
}
interface SVGFETileElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    SVGFilterAttributes {
  in: InOrIn2Attributes;
}
interface SVGFETurbulenceElementAttributes
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
interface SVGFilterElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    Omit<SVGFilterAttributes, "result"> {
  filterUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  primitiveUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
  "xlink:href": string;
}
interface SVGForeignObjectElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    Omit<SVGFilterAttributes, "result">,
    GlobalEventAttributes,
    GraphicalEventAttributes,
    DocumentEventAttributes,
    DocumentElementEventAttributes {}
interface SVGGElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {}
interface SVGImageElementAttributes
  extends SVGCoreAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    Omit<SVGFilterAttributes, "result">,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  href: string;
  "xlink:href": string;
  preserveAspectRatio: string;
  crossorigin: EnumeratedValues<"anonymous" | "use-credentials" | "">;
}
interface SVGLineElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  x1: string;
  x2: string;
  y1: string;
  y2: string;
  pathLength: string;
}
interface SVGLinearGradientElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
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
interface SVGMarkerElementAttributes
  extends SVGCoreAttributes,
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
interface SVGMaskElementAttributes
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
interface SVGMetadataElementAttributes extends SVGCoreAttributes, GlobalEventAttributes {}
interface SVGMPathElementAttributes extends SVGCoreAttributes {
  "xlink:href": string;
}
interface SVGPathElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  d: string;
  pathLength: string;
}
interface SVGPatternElementAttributes
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
interface SVGPolygonElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  points: string;
  pathLength: string;
}
interface SVGPolylineElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  points: string;
  pathLength: string;
}
interface SVGRadialGradientElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
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
interface SVGRectElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  x: string;
  y: string;
  width: string;
  height: string;
  rx: string;
  ry: string;
  pathLength: string;
}
interface SVGSetElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    AnimationTimingAttributes,
    AnimationAttributeTargetAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {
  to: string;
}
interface SVGStopElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {
  /** @deprecated */
  offset: string;
  "stop-color": string;
  "stop-opacity": string;
}
interface SVGSVGElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes,
    DocumentEventAttributes,
    DocumentElementEventAttributes {
  viewBox: string;
  xmlns: string;
  width: string;
  heigth: string;
  preserveAspectRatio: string;
  "xmlns:xlink": string;
  x: string;
  y: string;
}
interface SVGSwitchElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    ConditionalProcessingAttributes,
    PresentationAttributes,
    GraphicalEventAttributes {
  transform: string;
}
interface SVGSymbolElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    GlobalEventAttributes,
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
interface SVGTextElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
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
interface SVGTextPathElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
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
interface SVGTitleElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    GlobalEventAttributes,
    DocumentElementEventAttributes {}
interface SVGTSpanElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  x: string;
  y: string;
  dx: string;
  dy: string;
  rotate: string;
  lengthAdjust: EnumeratedValues<"pacing" | "spacingAndGlyphs">;
  textLength: string;
}
interface SVGUseElementAttributes
  extends SVGCoreAttributes,
    StylingAttributes,
    PresentationAttributes,
    ConditionalProcessingAttributes,
    GlobalEventAttributes,
    GraphicalEventAttributes {
  href: string;
  /** @deprecated  */
  "xlink:href": string;
  x: string;
  y: string;
  width: string;
  height: string;
}
interface SVGViewElementAttributes extends SVGCoreAttributes, GlobalEventAttributes {
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
    interface JSXTypeConfig {}
    interface ElementAttributesProperty {
      options: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }

    interface JSXHTMLElements {
      a: Attributes<HTMLAnchorElementAttributes, HTMLAnchorElement>;
      abbr: Attributes<GlobalAttributes, HTMLElement>;
      address: Attributes<GlobalAttributes, HTMLElement>;
      area: Attributes<HTMLAreaElementAttributes, HTMLAreaElement>;
      article: Attributes<GlobalAttributes, HTMLElement>;
      aside: Attributes<GlobalAttributes, HTMLElement>;
      audio: Attributes<HTMLAudioElementAttributes, HTMLAudioElement>;
      b: Attributes<GlobalAttributes, HTMLElement>;
      bdi: Attributes<GlobalAttributes, HTMLElement>;
      bdo: Attributes<GlobalAttributes, HTMLElement>;
      blockquote: Attributes<GlobalAttributes, HTMLQuoteElement>;
      br: Attributes<GlobalAttributes, HTMLBRElement>;
      button: Attributes<HTMLButtonElementAttributes, HTMLButtonElement>;
      canvas: Attributes<HTMLCanvasElementAttributes, HTMLCanvasElement>;
      caption: Attributes<GlobalAttributes, HTMLTableCaptionElement>;
      cite: Attributes<GlobalAttributes, HTMLElement>;
      code: Attributes<GlobalAttributes, HTMLElement>;
      col: Attributes<HTMLTableColElementAttributes, HTMLTableColElement>;
      colgroup: Attributes<HTMLTableColElementAttributes, HTMLTableColElement>;
      data: Attributes<HTMLDataElementAttributes, HTMLDataElement>;
      datalist: Attributes<GlobalAttributes, HTMLDataListElement>;
      dd: Attributes<GlobalAttributes, HTMLElement>;
      del: Attributes<HTMLModElementAttributes, HTMLModElement>;
      details: Attributes<HTMLDetailsElementAttributes, HTMLDetailsElement>;
      dfn: Attributes<GlobalAttributes, HTMLElement>;
      dialog: Attributes<HTMLDialogElementAttributes, HTMLDialogElement>;
      div: Attributes<GlobalAttributes, HTMLDivElement>;
      dl: Attributes<GlobalAttributes, HTMLDListElement>;
      dt: Attributes<GlobalAttributes, HTMLElement>;
      em: Attributes<GlobalAttributes, HTMLElement>;
      embed: Attributes<HTMLEmbedElementAttributes, HTMLEmbedElement>;
      fieldset: Attributes<HTMLFieldSetElementAttributes, HTMLFieldSetElement>;
      figcaption: Attributes<GlobalAttributes, HTMLElement>;
      figure: Attributes<GlobalAttributes, HTMLElement>;
      footer: Attributes<GlobalAttributes, HTMLElement>;
      form: Attributes<HTMLFormElementAttributes, HTMLFormElement>;
      h1: Attributes<GlobalAttributes, HTMLHeadingElement>;
      h2: Attributes<GlobalAttributes, HTMLHeadingElement>;
      h3: Attributes<GlobalAttributes, HTMLHeadingElement>;
      h4: Attributes<GlobalAttributes, HTMLHeadingElement>;
      h5: Attributes<GlobalAttributes, HTMLHeadingElement>;
      h6: Attributes<GlobalAttributes, HTMLHeadingElement>;
      head: Attributes<GlobalAttributes, HTMLHeadElement>;
      header: Attributes<GlobalAttributes, HTMLElement>;
      hgroup: Attributes<GlobalAttributes, HTMLElement>;
      hr: Attributes<GlobalAttributes, HTMLElement>;
      i: Attributes<GlobalAttributes, HTMLElement>;
      iframe: Attributes<HTMLIFrameElementAttributes, HTMLIFrameElement>;
      img: Attributes<HTMLImageElementAttributes, HTMLImageElement>;
      input: Attributes<
        JSXTypeConfig extends { strictInput: boolean } ? InputAttributes : HTMLInputElementAttributes,
        HTMLInputElement
      >;
      ins: Attributes<HTMLModElementAttributes, HTMLModElement>;
      kbd: Attributes<GlobalAttributes, HTMLElement>;
      label: Attributes<HTMLLabelElementAttributes, HTMLLabelElement>;
      legend: Attributes<GlobalAttributes, HTMLElement>;
      li: Attributes<HTMLLIElementAttributes, HTMLLIElement>;
      link: Attributes<HTMLLinkElementAttributes, HTMLLinkElement>;
      main: Attributes<GlobalAttributes, HTMLElement>;
      map: Attributes<HTMLMapElementAttributes, HTMLMapElement>;
      mark: Attributes<GlobalAttributes, HTMLElement>;
      menu: Attributes<GlobalAttributes, HTMLMenuElement>;
      meter: Attributes<HTMLMeterElementAttributes, HTMLMeterElement>;
      nav: Attributes<GlobalAttributes, HTMLElement>;
      noscript: Attributes<GlobalAttributes, HTMLElement>;
      object: Attributes<HTMLObjectElementAttributes, HTMLObjectElement>;
      ol: Attributes<HTMLOListElementAttributes, HTMLOListElement>;
      optgroup: Attributes<HTMLOptGroupElementAttributes, HTMLOptGroupElement>;
      option: Attributes<HTMLOptionElementAttributes, HTMLOptionElement>;
      output: Attributes<HTMLOutputElementAttributes, HTMLOutputElement>;
      p: Attributes<GlobalAttributes, HTMLParagraphElement>;
      picture: Attributes<GlobalAttributes, HTMLPictureElement>;
      pre: Attributes<GlobalAttributes, HTMLPreElement>;
      progress: Attributes<HTMLProgressElementAttributes, HTMLProgressElement>;
      q: Attributes<HTMLQuoteElementAttributes, HTMLQuoteElement>;
      rp: Attributes<GlobalAttributes, HTMLElement>;
      rt: Attributes<GlobalAttributes, HTMLElement>;
      ruby: Attributes<GlobalAttributes, HTMLElement>;
      s: Attributes<GlobalAttributes, HTMLElement>;
      samp: Attributes<GlobalAttributes, HTMLElement>;
      script: Attributes<HTMLScriptElementAttributes, HTMLScriptElement>;
      section: Attributes<GlobalAttributes, HTMLElement>;
      select: Attributes<HTMLSelectElementAttributes, HTMLSelectElement>;
      slot: Attributes<HTMLSlotElementAttributes, HTMLSlotElement>;
      small: Attributes<GlobalAttributes, HTMLElement>;
      source: Attributes<HTMLSourceElementAttributes, HTMLSourceElement>;
      span: Attributes<GlobalAttributes, HTMLSpanElement>;
      strong: Attributes<GlobalAttributes, HTMLElement>;
      style: Attributes<HTMLStyleElementAttributes, HTMLStyleElement>;
      sub: Attributes<GlobalAttributes, HTMLElement>;
      summary: Attributes<GlobalAttributes, HTMLElement>;
      sup: Attributes<GlobalAttributes, HTMLElement>;
      table: Attributes<GlobalAttributes, HTMLTableElement>;
      tbody: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      td: Attributes<HTMLTDElementAttributes, HTMLTableCellElement>;
      template: Attributes<GlobalAttributes, HTMLTemplateElement>;
      textarea: Attributes<HTMLTextAreaElementAttributes, HTMLTextAreaElement>;
      tfoot: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      th: Attributes<HTMLTHElementAttributes, HTMLTableCellElement>;
      thead: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      time: Attributes<HTMLTimeElementAttributes, HTMLTimeElement>;
      tr: Attributes<GlobalAttributes, HTMLTableRowElement>;
      track: Attributes<HTMLTrackElementAttributes, HTMLTrackElement>;
      u: Attributes<GlobalAttributes, HTMLElement>;
      ul: Attributes<GlobalAttributes, HTMLUListElement>;
      var: Attributes<GlobalAttributes, HTMLElement>;
      video: Attributes<HTMLVideoElementAttributes, HTMLVideoElement>;
      wbr: Attributes<GlobalAttributes, HTMLElement>;
    }
    interface JSXSVGElements {
      animate: Attributes<SVGAnimateElementAttributes, SVGAnimateElement>;
      animateMotion: Attributes<SVGAnimateMotionElementAttributes, SVGAnimateMotionElement>;
      animateTransform: Attributes<SVGAnimateTransformElementAttributes, SVGAnimateTransformElement>;
      circle: Attributes<SVGCircleElementAttributes, SVGCircleElement>;
      clipPath: Attributes<SVGClipPathElementAttributes, SVGClipPathElement>;
      defs: Attributes<SVGDefsElementAttributes, SVGDefsElement>;
      desc: Attributes<SVGDescElementAttributes, SVGDescElement>;
      /** @experimental */
      discard: Attributes<SVGDiscardElementAttributes, SVGElement>;
      ellipse: Attributes<SVGEllipseElementAttributes, SVGEllipseElement>;
      feblend: Attributes<SVGFEBlendElementAttributes, SVGFEBlendElement>;
      feColorMatrix: Attributes<SVGFEColorMatrixElementAttributes, SVGFEColorMatrixElement>;
      feComponentTransfer: Attributes<SVGFEComponentTransferElementAttributes, SVGFEComponentTransferElement>;
      feComposite: Attributes<SVGFECompositeElementAttributes, SVGFECompositeElement>;
      feConvolveMatrix: Attributes<SVGFEConvolveMatrixElementAttributes, SVGFEConvolveMatrixElement>;
      feDiffuseLighting: Attributes<SVGFEDiffuseLightingElementAttributes, SVGFEDiffuseLightingElement>;
      feDisplacementMap: Attributes<SVGFEDisplacementMapElementAttributes, SVGFEDisplacementMapElement>;
      feDistantLight: Attributes<SVGFEDistantLightElementAttributes, SVGFEDistantLightElement>;
      feDropShadow: Attributes<SVGFEDropShadowElementAttributes, SVGFEDropShadowElement>;
      feFlood: Attributes<SVGFEFloodElementAttributes, SVGFEFloodElement>;
      feFuncA: Attributes<SVGFEFuncAElementAttributes, SVGFEFuncAElement>;
      feFuncB: Attributes<SVGFEFuncBElementAttributes, SVGFEFuncBElement>;
      feFuncG: Attributes<SVGFEFuncGElementAttributes, SVGFEFuncGElement>;
      feFuncR: Attributes<SVGFEFuncRElementAttributes, SVGFEFuncRElement>;
      feGaussianBlur: Attributes<SVGFEGaussianBlurElementAttributes, SVGFEGaussianBlurElement>;
      feImage: Attributes<SVGFEImageElementAttributes, SVGFEImageElement>;
      feMerge: Attributes<SVGFEMergeElementAttributes, SVGFEMergeElement>;
      feMergeNode: Attributes<SVGFEMergeNodeElementAttributes, SVGFEMergeElement>;
      feMorphology: Attributes<SVGFEMorphologyElementAttributes, SVGFEMorphologyElement>;
      feOffset: Attributes<SVGFEOffsetElementAttributes, SVGFEOffsetElement>;
      fePointLight: Attributes<SVGFEPointLightElementAttributes, SVGFEPointLightElement>;
      feSpecularLighting: Attributes<SVGFESpecularLightingElementAttributes, SVGFESpecularLightingElement>;
      feSpotLight: Attributes<SVGFESpotLightElementAttributes, SVGFESpotLightElement>;
      feTile: Attributes<SVGFETileElementAttributes, SVGFETileElement>;
      feTurbulence: Attributes<SVGFETurbulenceElementAttributes, SVGFETurbulenceElement>;
      filter: Attributes<SVGFilterElementAttributes, SVGFilterElement>;
      foreignObject: Attributes<SVGForeignObjectElementAttributes, SVGForeignObjectElement>;
      g: Attributes<SVGGElementAttributes, SVGGElement>;
      image: Attributes<SVGImageElementAttributes, SVGImageElement>;
      line: Attributes<SVGLineElementAttributes, SVGLineElement>;
      linearGradient: Attributes<SVGLinearGradientElementAttributes, SVGLinearGradientElement>;
      marker: Attributes<SVGMarkerElementAttributes, SVGMarkerElement>;
      mask: Attributes<SVGMaskElementAttributes, SVGMaskElement>;
      metadata: Attributes<SVGMetadataElementAttributes, SVGMetadataElement>;
      mpath: Attributes<SVGMPathElementAttributes, SVGMPathElement>;
      path: Attributes<SVGPathElementAttributes, SVGPathElement>;
      pattern: Attributes<SVGPatternElementAttributes, SVGPatternElement>;
      polygon: Attributes<SVGPolygonElementAttributes, SVGPolygonElement>;
      polyline: Attributes<SVGPolylineElementAttributes, SVGPolylineElement>;
      radialGradient: Attributes<SVGRadialGradientElementAttributes, SVGRadialGradientElement>;
      rect: Attributes<SVGRectElementAttributes, SVGRectElement>;
      set: Attributes<SVGSetElementAttributes, SVGSetElement>;
      stop: Attributes<SVGStopElementAttributes, SVGStopElement>;
      svg: Attributes<SVGSVGElementAttributes, SVGSVGElement>;
      switch: Attributes<SVGSwitchElementAttributes, SVGSwitchElement>;
      symbol: Attributes<SVGSymbolElementAttributes, SVGSymbolElement>;
      text: Attributes<SVGTextElementAttributes, SVGTextElement>;
      textPath: Attributes<SVGTextPathElementAttributes, SVGTextPathElement>;
      /**
       * `<title>` is only considered to be used in SVG.
       */
      title: Attributes<SVGTitleElementAttributes, SVGTitleElement>;
      tspan: Attributes<SVGTSpanElementAttributes, SVGTSpanElement>;
      use: Attributes<SVGUseElementAttributes, SVGUseElement>;
      view: Attributes<SVGViewElementAttributes, SVGViewElement>;
    }

    interface IntrinsicElements extends JSXHTMLElements, JSXSVGElements {}

    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
