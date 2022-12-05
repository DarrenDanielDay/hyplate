// import { Source, TextInterpolation } from "./types";
import type { ParseSelector } from "typed-query-selector/parser.js";
import { err, __DEV__ } from "./util.js";
import { subscribe } from "./store.js";
import type {
  AttachFunc,
  AttributeInterpolation,
  CleanUpFunc,
  EventHost,
  Query,
  TextInterpolation,
} from "./types.js";
import { applyAll, isObject, isString, push } from "./util.js";
import { comment } from "./internal.js";

export const element = document.createElement.bind(document);

export const docFragment = document.createDocumentFragment.bind(document);

export const clone = <N extends Node>(node: N): N => node.cloneNode(true) as N;

export const attr = (element: Element, name: string, value: AttributeInterpolation) =>
  value == null || value === false ? element.removeAttribute(name) : element.setAttribute(name, `${value}`);

export const select: {
  <S extends string>(host: ParentNode, selecor: S): ParseSelector<S> | null;
  <S extends string>(selecor: S): ParseSelector<S> | null;
} = <S extends string>(host: ParentNode | S, selecor?: S): ParseSelector<S> | null =>
  isString(host) ? document.querySelector(host) : host.querySelector(selecor!);
export const anchorRef: {
  (hid: string): HTMLTemplateElement | null;
  (owner: ParentNode, hid: string): Element | null;
} = (p1, p2?) => {
  if (isString(p1)) {
    return document.querySelector(`template[\\#${p1}]`);
  }
  return p1.querySelector(`[\\#${p2}]`);
};

export const $ = anchorRef;

export const $$ = <S extends string>(host: ParentNode, selector: S): ParseSelector<S>[] =>
  Array.from(host.querySelectorAll(selector));

export const bindText = (node: Node, query: Query<TextInterpolation>) =>
  subscribe(query, (text) => (node.textContent = `${text}`));

export const text =
  (fragments: TemplateStringsArray, ...bindings: (TextInterpolation | Query<TextInterpolation>)[]) =>
  (attach: AttachFunc): CleanUpFunc => {
    const fragmentsLength = fragments.length;
    const bindingsLength = bindings.length;
    if (__DEV__) {
      if (fragmentsLength !== bindingsLength + 1) {
        err(
          `Invalid usage. Fragments length(${fragments.length}) and bindings length(${bindings.length}) do not match.`
        );
      }
    }
    const effects: CleanUpFunc[] = [];
    const buf: string[] = [];
    const flushBuf = () => {
      attach(new Text(buf.join("")));
      buf.length = 0;
    };
    for (let i = 0; i < bindingsLength; i++) {
      push(buf, fragments[i]!);
      const expression = bindings[i]!;
      if (isObject(expression)) {
        flushBuf();
        const dynamicText = new Text();
        push(effects, bindText(dynamicText, expression));
        attach(dynamicText);
      } else {
        push(buf, `${expression}`);
      }
    }
    push(buf, fragments.at(-1)!);
    flushBuf();
    return applyAll(effects);
  };

export const bindAttr = (el: Element, name: string, query: Query<AttributeInterpolation>) =>
  subscribe(query, (attribute) => attr(el, name, attribute));

export const bindEvent =
  <T extends EventTarget>(target: T): EventHost<T> =>
  (name, handler, options) => {
    // @ts-expect-error generic
    target.addEventListener(name, handler, options);
    return () => {
      // @ts-expect-error generic
      target.removeEventListener(name, handler, options);
    };
  };

export const appendChild =
  <T>(host: Node) =>
  (node: Node) => (host.appendChild(node), host as T);

export const before = (element: ChildNode) => (node: Node) => (element.before(node), element.parentElement!);

export const after = (element: ChildNode) => (node: Node) => (element.after(node), element.parentElement!);

export const seqAfter = (element: ChildNode) => {
  const begin = comment("sequence after begin");
  const end = comment("sequence after end");
  const append = after(element);
  append(begin);
  append(end);
  const insert = before(end);
  return (node: Node) => insert(node);
};

export const remove = (node: ChildNode) => node.remove();

export const moveNode = (node: Node) => (attach: AttachFunc) => attach(node);

export const moveRange =
  (begin: Node | null, end: Node | null) =>
  (attach: AttachFunc) => {
    for (let node = begin; node && node !== end; node = node.nextSibling) {
      attach(node);
    }
    if (end) {
      attach(end);
    }
  };

export const insertSlot = (host: Element, slotName: string, element: Element) => {
  attr(element, "slot", slotName);
  appendChild(host)(element);
};
