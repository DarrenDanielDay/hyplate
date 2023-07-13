/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ParseSelector } from "typed-query-selector/parser.js";
import type {
  AttachFunc,
  AttributeInterpolation,
  AttributesMap,
  StyleProperties,
  DelegateHost,
  EventHost,
  GetRange,
  TextInterpolation,
  CSSProperties,
  ElementWithStyle,
  Handler,
} from "./types.js";
import { arrayFrom, fori, push } from "./util.js";
import { comment, doc, _delegate, _listen } from "./internal.js";
export { comment } from "./internal.js";
export { noop } from "./util.js";

export const element = /* #__PURE__ */ doc.createElement.bind(doc);

export const text = /* #__PURE__ */ doc.createTextNode.bind(doc);

export const svg: <K extends keyof SVGElementTagNameMap>(name: K) => SVGElementTagNameMap[K] = (name) =>
  doc.createElementNS("http://www.w3.org/2000/svg", name);

export const mathml: (name: string) => MathMLElement = (name) =>
  doc.createElementNS("http://www.w3.org/1998/Math/MathML", name) as MathMLElement;

export const fragment = /* #__PURE__ */ doc.createDocumentFragment.bind(doc);

export const clone = <N extends Node>(node: N): N => node.cloneNode(true) as N;

export const attr: {
  <E extends Element, P extends keyof AttributesMap<E>>(element: E, name: P, value: AttributesMap<E>[P]): void;
  (element: Element, name: string, value: AttributeInterpolation): void;
} = (element: Element, name: string, value: AttributeInterpolation) =>
  value == null || value === false ? element.removeAttribute(name) : element.setAttribute(name, `${value}`);

export const content = (node: Node, content: TextInterpolation) => (node.textContent = `${content}`);

export const className = (el: Element, name: string, on: boolean) => el.classList.toggle(name, on);

export const style: {
  (el: ElementWithStyle, name: StyleProperties, value: string | null): void;
  (el: ElementWithStyle, name: CSSProperties, value: string | null): void;
  (el: ElementWithStyle, name: string, value: string | null): void;
} = (el: ElementWithStyle, name: string, value: string | null) => {
  const style = el.style;
  if (name in style) {
    // @ts-expect-error unknown property assign
    style[name] = value;
  } else {
    style.setProperty(name, value);
  }
};

export const cssVar = (el: ElementWithStyle, name: string, value: string | null) => {
  const style = el.style,
    property = `--${name}`;
  style.setProperty(property, value);
};

export const $: <S extends string>(selector: S) => ParseSelector<S> = /* #__PURE__ */ doc.querySelector.bind(doc);

export const $$ = <S extends string>(selector: S): ParseSelector<S>[] => arrayFrom(doc.querySelectorAll(selector));

export const listen =
  <T extends EventTarget>(target: T): EventHost<T> =>
  // @ts-expect-error skipped generic check
  (name: string, handler: Handler<any, any>, options: EventHandlerOptions) =>
    _listen(target, name, handler, options);

export const delegate =
  <T extends Element>(el: T): DelegateHost<T> =>
  (event, handler) =>
    _delegate(el, event, handler);

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

export const remove: AttachFunc = (node: Node) => node.parentNode?.removeChild(node);

export const moveRange = (begin: Node | null, end: Node | null, attach: AttachFunc) => {
  const targets: Node[] = [];
  for (let node = begin; node && node !== end; node = node.nextSibling) {
    push(targets, node);
  }
  if (end) {
    push(targets, end);
  }
  fori(targets, attach);
};

export const removeRange = (getRange: GetRange) => {
  const range = getRange();
  if (range) {
    moveRange(range[0], range[1], remove);
  }
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
