/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { Position } from "source-map";

export const countLineChars = (source: string) => {
  const lines: number[] = [];
  const sourceLength = source.length;
  let lineChars = 0;
  for (let i = 0; i < sourceLength; i++) {
    const char = source[i]!;
    lineChars++;
    if (char === "\n") {
      lines.push((lines.at(-1) ?? 0) + lineChars);
      lineChars = 0;
    }
  }
  if (lineChars) {
    // For the last line without new line:
    lines.push((lines.at(-1) ?? 0) + lineChars);
  }
  return lines;
};

export const locate = (lines: number[], index: number): Position => {
  let left = 0,
    right = lines.length - 1;
  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    if (index > lines[mid]!) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return {
    line: left + 1,
    column: index - (lines[left - 1] ?? 0),
  };
};

export const createLocator = (source: string) => {
  const lines = countLineChars(source);
  return (index: number) => {
    return locate(lines, index);
  };
};
