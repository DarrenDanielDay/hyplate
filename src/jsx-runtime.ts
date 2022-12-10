/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { appendChild, attr, bindAttr, bindEvent, docFragment, element, remove, text } from "./core.js";
import { isReactive } from "./store.js";

import type {
  JSXChildNode,
  FunctionalComponent,
  JSXChild,
  AttachFunc,
  CleanUpFunc,
  Query,
  AttributeInterpolation,
  Rendered,
  Props,
  PropsBase,
  Later,
} from "./types.js";
import { applyAll, err, isFunction, isObject, noop, push, __DEV__ } from "./util.js";

const addChild = (child: JSXChild, attach: AttachFunc) => {
  if (child instanceof Node) {
    attach(child);
    return () => {
      remove(child as ChildNode);
    };
  }
  if (isFunction(child)) {
    return child(attach)[0];
  }
  return text`${child}`(attach);
};

const renderChild = (children: JSXChildNode, _attach: AttachFunc) => {
  let begin: Node | null = null,
    end: Node | null = null;
  const attach: AttachFunc = (node) => {
    if (!begin) {
      begin = node;
    }
    end = node;
    return _attach(node);
  };
  const cleanups: CleanUpFunc[] = [];
  if (Array.isArray(children)) {
    for (const child of children) {
      push(cleanups, addChild(child, attach));
    }
  } else {
    push(cleanups, addChild(children, attach));
  }
  return [cleanups, () => (begin && end ? ([begin, end] as const) : void 0)] as const;
};
const pattern = /^on[A-Z]/;
const isEventAttribute = (name: string) => pattern.test(name);

export const jsx = (
  type: FunctionalComponent | string,
  props: Partial<Props<PropsBase, JSXChildNode, HTMLElement>>
): JSX.Element => {
  if (typeof type === "string") {
    return (attach): Rendered<object> => {
      const el = element(type);
      const { children, ref, ...attributes } = props;
      if (ref) {
        ref.el = el;
      }
      const [cleanups] = children != null ? renderChild(children, appendChild(el)) : [[]];
      for (const [key, value] of Object.entries(attributes)) {
        if (isObject(value)) {
          if (__DEV__ && !isReactive(value)) {
            err(`The given value '${JSON.stringify(value)}' for attribute ${key} is not a reactive source/query.`);
          }
          push(cleanups, bindAttr(el, key, value as Query<AttributeInterpolation>));
        } else if (isFunction(value) && isEventAttribute(key)) {
          const host = bindEvent(el);
          push(cleanups, host(key.slice(2).toLowerCase() as never, value));
        } else {
          attr(el, key, `${value}`);
        }
      }
      push(cleanups, () => remove(el));
      attach(el);
      return [applyAll(cleanups), el, () => [el, el]];
    };
  }
  // @ts-expect-error Dynamic Implementation
  return type(props);
};
export const jsxs = jsx;

/**
 * Create a jsx ref object to fetch the DOM element when mounted.
 */
export const jsxRef = <E extends HTMLElement>(): Later<E> => ({
  el: null,
});

export const Fragment: FunctionalComponent<{}, JSXChildNode | undefined> = ({ children }) => {
  return (attach) => {
    const fragment = docFragment();
    const [cleanups, getRange] = children ? renderChild(children, appendChild(fragment)) : [[], noop];
    attach(fragment);
    return [applyAll(cleanups), void 0, getRange];
  };
};
