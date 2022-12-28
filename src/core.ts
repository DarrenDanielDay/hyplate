/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ParseSelector } from "typed-query-selector/parser.js";
import { err, __DEV__ } from "./util.js";
import { isReactive, subscribe } from "./store.js";
import type { AttachFunc, AttributeInterpolation, CleanUpFunc, EventHost, Query, TextInterpolation } from "./types.js";
import { applyAll, isObject, isString, push } from "./util.js";
import { comment } from "./internal.js";

const doc = document;

export const element = doc.createElement.bind(doc);

export const svg: <K extends keyof SVGElementTagNameMap>(name: K) => SVGElementTagNameMap[K] = (name) =>
  doc.createElementNS("http://www.w3.org/2000/svg", name);

export const docFragment = doc.createDocumentFragment.bind(doc);

export const clone = <N extends Node>(node: N): N => node.cloneNode(true) as N;

export const attr = (element: Element, name: string, value: AttributeInterpolation) =>
  value == null || value === false ? element.removeAttribute(name) : element.setAttribute(name, `${value}`);

export const textContent = (node: Node, content: TextInterpolation) => (node.textContent = `${content}`);

export const select: {
  <S extends string>(host: ParentNode, selecor: S): ParseSelector<S> | null;
  <S extends string>(selecor: S): ParseSelector<S> | null;
} = <S extends string>(host: ParentNode | S, selecor?: S): ParseSelector<S> | null =>
  isString(host) ? doc.querySelector(host) : host.querySelector(selecor!);

export const anchor: {
  (hid: string): HTMLTemplateElement | null;
  (owner: ParentNode, hid: string): Element | null;
} = (p1, p2?) => {
  if (isString(p1)) {
    return doc.querySelector(`template[\\#${p1}]`);
  }
  return p1.querySelector(`[\\#${p2}]`);
};

export const $: <S extends string>(selector: S) => ParseSelector<S> = doc.querySelector.bind(doc);

export const $$ = <S extends string>(selector: S): ParseSelector<S>[] => Array.from(doc.querySelectorAll(selector));

export const bindText = (node: Node, query: Query<TextInterpolation>) =>
  subscribe(query, (text) => textContent(node, text));

export const text = (
  fragments: TemplateStringsArray,
  ...bindings: (TextInterpolation | Query<TextInterpolation>)[]
) => {
  const fragmentsLength = fragments.length;
  const bindingsLength = bindings.length;
  if (__DEV__) {
    if (fragmentsLength !== bindingsLength + 1) {
      err(
        `Invalid usage of "text". Fragments length(${fragments.length}) and bindings length(${bindings.length}) do not match.`
      );
    }
    if (bindings.some((binding) => isObject(binding) && !isReactive(binding))) {
      err(`Invalid usage of "text". Object text child must be reactive source/query.`);
    }
  }
  return (attach: AttachFunc): CleanUpFunc => {
    const effects: CleanUpFunc[] = [];
    const buf: string[] = [];
    const flushBuf = () => {
      const textContent = buf.join("");
      if (textContent) {
        const textNode = new Text(textContent);
        push(effects, () => remove(textNode));
        attach(textNode);
      }
      buf.length = 0;
    };
    for (let i = 0; i < bindingsLength; i++) {
      push(buf, fragments[i]!);
      const expression = bindings[i]!;
      if (isObject(expression)) {
        flushBuf();
        const dynamicText = new Text();
        push(effects, bindText(dynamicText, expression));
        push(effects, () => remove(dynamicText));
        attach(dynamicText);
      } else {
        push(buf, `${expression}`);
      }
    }
    push(buf, fragments.at(-1)!);
    flushBuf();
    return applyAll(effects);
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

export const appendChild =
  <T>(host: Node) =>
  (node: Node) => (host.appendChild(node), host as T);

export const before = (element: ChildNode) => (node: Node) => (element.before(node), element.parentElement!);

export const after = (element: ChildNode) => (node: Node) => (element.after(node), element.parentElement!);

export const seqAfter = (element: ChildNode) => {
  const begin = comment(" sequence after begin ");
  const end = comment(" sequence after end ");
  const append = after(element);
  append(begin);
  append(end);
  const insert = before(end);
  return insert;
};

export const remove = (node: ChildNode) => node.remove();

export const moveRange = (begin: Node | null, end: Node | null) => (attach: AttachFunc) => {
  const targets: Node[] = [];
  for (let node = begin; node && node !== end; node = node.nextSibling) {
    push(targets, node);
  }
  if (end) {
    push(targets, end);
  }
  for (const node of targets) {
    attach(node);
  }
};

export const access = (node: ParentNode, path: number[]): ParentNode | undefined => {
  for (const i of path) {
    node = node.children[i];
    if (!node) {
      break;
    }
  }
  return node;
};

export const insertSlot = (host: Element, slotName: string, element: Element) => {
  attr(element, "slot", slotName);
  appendChild(host)(element);
};
