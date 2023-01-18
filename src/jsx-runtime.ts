/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { bindAttr, interpolation, isSubscribable } from "./binding.js";
import { appendChild, attr, listen, docFragment, element, svg, delegate } from "./core.js";
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
  ObjectEventHandler,
} from "./types.js";
import { applyAll, fori, isFunction, isObject, isString, noop, push, __DEV__ } from "./util.js";
const isNode = (node: unknown): node is Node => node instanceof Node;
const addChild = (child: JSXChild, attach: AttachFunc) => {
  if (isNode(child)) {
    attach(child);
    return noop;
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
    fori(children, (child) => {
      push(cleanups, addChild(child, attach));
    });
  } else {
    push(cleanups, addChild(children, attach));
  }
  return [cleanups, () => (begin && end ? ([begin, end] as const) : void 0)] as const;
};

const isObjectEventHandler = (v: unknown): v is ObjectEventHandler<any> =>
  isObject(v) && "handleEvent" in v && isFunction(v.handleEvent);

let currentElementFactory: (name: string, options: ElementCreationOptions | undefined) => Element = element;

export const jsx = (
  type: FunctionalComponent | string,
  props: Partial<Props<PropsBase, JSXChildNode, {}>>
): JSX.Element => {
  if (typeof type === "string") {
    return (attach): Rendered<object> => {
      let lastElementFactory = currentElementFactory;
      const isSvg = type === "svg";
      const isForeignObject = type === "foreignObject";
      const changnigFactory = isSvg || isForeignObject;
      //#region enter svg creating scope
      if (isSvg) {
        // @ts-expect-error Skipped type check for svg children.
        currentElementFactory = svg;
      }
      //#endregion
      const el = currentElementFactory(type, "is" in props && isString(props.is) ? { is: props.is } : undefined);
      if (isForeignObject) {
        currentElementFactory = element;
      }
      const { children, ref, ...attributes } = props;
      if (ref) {
        ref.current = el;
      }
      const [cleanups] = children != null ? renderChild(children, appendChild(el)) : [[]];
      const eventHost = listen(el);
      const delegateHost = delegate(el);
      for (const key in attributes) {
        // @ts-expect-error for-in key access
        const value = attributes[key];
        if (isSubscribable(value)) {
          push(cleanups, bindAttr(el, key, value));
        } else {
          if (key.startsWith("on")) {
            const next = key[2];
            if ("A" <= next && next <= "Z") {
              const event = key.slice(2).toLowerCase();
              if (isFunction(value)) {
                push(cleanups, eventHost(event, value));
                continue;
              } else if (isObjectEventHandler(value)) {
                push(cleanups, eventHost(event, value, value.options));
                continue;
              }
            }
            if (next === ":") {
              if (isFunction(value)) {
                const event = key.slice(3).toLowerCase();
                push(cleanups, delegateHost(event, value));
                continue;
              }
            }
          }
          attr(el, key, value as AttributeInterpolation);
        }
      }
      attach(el);
      if (changnigFactory) {
        currentElementFactory = lastElementFactory;
      }
      return [cleanups.length ? applyAll(cleanups) : noop, el, () => [el, el]];
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

export const mount = (element: JSX.Element, onto: Node | AttachFunc): Rendered<any> => {
  const attach = isNode(onto) ? appendChild(onto) : onto;
  return element(attach);
}