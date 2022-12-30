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
export interface Subscribable<T> {

}

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

export type JSXChild = JSX.Element | Node | TextInterpolation | Query<TextInterpolation>;

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
  [K in keyof T]?: T[K] | Query<T[K]>;
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
type ExperimentalImportance = {
  /**
   * @experimental
   */
  importance: EnumeratedValues<"auto" | "high" | "low">;
  /**
   * @experimental
   */
  fetchpriority: EnumeratedValues<"auto" | "high" | "low">;
};
type FormMethods = EnumeratedValues<"post" | "get" | "dialog">;
type FormElementAttributes = {
  autofocus: BooleanAttributeValue;
  disabled: BooleanAttributeValue;
  form: string;
  formaction: string;
  formenctype: EncryptionTypes;
  formmethod: FormMethods;
  formnovalidate: BooleanAttributeValue;
  formtarget: TargetOptions;
  name: string;
  value: string;
};
type SizeOptions = {
  height: NumericAttributeValue;
  width: NumericAttributeValue;
};
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
type ModElementAttributes = {
  cite: string;
  datatime: string;
};
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
type PlayerAttributes = {
  autoplay: BooleanAttributeValue;
  controls: BooleanAttributeValue;
  /**
   * @experimental
   */
  controlslist: string;
  crossorigin: CORSOptions;
  loop: BooleanAttributeValue;
  muted: BooleanAttributeValue;
  preload: EnumeratedValues<"none" | "metadata" | "auto">;
  src: string;
};
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

/** SVG CORE ATTRIBUTES */
type SVGCoreAttributes = {
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
};

type StylingAttributes = {
  class: string;
  style: string;
};

type PresentationAttributes = {
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
};

type AnimationTimingAttributes = {
  begin: string;
  dur: string;
  end: string;
  min: string;
  max: string;
  restart: string;
  repeatCount: string;
  repeatDur: string;
  fill: string;
};

type AnimationValueAttributes = {
  calcMode: string;
  values: string;
  keyTimes: string;
  keySplines: string;
  from: string;
  to: string;
  by: string;
};

type AnimationAdditionAttributes = {
  additive: string;
  accumulate: string;
};
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

type AnimationAttributeTargetAttributes = {
  /** @deprecated */
  attributeType: string;
  attributeName: string;
};

type ConditionalProcessingAttributes = {
  systemLanguage: string;
};

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

type SVGFilterAttributes = {
  width: string;
  height: string;
  x: string;
  y: string;
  result: string;
};

type TransferFunctionAttributes = {
  type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
  tableValues: string;
  /** @deprecated */
  slope: string;
  intercept: string;
  amplitude: string;
  exponent: string;
};

