import { remove } from "./core.js";
import type { CleanUpFunc, Rendered } from "./types.js";
import { __DEV__ } from "./util.js";
export const comment = (message?: string) => new Comment(__DEV__ ? message : "");
/**
 * @internal
 */
export const withComments = (message: string): Rendered<[begin: Comment, end: Comment, clear: CleanUpFunc]> => {
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
  ];
};
