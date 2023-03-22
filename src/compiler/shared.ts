/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
export const str = (exp: unknown) => JSON.stringify(exp);

// @ts-expect-error Dynamic Implementation
export const capitalize = <S extends string>(str: S): Capitalize<S> => `${str[0]?.toUpperCase()}${str.slice(1)}`;

export const tabs = (indent: number) => " ".repeat(indent * 2);

export const mergedOptions =
  <T extends object>(defaults: T) =>
  (options: Partial<T>): T => {
    const merged = Object.fromEntries(
      Object.entries(defaults).map(([key, defaultValue]) => [key, Reflect.get(options, key) ?? defaultValue])
    );
    // @ts-expect-error Dynamic Implementation
    return merged;
  };

export const createObjLikeExp = (props: Record<string, string>, indent: number, lineBreak: string) => {
  const propSpace = tabs(indent + 1);
  return `{${Object.entries(props)
    .map(
      ([key, value]) => `
${propSpace}${str(key)}: ${value}${lineBreak}`
    )
    .join("")}
${tabs(indent)}}`;
};

export const replaceExt = (path: string, suffix: string) => path.replace(/\.html$/, suffix);

export const sourceName = (path: string) => path.split(/[\\\/]/g).at(-1)!;
