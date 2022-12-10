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

export const push = <T extends unknown>(arr: T[], val: T) => arr.push(val);

export const pop = <T extends unknown>(arr: T[]) => arr.pop();

export const noop = () => {};

export const applyAll = (cleanups: Iterable<() => void>) => () => {
  for (const cleanup of cleanups) {
    cleanup();
  }
};

export const isString = (v: unknown): v is string => typeof v === "string";

export const isFunction = (v: unknown): v is AnyFunc => typeof v === "function";

export const isObject = (v: unknown): v is object => v != null && typeof v === "object";

export const compare = Object.is;

export const err = (error: unknown) => {
  const msg =
    error instanceof Error
      ? `stack trace: 
${error.stack}`
      : JSON.stringify(error);
  console.error(`[ERROR]: ${msg}`);
};

export const warn = <T extends unknown>(msg: string, value: T) => {
  if (__DEV__) {
    console.warn(msg);
  }
  return value;
};
