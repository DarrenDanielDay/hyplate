import { appendChild, attr, bindAttr, element, remove, text } from "./core.js";

import type {
  JSXChildNode,
  FunctionalComponent,
  WithChildren,
  JSXChild,
  AttachFunc,
  CleanUpFunc,
  Query,
  AttributeInterpolation,
} from "./types.js";
import { applyAll, isFunction, isObject, push } from "./util.js";

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

const renderChild = (children: JSXChildNode, attach: AttachFunc) => {
  const cleanups: CleanUpFunc[] = [];
  if (Array.isArray(children)) {
    for (const child of children) {
      push(cleanups, addChild(child, attach));
    }
  } else {
    push(cleanups, addChild(children, attach));
  }
  return cleanups;
};

export const jsx = (type: FunctionalComponent | string, props: Partial<WithChildren<JSXChildNode>>): JSX.Element => {
  if (typeof type === "string") {
    return (attach) => {
      const el = element(type);
      const { children, ...attributes } = props;
      const cleanups = children ? renderChild(children, appendChild(el)) : [];
      for (const [key, value] of Object.entries(attributes)) {
        if (isObject(value)) {
          push(cleanups, bindAttr(el, key, value as Query<AttributeInterpolation>));
        } else {
          attr(el, key, `${value}`);
        }
      }
      push(cleanups, () => remove(el));
      attach(el);
      return [applyAll(cleanups), el];
    };
  }
  // @ts-expect-error Dynamic Implementation
  return type(props);
};
export const jsxs = jsx;

export const Fragment: FunctionalComponent<{}, JSXChildNode | undefined> = ({ children }) => {
  return (attach) => {
    const fragment = new DocumentFragment();
    const cleanups = children ? renderChild(children, appendChild(fragment)) : [];
    attach(fragment);
    return [applyAll(cleanups), void 0];
  };
};
