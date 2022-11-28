// import { Source, TextInterpolation } from "./types";
import type { ParseSelector } from "typed-query-selector/parser.js";
import { err, __DEV__ } from "./internal.js";
import { subscribe } from "./store.js";
import type { AttachFunc, AttributeInterpolation, CleanUpFunc, EventHost, Query, TextInterpolation } from "./types.js";
import { isObject, isString } from "./util.js";

export const element = document.createElement.bind(document);

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
      buf.push(fragments[i]!);
      const expression = bindings[i]!;
      if (isObject(expression)) {
        flushBuf();
        const dynamicText = new Text();
        effects.push(bindText(dynamicText, expression));
        attach(dynamicText);
      } else {
        buf.push(`${expression}`);
      }
    }
    buf.push(fragments.at(-1)!);
    flushBuf();
    return () => {
      for (const effect of effects) {
        effect();
      }
    };
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

export const appendChild = (host: Element) => (node: Node) => (host.appendChild(node), host);

export const before = (element: ChildNode) => (node: Node) => (element.before(node), element.parentElement!);

export const after = (element: ChildNode) => (node: Node) => (element.after(node), element.parentElement!);

export const remove = (node: ChildNode) => node.remove();

export const insertSlot = (host: Element, slotName: string, element: Element) => {
  attr(element, "slot", slotName);
  appendChild(host)(element);
};
