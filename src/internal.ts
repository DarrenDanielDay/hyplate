/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { remove } from "./core.js";
import type { CleanUpFunc, Rendered } from "./types.js";
import { __DEV__ } from "./util.js";

export const comment = (message: string) => document.createComment(__DEV__ ? message : "");

export const withCommentRange = (message: string): Rendered<[begin: Comment, end: Comment, clear: CleanUpFunc]> => {
  const begin = comment(` ${message} begin `);
  const end = comment(` ${message} end `);
  return [
    () => {
      remove(begin);
      remove(end);
    },
    [
      begin,
      end,
      () => {
        const range = new Range();
        range.setStart(begin, begin.length);
        range.setEnd(end, 0);
        range.deleteContents();
        range.detach();
      },
    ],
    () => [begin, end],
  ];
};
