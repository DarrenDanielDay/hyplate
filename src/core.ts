/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ParseSelector } from "typed-query-selector/parser.js";
import type { AttachFunc, AttributeInterpolation, EventHost, TextInterpolation } from "./types.js";
import { fori, isString, push } from "./util.js";
import { comment } from "./internal.js";

const doc = document;

export const element = /* #__PURE__ */ doc.createElement.bind(doc);

export const svg: <K extends keyof SVGElementTagNameMap>(name: K) => SVGElementTagNameMap[K] = (name) =>
  doc.createElementNS("http://www.w3.org/2000/svg", name);

export const docFragment = doc.createDocumentFragment.bind(doc);

export const clone = <N extends Node>(node: N): N => node.cloneNode(true) as N;

export const attr = (element: Element, name: string, value: AttributeInterpolation) =>
  value == null || value === false ? element.removeAttribute(name) : element.setAttribute(name, `${value}`);

export const text = (node: Node, content: TextInterpolation) => (node.textContent = `${content}`);

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

export const listen =
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
  (host: Node): AttachFunc =>
  (node) =>
    host.appendChild(node);

export const before =
  (anchorNode: Node): AttachFunc =>
  (node) =>
    anchorNode.parentNode!.insertBefore(node, anchorNode);

export const after =
  (element: ChildNode): AttachFunc =>
  (node) =>
    element.after(node);

export const seqAfter = (element: ChildNode): AttachFunc => {
  const begin = comment(" sequence after begin ");
  const end = comment(" sequence after end ");
  const append = after(element);
  append(begin);
  append(end);
  return before(end);
};

export const remove = (node: Node) => node.parentNode?.removeChild(node);

export const moveRange = (begin: Node | null, end: Node | null) => (attach: AttachFunc) => {
  const targets: Node[] = [];
  for (let node = begin; node && node !== end; node = node.nextSibling) {
    push(targets, node);
  }
  if (end) {
    push(targets, end);
  }
  fori(targets, attach);
};

export const access = (node: ParentNode, path: number[]): ParentNode | undefined => {
  for (let i = 0, l = path.length; i < l; i++) {
    node = node.children[path[i]];
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
