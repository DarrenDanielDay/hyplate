/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { AnyFunc } from "./types.js";

export let __DEV__ = process.env.NODE_ENV !== "production";

export const setMode = (isDev: boolean) => (__DEV__ = isDev);

export const patch: <T extends unknown>(a: T, b: Partial<T>) => T = Object.assign;

export const once = <T extends unknown>(evaluate: () => T) => {
  let evaluated = false;
  let value: T;
  return (): T => {
    if (evaluated) {
      return value;
    }
    evaluated = true;
    return (value = evaluate());
  };
};

export const scopes = <T extends {}>() => {
  const stack: T[] = [];
  const resolve = () => stack.at(-1);
  const enter = (val: T) => push(stack, val);
  const quit = () => {
    pop(stack);
  };
  return [enter, quit, resolve] as const;
};

export const arrayFrom = Array.from;

export const push = <T extends unknown>(arr: T[], val: T) => arr.push(val);

export const pop = <T extends unknown>(arr: T[]) => arr.pop();

export const noop = () => {};

export const applyAll = (cleanups: (() => void)[]) => {
  // The side effects are revoked in the reversed order.
  for (let i = cleanups.length - 1; i >= 0; i--) {
    cleanups[i]!();
  }
};

/**
 * In many cases the `cleanups` array never grow. In that case we can use `noop` for fewer memory usage.
 */
export const applyAllStatic = (cleanups: (() => void)[]): (() => void) =>
  cleanups.length ? () => applyAll(cleanups) : noop;

export const isString = (v: unknown): v is string => typeof v === "string";

export const isFunction = (v: unknown): v is AnyFunc => typeof v === "function";

export const isObject = (v: unknown): v is object => v != null && typeof v === "object";

export const isArray = Array.isArray;

export const isInstance =
  <T>(ctor: new (...args: any[]) => T) =>
  (value: unknown): value is T =>
    value instanceof ctor;

export const strictEqual = Object.is;

export const defineProp = Object.defineProperty;

export const compare = Object.is;

export const err = (error: unknown) => {
  const msg =
    error instanceof Error
      ? `stack trace: 
${error.stack}`
      : JSON.stringify(error);
  console.error(`[ERROR]: ${msg}`);
};

export const warn = (msg: unknown) => {
  if (__DEV__) {
    console.warn(msg);
  }
};

export const warned = <T extends unknown>(msg: string, value: T) => {
  warn(msg);
  return value;
};

export const objectEntriesMap = <T, R>(obj: Record<string, T>, mapper: ([k, v]: [string, T]) => R) =>
  Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, mapper([key, value])]));

export const fori = <T extends unknown>(arrayLike: ArrayLike<T>, callback: (element: T) => void) => {
  for (let i = 0, l = arrayLike.length; i < l; i++) callback(arrayLike[i]);
};
