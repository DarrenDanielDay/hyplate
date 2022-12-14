/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { removeRange } from "./core.js";
import type { CleanUpFunc, Rendered } from "./types.js";
import { __DEV__ } from "./util.js";

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

export const unmount = (rendered: Rendered<any>) => {
  const [cleanup, , getRange] = rendered;
  cleanup();
  removeRange(getRange);
};

export const $$HyplateSubscribers: unique symbol = "_$subs" as never;
