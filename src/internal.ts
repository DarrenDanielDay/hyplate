/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { CleanUpFunc, NativeSlotContent, Reflection } from "./types.js";
import { isInstance, noop, push, __DEV__ } from "./util.js";

export const comment = (message: string) => document.createComment(__DEV__ ? message : "");

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

export const isNode = isInstance(Node);

export const isFragment = isInstance(DocumentFragment);

export const isTemplate = isInstance(HTMLTemplateElement);

const isText = isInstance(Text);
const isElement = isInstance(Element);

export const isValidSlotContent = (node: unknown): node is NativeSlotContent => isText(node) || isElement(node);

export const reflection: Reflection<string> = new Proxy({}, { get: (_, k) => k });

export const $$HyplateSubscribers: unique symbol = "_$subs" as never;
