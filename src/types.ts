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
) => void;

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
) => <P extends PropsBase, E extends ExposeBase>(setup?: (props: P) => E) => FunctionalComponent<P, undefined | SlotMap<S>, E>;

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
  [P in K]: boolean | `${boolean}` | "";
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
      button: Attributes<GlobalAttributes, HTMLButtonElement>;
      div: Attributes<GlobalAttributes, HTMLDivElement>;
      input: Attributes<GlobalAttributes, HTMLInputElement>;
      span: Attributes<GlobalAttributes, HTMLSpanElement>;
    }
    interface IntrinsicAttributes {
      children?: unknown;
    }
  }
}
//#endregion
