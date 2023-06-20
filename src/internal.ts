/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type {
  CleanUpFunc,
  ComponentMeta,
  EventHandlerOptions,
  FunctionalEventHanlder,
  Handler,
  NativeSlotContent,
  Reflection,
} from "./types.js";
import { err, fori, isInstance, noop, push, __DEV__, scopes } from "./util.js";

export const doc = document;

export const comment = (message: string) => doc.createComment(__DEV__ ? message : "");

export const withCommentRange = (message: string): [begin: Comment, end: Comment, clearRange: CleanUpFunc] => {
  const begin = comment(` ${message} begin `);
  const end = comment(` ${message} end `);
  return [
    begin,
    end,
    () => {
      const range = new Range();
      range.setStart(begin, begin.length);
      range.setEnd(end, 0);
      range.deleteContents();
      range.detach();
    },
  ];
};

export const addCleanUp = (cleanups: CleanUpFunc[], cleanup: CleanUpFunc) => {
  if (cleanup !== noop) {
    push(cleanups, cleanup);
  }
};

export const _listen = (
  target: EventTarget,
  name: string,
  hander: Handler<any, any>,
  options?: EventHandlerOptions
): CleanUpFunc => {
  target.addEventListener(name, hander, options);
  return () => {
    target.removeEventListener(name, hander, options);
  };
};

export const _delegate = (el: Element, event: string, handler: FunctionalEventHanlder<any, any>) => {
  const root = el.ownerDocument;
  const delegatedEvents = (root.$$delegates ??= new Set<string>());
  if (!delegatedEvents.has(event)) {
    delegatedEvents.add(event);
    root.addEventListener(event, globalDelegateEventHandler);
  }
  const handlerProperty = `_$${event}` as const;
  el[handlerProperty] = handler;
  return () => {
    delete el[handlerProperty];
  };
};

const globalDelegateEventHandler = (e: Event) => {
  const eventHandlerProperty = `_$${e.type}` as const;
  const targets = e.composedPath();
  fori(targets, (target) => {
    const handler = target[eventHandlerProperty];
    if (handler != null) {
      try {
        handler.call(target, e);
      } catch (error) {
        err(error);
      }
    }
  });
};

export const isNode = /* #__PURE__ */ isInstance(Node);

export const isFragment = /* #__PURE__ */ isInstance(DocumentFragment);

export const isTemplate = /* #__PURE__ */ isInstance(HTMLTemplateElement);

const isText = /* #__PURE__ */ isInstance(Text);

const isElement = /* #__PURE__ */ isInstance(Element);

export const isValidSlotContent = (node: unknown): node is NativeSlotContent => isText(node) || isElement(node);

export const [enterComponentCtx, quitComponentCtx, currentComponentCtx] = /* #__PURE__ */ scopes<ComponentMeta>();

export const reflection: Reflection<string> = /* #__PURE__ */ new Proxy({}, { get: (_, k) => k });

export const $$HyplateQuery: unique symbol = /* #__PURE__ */ Symbol.for("hyplate-query");

export const $$HyplateComponentMeta: unique symbol = /* #__PURE__ */ Symbol.for("hyplate-component-meta");
