/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { $attr, $text, isSubscribable } from "./binding.js";
import { appendChild, attr, fragment, element, svg, removeRange, mathml } from "./core.js";
import { enterEffectScope, quitEffectScope } from "./hooks.js";
import { addCleanUp, isFragment, isNode, _delegate, _listen, $$HyplateElementMeta, isElement } from "./internal.js";
import type { ClassComponentInstance, ComponentClass, Effect, JSXDirective, Mountable } from "./types.js";
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
  Renderer,
  JSXFactory,
} from "./types.js";
import { applyAllStatic, fori, isArray, isFunction, isObject, isString, noop, push, __DEV__, warn } from "./util.js";

export const isComponentClass = (fn: Function): fn is ComponentClass =>
  !!((fn as ComponentClass)?.[Symbol.metadata]?.[$$HyplateElementMeta]);

export const mount: Renderer = (element, onto): Rendered<any> => {
  const attach = isNode(onto) ? appendChild(onto) : onto;
  return element(attach);
};

/**
 * Create DOM node with JSX expression. Expecting JSX expression has no binding pattern.
 * Bindings will work, but cannot be unsubscribed.
 * @param element JSX.Element
 * @returns created node
 */
export const create = <T extends Node = Node>(element: JSX.Element): T => {
  const frag = fragment();
  mount(element, frag);
  if (frag.childNodes.length === 1) {
    // @ts-expect-error skip generic type check
    return frag.firstChild!;
  }
  // @ts-expect-error skip generic type check
  return frag;
};

export const unmount = (rendered: Rendered<any>) => {
  const [cleanup, , getRange] = rendered;
  cleanup();
  removeRange(getRange);
};

const addChild = (child: JSXChildNode, attach: AttachFunc): CleanUpFunc => {
  if (isNode(child)) {
    attach(child);
    return noop;
  }
  if (isFunction(child) && !isSubscribable(child)) {
    return mount(child, attach)[0];
  }
  if (isArray(child)) {
    const cleanups: CleanUpFunc[] = [];
    fori(child, (c) => addCleanUp(cleanups, addChild(c, attach)));
    return applyAllStatic(cleanups);
  }
  return $text`${child}`(attach);
};

const renderChild = (children: JSXChildNode, _attach: AttachFunc) => {
  let begin: Node | null = null,
    end: Node | null = null;
  const attach: AttachFunc = (node) => {
    const isFrag = isFragment(node);
    if (!begin) {
      if (isFrag) {
        begin = node.firstChild;
      } else {
        begin = node;
      }
    }
    if (isFrag) {
      end = node.lastChild;
    } else {
      end = node;
    }
    return _attach(node);
  };
  const cleanups: CleanUpFunc[] = [];
  addCleanUp(cleanups, addChild(children, attach));
  return [cleanups, () => (begin && end ? ([begin, end] as const) : void 0)] as const;
};

const createFunctionalComponentMountable = (fc: FunctionalComponent, props: object): Mountable<any> => {
  const effects: Effect[] = [];
  enterEffectScope(effects);
  const mountable = fc(props);
  quitEffectScope();
  return (attach) => {
    const rendered = mount(mountable, attach);
    const [userCleanup, ...others] = rendered;
    const cleanups: CleanUpFunc[] = [];
    addCleanUp(cleanups, userCleanup);
    fori(effects, (callback) => {
      const cleanup = callback();
      if (cleanup) {
        push(cleanups, cleanup);
      }
    });
    return [applyAllStatic(cleanups), ...others];
  };
};

const isObjectEventHandler = (v: unknown): v is ObjectEventHandler<any> =>
  isObject(v) && "handleEvent" in v && isFunction(v.handleEvent);

let currentElementFactory: (name: string, options: ElementCreationOptions | undefined) => Element = element;

type DirectivesMap = {
  [prefix: string]: JSXDirective<any>;
};

const directivesWithoutParams: DirectivesMap = {};
const directives: DirectivesMap = {};

export const registerDirective = (directive: JSXDirective<any>): CleanUpFunc => {
  const { prefix } = directive;
  if (!directive.requireParams) {
    directivesWithoutParams[prefix] = directive;
  }
  directives[prefix] = directive;
  return () => {
    delete directivesWithoutParams[prefix];
    delete directives[prefix];
  };
};

