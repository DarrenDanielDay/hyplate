import { signal } from "../dist/signals";
import {
  applyAll,
  err,
  isFunction,
  isObject,
  isString,
  noop,
  objectEntriesMap,
  once,
  patch,
  scopes,
  warned,
} from "../dist/util";
import { useConsoleSpy } from "./test-util";
describe("util.ts", () => {
  describe("patch", () => {
    it("should be alias of `Object.assign`", () => {
      expect(patch).toBe(Object.assign);
    });
  });
  describe("once", () => {
    it("should execute `evaluate` only once", () => {
      const impl = import.meta.jest.fn(() => ({}));
      const wrapped = once(impl);
      expect(impl).toBeCalledTimes(0);
      const v1 = wrapped();
      const v2 = wrapped();
      expect(v1).toBe(v2);
      expect(impl).toBeCalledTimes(1);
    });
  });
  describe("scopes", () => {
    it("should make scope stack", () => {
      const [enter, quit, resolve] = scopes<number>();
      expect(resolve()).toBeUndefined();
      enter(0);
      expect(resolve()).toBe(0);
      enter(1);
      expect(resolve()).toBe(1);
      enter(2);
      expect(resolve()).toBe(2);
      quit();
      expect(resolve()).toBe(1);
      quit();
      expect(resolve()).toBe(0);
      quit();
      expect(resolve()).toBeUndefined();
    });
  });
  describe("noop", () => {
    it("should have no return value", () => {
      expect(noop()).toBeUndefined();
    });
  });
  describe("type guards", () => {
    it("should test string", () => {
      expect(isString("")).toBeTruthy();
      expect(isString(noop)).toBeFalsy();
      expect(isString(1)).toBeFalsy();
      expect(isString(signal(null))).toBeFalsy();
    });
    it("should test object", () => {
      expect(isObject("")).toBeFalsy();
      expect(isObject(1)).toBeFalsy();
      expect(isObject(signal(null))).toBeFalsy();
    });
    it("should test function", () => {
      expect(isFunction("")).toBeFalsy();
      expect(isFunction(noop)).toBeTruthy();
      expect(isFunction(1)).toBeFalsy();
      expect(isFunction(signal(null))).toBeTruthy();
    });
  });
  describe("applyAll", () => {
    it("should apply every function", () => {
      const funcs = Array.from({ length: 3 }, () => import.meta.jest.fn());
      applyAll(funcs);
      for (const fn of funcs) {
        expect(fn).toBeCalledTimes(1);
      }
    });
  });
  describe("err", () => {
    const spy = useConsoleSpy();
    it("should log error stack", () => {
      const error = new Error();
      err(error);
      expect(spy.error).toBeCalledTimes(1);
    });
    it("should log JSON", () => {
      const error = { foo: "bar" };
      err(error);
      expect(spy.error).toBeCalledWith(`[ERROR]: ${JSON.stringify(error)}`);
    });
  });
  describe("warn", () => {
    const spy = useConsoleSpy();
    it("should warn message in console under development mode", () => {
      const obj = {};
      const returned = warned("The message", obj);
      expect(returned).toBe(obj);
      expect(spy.warn).toBeCalledWith("The message");
    });
  });

  describe("object entries map", () => {
    it("should map object entries", () => {
      expect(
        objectEntriesMap({ a: 1, b: 2 }, ([key, value]) => {
          return `${key}${value * 2}`;
        })
      ).toStrictEqual({
        a: "a2",
        b: "b4",
      });
    });
  });
});
