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

export type FunctionalEventHanlder<T extends EventTarget, E extends Event> = (this: T, e: E) => any;

export interface ObjectEventHandler<E extends Event> {
  handleEvent(event: E): void;
}

export type Handler<T extends EventTarget, E extends Extract<keyof EventMap<T>, string>> =
  | FunctionalEventHanlder<T, Extract<EventMap<T>[E], Event>>
  | ObjectEventHandler<Extract<EventMap<T>[E], Event>>;

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

type EnumeratedValues<E extends string> = E | (string & {});

type ElementAttributes<E extends Element> = {
  ref?: Later<E>;
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

export interface GlobalAttributes extends HTMLGlobalEventAttributes {
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

export interface HTMLTextAreaElementAttributes extends Omit<GlobalAttributes, "spellcheck"> {
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
    StylingAttributes,
    ConditionalProcessingAttributes,
    SVGGlobalEventAttributes {}

export interface SVGAnimateElementAttributes
  extends StylingAttributes,
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
  heigth: string;
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
    type JSXEventHandlerAttributes<E extends globalThis.Element> = {
      [K in Extract<keyof EventMap<E>, string> as `on${Capitalize<K>}`]?: Handler<E, K>;
    };

    type JSXAttributes<T extends {}, E extends globalThis.Element> = {
      [K in keyof T]?: T[K] | Subscribable<T[K]>;
    } & ElementAttributes<E> &
      JSX.IntrinsicAttributes &
      JSXEventHandlerAttributes<E> & {
        /**
         * Allow any custom attributes.
         */
        [key: string]: unknown;
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
      >;
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
      select: JSXAttributes<HTMLSelectElementAttributes, HTMLSelectElement>;
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
      textarea: JSXAttributes<HTMLTextAreaElementAttributes, HTMLTextAreaElement>;
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

    interface IntrinsicElements extends JSXHTMLElements, JSXSVGElements {}

    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