declare global {
  namespace JSX {
    type Element = Mountable<any>;
    interface ElementAttributesProperty {
      options: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }

    interface JSXHTMLElements {
      a: Attributes<
        GlobalAttributes & {
          download: string;
          href: string;
          hreflang: string;
          ping: string;
          referrerpolicy: ReferrerPolicyOptions;
          rel: string;
          target: TargetOptions;
          type: string;
        },
        HTMLAnchorElement
      >;
      abbr: Attributes<GlobalAttributes, HTMLElement>;
      address: Attributes<GlobalAttributes, HTMLElement>;
      area: Attributes<
        GlobalAttributes & {
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
        },
        HTMLAreaElement
      >;
      article: Attributes<GlobalAttributes, HTMLElement>;
      aside: Attributes<GlobalAttributes, HTMLElement>;
      audio: Attributes<
        GlobalAttributes &
          PlayerAttributes & {
            /**
             * @experimental
             */
            disableremoteplayback: BooleanAttributeValue;
          },
        HTMLAudioElement
      >;
      b: Attributes<GlobalAttributes, HTMLElement>;
      bdi: Attributes<GlobalAttributes, HTMLElement>;
      bdo: Attributes<GlobalAttributes, HTMLElement>;
      blockquote: Attributes<GlobalAttributes, HTMLQuoteElement>;
      br: Attributes<GlobalAttributes, HTMLBRElement>;
      button: Attributes<
        GlobalAttributes &
          FormElementAttributes & {
            type: EnumeratedValues<"submit" | "reset" | "button" | "menu">;
          },
        HTMLButtonElement
      >;
      canvas: Attributes<GlobalAttributes & SizeOptions, HTMLCanvasElement>;
      caption: Attributes<GlobalAttributes, HTMLTableCaptionElement>;
      cite: Attributes<GlobalAttributes, HTMLElement>;
      code: Attributes<GlobalAttributes, HTMLElement>;
      col: Attributes<
        GlobalAttributes & {
          span: NumericAttributeValue;
        },
        HTMLTableColElement
      >;
      colgroup: Attributes<
        GlobalAttributes & {
          span: NumericAttributeValue;
        },
        HTMLTableColElement
      >;
      data: Attributes<
        GlobalAttributes & {
          value: string;
        },
        HTMLDataElement
      >;
      datalist: Attributes<GlobalAttributes, HTMLDataListElement>;
      dd: Attributes<GlobalAttributes, HTMLElement>;
      del: Attributes<GlobalAttributes & ModElementAttributes, HTMLModElement>;
      details: Attributes<
        GlobalAttributes & {
          open: BooleanAttributeValue;
        },
        HTMLDetailsElement
      >;
      dfn: Attributes<GlobalAttributes, HTMLElement>;
      dialog: Attributes<
        Omit<GlobalAttributes, "tabindex"> & {
          open: BooleanAttributeValue;
        },
        HTMLDialogElement
      >;
      div: Attributes<GlobalAttributes, HTMLDivElement>;
      dl: Attributes<GlobalAttributes, HTMLDListElement>;
      dt: Attributes<GlobalAttributes, HTMLElement>;
      em: Attributes<GlobalAttributes, HTMLElement>;
      embed: Attributes<
        GlobalAttributes &
          SizeOptions & {
            src: string;
            type: string;
          },
        HTMLEmbedElement
      >;
      fieldset: Attributes<
        GlobalAttributes & {
          disabled: BooleanAttributeValue;
          form: string;
          name: string;
        },
        HTMLFieldSetElement
      >;
      figcaption: Attributes<GlobalAttributes, HTMLElement>;
      figure: Attributes<GlobalAttributes, HTMLElement>;
      footer: Attributes<GlobalAttributes, HTMLElement>;
      form: Attributes<
        GlobalAttributes & {
          "accept-charset": string;
          action: string;
          autocomplete: AutoCompleteSwitch;
          enctype: EncryptionTypes;
          method: FormMethods;
          name: string;
          novalidate: BooleanAttributeValue;
          rel: string;
          target: TargetOptions;
        },
        HTMLFormElement
      >;
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
      iframe: Attributes<
        GlobalAttributes &
          ExperimentalImportance &
          SizeOptions & {
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
          },
        HTMLIFrameElement
      >;
      img: Attributes<
        GlobalAttributes &
          ExperimentalImportance &
          SizeOptions & {
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
          },
        HTMLImageElement
      >;
      input: Attributes<GlobalAttributes & InputAttributes, HTMLInputElement>;
      ins: Attributes<GlobalAttributes & ModElementAttributes, HTMLModElement>;
      kbd: Attributes<GlobalAttributes, HTMLElement>;
      label: Attributes<GlobalAttributes & { for: string }, HTMLLabelElement>;
      legend: Attributes<GlobalAttributes, HTMLElement>;
      li: Attributes<
        GlobalAttributes & {
          value: NumericAttributeValue;
          /**
           * @deprecated
           */
          type: ListStyleType;
        },
        HTMLLIElement
      >;

      link: Attributes<
        GlobalAttributes &
          ExperimentalImportance & {
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
          },
        HTMLLinkElement
      >;
      main: Attributes<GlobalAttributes, HTMLElement>;
      map: Attributes<
        GlobalAttributes & {
          name: string;
        },
        HTMLMapElement
      >;
      mark: Attributes<GlobalAttributes, HTMLElement>;
      menu: Attributes<GlobalAttributes, HTMLMenuElement>;
      meter: Attributes<
        GlobalAttributes & {
          value: NumericAttributeValue;
          min: NumericAttributeValue;
          max: NumericAttributeValue;
          low: NumericAttributeValue;
          high: NumericAttributeValue;
          optimum: NumericAttributeValue;
        },
        HTMLMeterElement
      >;
      nav: Attributes<GlobalAttributes, HTMLElement>;
      noscript: Attributes<GlobalAttributes, HTMLElement>;
      object: Attributes<
        GlobalAttributes &
          SizeOptions & {
            data: string;
            form: string;
            type: string;
            usemap: string;
          },
        HTMLObjectElement
      >;
      ol: Attributes<
        GlobalAttributes & {
          reversed: BooleanAttributeValue;
          start: NumericAttributeValue;
          type: ListStyleType;
        },
        HTMLOListElement
      >;
      optgroup: Attributes<
        GlobalAttributes & {
          disabled: BooleanAttributeValue;
          label: string;
        },
        HTMLOptGroupElement
      >;
      option: Attributes<
        GlobalAttributes & {
          disabled: BooleanAttributeValue;
          label: string;
          selected: BooleanAttributeValue;
          value: string;
        },
        HTMLOptionElement
      >;
      output: Attributes<
        GlobalAttributes & {
          for: string;
          form: string;
          name: string;
        },
        HTMLOutputElement
      >;
      p: Attributes<GlobalAttributes, HTMLParagraphElement>;
      picture: Attributes<GlobalAttributes, HTMLPictureElement>;
      pre: Attributes<GlobalAttributes, HTMLPreElement>;
      progress: Attributes<
        GlobalAttributes & {
          max: NumericAttributeValue;
          value: NumericAttributeValue;
        },
        HTMLProgressElement
      >;
      q: Attributes<
        GlobalAttributes & {
          cite: string;
        },
        HTMLQuoteElement
      >;
      rp: Attributes<GlobalAttributes, HTMLElement>;
      rt: Attributes<GlobalAttributes, HTMLElement>;
      ruby: Attributes<GlobalAttributes, HTMLElement>;
      s: Attributes<GlobalAttributes, HTMLElement>;
      samp: Attributes<GlobalAttributes, HTMLElement>;
      script: Attributes<
        GlobalAttributes &
          ExperimentalImportance & {
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
          },
        HTMLScriptElement
      >;
      section: Attributes<GlobalAttributes, HTMLElement>;
      select: Attributes<
        GlobalAttributes & {
          autocomplete: AutoCompleteHints;
          autofocus: BooleanAttributeValue;
          disabled: BooleanAttributeValue;
          form: string;
          multiple: BooleanAttributeValue;
          name: string;
          required: BooleanAttributeValue;
          size: NumericAttributeValue;
        },
        HTMLSelectElement
      >;
      slot: Attributes<
        GlobalAttributes & {
          name: string;
        },
        HTMLSlotElement
      >;
      small: Attributes<GlobalAttributes, HTMLElement>;
      source: Attributes<
        GlobalAttributes &
          SizeOptions & {
            type: string;
            src: string;
            srcset: string;
            sizes: string;
            media: string;
          },
        HTMLSourceElement
      >;
      span: Attributes<GlobalAttributes, HTMLSpanElement>;
      strong: Attributes<GlobalAttributes, HTMLElement>;
      style: Attributes<
        GlobalAttributes & {
          media: string;
          nonce: string;
          title: string;
          blocking: string;
        },
        HTMLStyleElement
      >;
      sub: Attributes<GlobalAttributes, HTMLElement>;
      summary: Attributes<GlobalAttributes, HTMLElement>;
      sup: Attributes<GlobalAttributes, HTMLElement>;
      table: Attributes<GlobalAttributes, HTMLTableElement>;
      tbody: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      td: Attributes<
        GlobalAttributes & {
          colspan: NumericAttributeValue;
          headers: string;
          rowspan: NumericAttributeValue;
        },
        HTMLTableCellElement
      >;
      template: Attributes<GlobalAttributes, HTMLTemplateElement>;
      textarea: Attributes<
        GlobalAttributes & {
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
        },
        HTMLTextAreaElement
      >;
      tfoot: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      th: Attributes<
        GlobalAttributes & {
          abbr: string;
          colspan: NumericAttributeValue;
          headers: string;
          rowspan: NumericAttributeValue;
          scope: EnumeratedValues<"row" | "col" | "rowgroup" | "colgroup">;
        },
        HTMLTableCellElement
      >;
      thead: Attributes<GlobalAttributes, HTMLTableSectionElement>;
      time: Attributes<
        GlobalAttributes & {
          datetime: string;
        },
        HTMLTimeElement
      >;
      tr: Attributes<GlobalAttributes, HTMLTableRowElement>;
      track: Attributes<
        GlobalAttributes & {
          default: BooleanAttributeValue;
          kind: EnumeratedValues<"subtitles" | "captions" | "descriptions" | "chapters" | "metadata">;
          label: string;
          src: string;
          srclang: string;
        },
        HTMLTrackElement
      >;
      u: Attributes<GlobalAttributes, HTMLElement>;
      ul: Attributes<GlobalAttributes, HTMLUListElement>;
      var: Attributes<GlobalAttributes, HTMLElement>;
      video: Attributes<
        GlobalAttributes &
          SizeOptions &
          PlayerAttributes & {
            /**
             * @experimental
             */
            autopictureinpicture: BooleanAttributeValue;

            /**
             * @experimental
             */
            disablepictureinpicture: BooleanAttributeValue;
            /**
             * @experimental
             */
            disableremoteplayback: BooleanAttributeValue;
            playsinline: BooleanAttributeValue;
            poster: string;
          },
        HTMLVideoElement
      >;
      wbr: Attributes<GlobalAttributes, HTMLElement>;
    }

    interface JSXSVGElements {
      animate: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          AnimationTimingAttributes &
          AnimationValueAttributes &
          AnimationAdditionAttributes &
          GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGAnimateElement
      >;
      animateMotion: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          AnimationTimingAttributes &
          AnimationValueAttributes &
          AnimationAdditionAttributes &
          AnimationAttributeTargetAttributes & {
            keyPoints: string;
            path: string;
            rotate: string;
          } & GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGAnimateMotionElement
      >;
      animateTransform: Attributes<
        ConditionalProcessingAttributes &
          SVGCoreAttributes &
          AnimationAttributeTargetAttributes &
          AnimationTimingAttributes &
          AnimationValueAttributes &
          AnimationAdditionAttributes & {
            by: string;
            from: string;
            to: string;
            type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
          },
        SVGAnimateTransformElement
      >;
      circle: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            cx: string;
            cy: string;
            r: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGCircleElement
      >;
      clipPath: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & { clipPathUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox"> },
        SVGClipPathElement
      >;
      defs: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          GlobalEventAttributes &
          DocumentElementEventAttributes &
          GraphicalEventAttributes,
        SVGDefsElement
      >;
      desc: Attributes<
        SVGCoreAttributes & StylingAttributes & GlobalEventAttributes & DocumentElementEventAttributes,
        SVGDescElement
      >;
      /** @experimental */
      discard: Attributes<
        ConditionalProcessingAttributes &
          SVGCoreAttributes &
          PresentationAttributes & {
            begin: string;
            href: string;
          },
        HTMLElement
      >;
      ellipse: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            cx: string;
            cy: string;
            rx: string;
            ry: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGEllipseElement
      >;
      feblend: Attributes<
        SVGCoreAttributes &
          PresentationAttributes &
          SVGFilterAttributes &
          StylingAttributes & {
            in: InOrIn2Attributes;
            in2: InOrIn2Attributes;
            mode: BlendMode;
          },
        SVGFEBlendElement
      >;
      feColorMatrix: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
            values: string;
          },
        SVGFEColorMatrixElement
      >;
      feComponentTransfer: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
          },
        SVGFEComponentTransferElement
      >;
      feComposite: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            in2: InOrIn2Attributes;
            operator: EnumeratedValues<"over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic">;
            k1: string;
            k2: string;
            k3: string;
            k4: string;
          },
        SVGFECompositeElement
      >;
      feConvolveMatrix: Attributes<
        SVGCoreAttributes &
          PresentationAttributes &
          SVGFilterAttributes &
          StylingAttributes & {
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
          },
        SVGFEConvolveMatrixElement
      >;
      feDiffuseLighting: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            surfaceScale: string;
            diffuseConstant: string;
            /** @deprecated */
            kernelUnitLength: string;
          },
        SVGFEDiffuseLightingElement
      >;
      feDisplacementMap: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            in2: InOrIn2Attributes;
            scale: string;
            xChannelSelector: EnumeratedValues<"R" | "G" | "B" | "A">;
            yChannelSelector: EnumeratedValues<"R" | "G" | "B" | "A">;
          },
        SVGFEDisplacementMapElement
      >;
      feDistantLight: Attributes<
        SVGCoreAttributes & {
          azimuth: string;
          elevation: string;
        },
        SVGFEDistantLightElement
      >;
      feDropShadow: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          SVGFilterAttributes &
          PresentationAttributes & {
            dx: string;
            dy: string;
            stdDeviation: string;
          },
        SVGFEDropShadowElement
      >;
      feFlood: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            "flood-color": string;
            "flood-opacity": string;
          },
        SVGFEFloodElement
      >;
      feFuncA: Attributes<SVGCoreAttributes & TransferFunctionAttributes, SVGFEFuncAElement>;
      feFuncB: Attributes<SVGCoreAttributes & TransferFunctionAttributes, SVGFEFuncBElement>;
      feFuncG: Attributes<SVGCoreAttributes & TransferFunctionAttributes, SVGFEFuncGElement>;
      feFuncR: Attributes<SVGCoreAttributes & TransferFunctionAttributes, SVGFEFuncRElement>;
      feGaussianBlur: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            stdDeviation: string;
            edgeMode: EnumeratedValues<"duplicate" | "wrap" | "none">;
          },
        SVGFEGaussianBlurElement
      >;
      feImage: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            preserveAspectRatio: string;
            "xlink:href": string;
          },
        SVGFEImageElement
      >;
      feMerge: Attributes<
        SVGCoreAttributes & StylingAttributes & PresentationAttributes & SVGFilterAttributes,
        SVGFEMergeElement
      >;
      feMergeNode: Attributes<
        SVGCoreAttributes & {
          in: InOrIn2Attributes;
        },
        SVGFEMergeElement
      >;
      feMorphology: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            operator: EnumeratedValues<"over" | "in" | "out" | "atop" | "xor" | "lighter" | "arithmetic">;
            radius: string;
          },
        SVGFEMorphologyElement
      >;
      feOffset: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            dx: string;
            dy: string;
          },
        SVGFEOffsetElement
      >;
      fePointLight: Attributes<
        SVGCoreAttributes & {
          x: string;
          y: string;
          z: string;
        },
        SVGFEPointLightElement
      >;
      feSpecularLighting: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
            surfaceScale: string;
            speculatConstant: string;
            specularExponent: string;
            /** @deprecated */
            kernelUnitLength: string;
          },
        SVGFESpecularLightingElement
      >;
      feSpotLight: Attributes<
        SVGCoreAttributes & {
          x: string;
          y: string;
          z: string;
          pointsAtX: string;
          pointsAtY: string;
          pointsAtZ: string;
          specularExponent: string;
          limitingConeAngle: string;
        },
        SVGFESpotLightElement
      >;
      feTile: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            in: InOrIn2Attributes;
          },
        SVGFETileElement
      >;
      feTurbulence: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          SVGFilterAttributes & {
            baseFrequency: string;
            numOctaves: string;
            seed: string;
            stitchTiles: EnumeratedValues<"noStitch" | "stitch">;
            type: EnumeratedValues<"translate" | "scale" | "rotate" | "skewX" | "skewY">;
          },
        SVGFETurbulenceElement
      >;
      filter: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          Omit<SVGFilterAttributes, "result"> & {
            filterUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
            primitiveUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
            "xlink:href": string;
          },
        SVGFETurbulenceElement
      >;
      foreignObject: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes &
          Omit<SVGFilterAttributes, "result"> &
          GlobalEventAttributes &
          GraphicalEventAttributes &
          DocumentEventAttributes &
          DocumentElementEventAttributes,
        SVGForeignObjectElement
      >;
      g: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes &
          GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGGElement
      >;
      image: Attributes<
        SVGCoreAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes &
          Omit<SVGFilterAttributes, "result"> & {
            href: string;
            "xlink:href": string;
            preserveAspectRatio: string;
            crossorigin: EnumeratedValues<"anonymous" | "use-credentials" | "">;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGImageElement
      >;
      line: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            x1: string;
            x2: string;
            y1: string;
            y2: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGLineElement
      >;
      linearGradient: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes & {
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
          } & GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGLinearGradientElement
      >;
      marker: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            markerHeight: string;
            markerUnits: string;
            markerWidth: string;
            orient: string;
            preserveAspectRatio: string;
            refX: string;
            refY: string;
            viewBox: string;
          },
        SVGMarkerElement
      >;
      mask: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            width: string;
            height: string;
            maskContentUnits: EnumeratedValues<"userSpaceOnUse" | "userSpaceOnUse">;
            maskUnits: EnumeratedValues<"userSpaceOnUse" | "objectBoundingBox">;
            x: string;
            y: string;
          },
        SVGMaskElement
      >;
      metadata: Attributes<SVGCoreAttributes & GlobalEventAttributes, SVGMetadataElement>;
      mpath: Attributes<
        SVGCoreAttributes & {
          "xlink:href": string;
        },
        SVGMPathElement
      >;
      path: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            d: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGPathElement
      >;
      pattern: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
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
          },
        SVGPatternElement
      >;
      polygon: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            points: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGPolygonElement
      >;
      polyline: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            points: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGPolylineElement
      >;
      radialGradient: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes & {
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
          } & GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGRadialGradientElement
      >;
      rect: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            x: string;
            y: string;
            width: string;
            height: string;
            rx: string;
            ry: string;
            pathLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGRectElement
      >;
      set: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          AnimationTimingAttributes &
          AnimationAttributeTargetAttributes & {
            to: string;
          } & GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGSetElement
      >;
      stop: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes & {
            /** @deprecated */
            offset: string;
            "stop-color": string;
            "stop-opacity": string;
          } & GlobalEventAttributes &
          DocumentElementEventAttributes,
        SVGStopElement
      >;
      svg: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            viewBox: string;
            xmlns: string;
            width: string;
            heigth: string;
            preserveAspectRatio: string;
            "xmlns:xlink": string;
            x: string;
            y: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes &
          DocumentEventAttributes &
          DocumentElementEventAttributes,
        SVGElement
      >;
      switch: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          ConditionalProcessingAttributes &
          PresentationAttributes & {
            transform: string;
          } & GraphicalEventAttributes,
        SVGSwitchElement
      >;
      symbol: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes & {
            width: string;
            height: string;
            preserveAspectRatio: string;
            refX: string;
            refY: string;
            viewBox: string;
            x: string;
            y: string;
          } & GlobalEventAttributes &
          DocumentElementEventAttributes &
          GraphicalEventAttributes,
        SVGSymbolElement
      >;
      text: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
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
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGTextElement
      >;
      textPath: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
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
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGTextPathElement
      >;
      /**
       * `<title>` is only considered to be used in SVG.
       */
      title: Attributes<
        SVGCoreAttributes & StylingAttributes & GlobalEventAttributes & DocumentElementEventAttributes,
        SVGTitleElement
      >;
      tspan: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            x: string;
            y: string;
            dx: string;
            dy: string;
            rotate: string;
            lengthAdjust: EnumeratedValues<"pacing" | "spacingAndGlyphs">;
            textLength: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGTSpanElement
      >;
      use: Attributes<
        SVGCoreAttributes &
          StylingAttributes &
          PresentationAttributes &
          ConditionalProcessingAttributes & {
            href: string;
            /** @deprecated  */
            "xlink:href": string;
            x: string;
            y: string;
            width: string;
            height: string;
          } & GlobalEventAttributes &
          GraphicalEventAttributes,
        SVGUseElement
      >;
      view: Attributes<
        SVGCoreAttributes & {
          viewBox: string;
          preserveAspectRatio: string;
        } & GlobalEventAttributes,
        SVGViewElement
      >;
    }

    interface IntrinsicElements extends JSXHTMLElements, JSXSVGElements {}

    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
