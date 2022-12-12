/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type AnyFunc = (...args: any[]) => any;

export type CleanUpFunc = () => void;

export interface Query<T extends unknown> {
  readonly val: T;
}

export interface Source<T extends unknown> extends Query<T> {
  set(newVal: T): void;
}

export type Subscriber<T extends unknown> = (latest: T) => void;

export interface Later<E extends HTMLElement> {
  el: E | null;
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

/**
 * Slot name map for
 */
export type SlotMap<S extends string = string> = [S] extends [never]
  ? undefined
  : Partial<Record<S, Element | DocumentFragment | Mountable<any>>>;

export type ExposeBase = {} | void;

export type PropsBase = {};

export type Mountable<E extends ExposeBase> = (attach: AttachFunc) => Rendered<E>;

export type WithChildren<C> = { children: C };

export type WithRef<E extends HTMLElement> = { ref: Later<E> };

export type Props<P extends PropsBase, C = undefined, E = undefined> = Omit<P, "children" | "ref"> &
  (C extends undefined ? Partial<WithChildren<C>> : WithChildren<C>) &
  (E extends HTMLElement ? Partial<WithRef<E>> : {});

export type FunctionalComponent<P extends PropsBase = PropsBase, C = undefined, E extends ExposeBase = void> = (
  props: Props<P, C>
) => Mountable<E>;

export type FunctionalComponentTemplateFactory = <S extends string = never>(
  input: string | HTMLTemplateElement,
  name?: string
) => <P extends PropsBase, E extends ExposeBase>(
  setup?: (props: P) => E
) => FunctionalComponent<P, undefined | SlotMap<S>, E>;

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

type ElementAttributes<E extends HTMLElement> = {
  ref?: Later<E>;
};

type Attributes<T extends {}, E extends HTMLElement> = {
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

declare global {
  namespace JSX {
    type Element = Mountable<any>;
    interface ElementAttributesProperty {
      options: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }

    interface IntrinsicElements {
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
    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