// @ts-expect-error unchecked overload
export const jsx: JSXFactory = (
  type: FunctionalComponent | ComponentClass | string,
  props: Partial<Props<PropsBase, JSXChildNode, {}>>,
  ...children: JSXChild[]
): JSX.Element => {
  props ??= {};
  if (children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }
  if (typeof type === "string") {
    return (attach): Rendered<object> => {
      let lastElementFactory = currentElementFactory;
      const isSvg = type === "svg";
      const isForeignObject = type === "foreignObject";
      const isMath = type === "math";
      const changnigFactory = isSvg || isForeignObject || isMath;
      const { children, ref, ...attributes } = props;
      //#region enter xml namespaced element creation scope
      if (isSvg) {
        // @ts-expect-error Skipped type check for svg children.
        currentElementFactory = svg;
      }
      if (isMath) {
        currentElementFactory = mathml;
      }
      //#endregion
      let el: Element;
      if (isForeignObject) {
        currentElementFactory = element;
      }
      if (!isElement(ref)) {
        el = currentElementFactory(type, "is" in props && isString(props.is) ? { is: props.is } : void 0);
        if (ref) {
          setRef(ref, el);
        }
      } else {
        if (__DEV__ && type !== ref.tagName.toLowerCase()) {
          warn(
            `Tags of JSX and provided element reference does not match: "${type}" in JSX but "${ref.tagName.toLowerCase()}" in ref`
          );
        }
        el = ref;
      }
      const [cleanups] = children != null ? renderChild(children, appendChild(el)) : [[]];
      for (const key in attributes) {
        // @ts-expect-error for-in key access
        const value = attributes[key];
        let directive: JSXDirective<any> | undefined = directivesWithoutParams[key];
        let params: string | null = null;
        if (!directive) {
          const directiveIndex = key.indexOf(":");
          if (directiveIndex > 0) {
            const directiveName = key.slice(0, directiveIndex);
            directive = directives[directiveName];
            if (directive) {
              params = key.slice(directiveIndex + 1);
            }
          }
        }
        if (directive) {
          const cleanup = directive.apply(el, params, value);
          if (cleanup) {
            push(cleanups, cleanup);
          }
          continue;
        }
        // normal attribute binding & event handlers
        if (isSubscribable(value)) {
          // @ts-expect-error skip generic type check
          push(cleanups, $attr(el, key, value));
        } else {
          if (key.startsWith("on")) {
            const next = key[2];
            if ("A" <= next && next <= "Z") {
              const event = key.slice(2).toLowerCase();
              if (isFunction(value)) {
                push(cleanups, _listen(el, event, value));
                continue;
              } else if (isObjectEventHandler(value)) {
                push(cleanups, _listen(el, event, value, value.options));
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
      return [applyAllStatic(cleanups), el, () => [el, el]];
    };
  }
  if (isComponentClass(type)) {
    return (attach) => {
      // @ts-expect-error Dynamic Implementation
      const instance: ClassComponentInstance<T> = new type(props);
      return instance.mount(attach);
    };
  }
  if (type.customRef) {
    return createFunctionalComponentMountable(type, props);
  }
  const { ref, ...otherProps } = props;
  const mountable = createFunctionalComponentMountable(type, otherProps);
  if (!ref) {
    return mountable;
  }
  return (attach) => {
    const rendered = mount(mountable, attach);
    setRef(ref, rendered[1]);
    return rendered;
  };
};
export const jsxs = jsx;
export const h = jsx;
export const createElement = jsx;
/**
 * Create a jsx ref object to fetch the DOM element when mounted.
 */
export const jsxRef = <E>(): Later<E> => ({
  current: null,
});

/**
 * Assign reference.
 */
export const setRef = <E>(ref: Later<E>, value: E) => {
  // TODO check reference object
  ref.current = value;
};

export const Fragment: FunctionalComponent<{}, JSXChildNode | undefined> = ({ children }) => {
  return (attach) => {
    const f = fragment();
    const [cleanups, getRange] = children ? renderChild(children, appendChild(f)) : [[], noop];
    attach(f);
    return [applyAllStatic(cleanups), void 0, getRange];
  };
};
