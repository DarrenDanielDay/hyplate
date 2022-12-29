/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { bindAttr, interpolation, isSubscribable } from "./binding.js";
import { appendChild, attr, listen, docFragment, element, remove, svg } from "./core.js";
import type {
  JSXChildNode,
  FunctionalComponent,
  JSXChild,
  AttachFunc,
  CleanUpFunc,
  AttributeInterpolation,
  Rendered,
  Props,
  PropsBase,
  Later,
  Subscribable,
} from "./types.js";
import { applyAll, isFunction, noop, push, __DEV__ } from "./util.js";

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
  return interpolation`${child}`(attach);
};

const renderChild = (children: JSXChildNode, _attach: AttachFunc) => {
  let begin: Node | null = null,
    end: Node | null = null;
  const attach: AttachFunc = (node) => {
    const isFragment = node instanceof DocumentFragment;
    if (!begin) {
      if (isFragment) {
        begin = node.firstChild;
      } else {
        begin = node;
      }
    }
    if (isFragment) {
      end = node.lastChild;
    } else {
      end = node;
    }
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

let currentElementFactory: (name: string) => Element = element;

export const jsx = (
  type: FunctionalComponent | string,
  props: Partial<Props<PropsBase, JSXChildNode, {}>>
): JSX.Element => {
  if (typeof type === "string") {
    return (attach): Rendered<object> => {
      let lastElementFactory = currentElementFactory;
      const isSvg = type === "svg";
      //#region enter svg creating scope
      if (isSvg) {
        // @ts-expect-error Skipped type check for svg children.
        currentElementFactory = svg;
      }
      //#endregion
      const el = currentElementFactory(type);
      const { children, ref, ...attributes } = props;
      if (ref) {
        ref.current = el;
      }
      const [cleanups] = children != null ? renderChild(children, appendChild(el)) : [[]];
      for (const [key, value] of Object.entries(attributes)) {
        if (isSubscribable(value)) {
          push(cleanups, bindAttr(el, key, value as Subscribable<AttributeInterpolation>));
        } else if (isFunction(value) && isEventAttribute(key)) {
          const host = listen(el);
          push(cleanups, host(key.slice(2).toLowerCase() as never, value));
        } else {
          attr(el, key, value as AttributeInterpolation);
        }
      }
      push(cleanups, () => remove(el));
      attach(el);
      if (isSvg) {
        currentElementFactory = lastElementFactory;
      }
      return [applyAll(cleanups), el, () => [el, el]];
    };
  }
  const { ref, ...otherProps } = props;
  // @ts-expect-error Dynamic Implementation
  const mountable = type(otherProps);
  if (!ref) {
    return mountable;
  }
  return (attach) => {
    const rendered = mountable(attach);
    // @ts-expect-error Dynamic Implementation
    ref.current = rendered[1];
    return rendered;
  };
};
export const jsxs = jsx;

/**
 * Create a jsx ref object to fetch the DOM element when mounted.
 */
export const jsxRef = <E extends {}>(): Later<E> => ({
  current: null,
});

export const Fragment: FunctionalComponent<{}, JSXChildNode | undefined> = ({ children }) => {
  return (attach) => {
    const fragment = docFragment();
    const [cleanups, getRange] = children ? renderChild(children, appendChild(fragment)) : [[], noop];
    attach(fragment);
    return [applyAll(cleanups), void 0, getRange];
  };
};
