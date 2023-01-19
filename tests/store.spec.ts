import { alwaysDifferent } from "../dist/toolkit";
import { query, setDiffer, source, watch } from "../dist/store";

describe("store.ts", () => {
  describe("setDiffer", () => {
    it("should set differ as given", () => {
      setDiffer(alwaysDifferent);
      const s = source(0);
      const subscriber = import.meta.jest.fn();
      const cleanup = watch(s, subscriber);
      expect(subscriber).toBeCalledTimes(1);
      s.set(0);
      expect(subscriber).toBeCalledTimes(2);
      s.set(0);
      expect(subscriber).toBeCalledTimes(3);
      setDiffer(null);
      cleanup();
    });
  });
  describe("source", () => {
    it("should notify change", () => {
      const src = source("1");
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = watch(src, subscriber);
      expect(src.val).toBe("1");
      src.set("2");
      expect(subscriber).toBeCalledWith("2");
      cleanup();
    });
    it("should prevent unnecessary dispatch", () => {
      const src = source("1");
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = watch(src, subscriber);
      expect(subscriber).toBeCalledWith("1");
      expect(subscriber).toBeCalledTimes(1);
      src.set("1");
      src.set("1");
      src.set("1");
      expect(subscriber).toBeCalledTimes(1);
      cleanup();
    });
  });
  describe("query", () => {
    it("should notify change", () => {
      const src = source("1");
      const q = query(() => `current value: ${src.val}`);
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = watch(q, subscriber);
      expect(subscriber).toBeCalledWith("current value: 1");
      expect(q.val).toBe("current value: 1");
      src.set("2");
      expect(subscriber).toBeCalledWith("current value: 2");
      expect(subscriber).toBeCalledTimes(2);
      cleanup();
    });
    it("should prevent unnecessary dispatch", () => {
      const src = source(0);
      const subscriber = import.meta.jest.fn<void, [number]>();
      const selector = import.meta.jest.fn(() => src.val % 2);
      const computed = query(selector);
      const cleanup = watch(computed, subscriber);
      expect(selector).toBeCalledTimes(1);
      expect(subscriber).toBeCalledWith(0);
      expect(subscriber).toBeCalledTimes(1);
      src.set(2);
      expect(subscriber).toBeCalledTimes(1);
      src.set(4);
      expect(subscriber).toBeCalledTimes(1);
      src.set(6);
      expect(subscriber).toBeCalledTimes(1);
      expect(selector).toBeCalledTimes(4);
      cleanup();
    });
    it("should chain deps", () => {
      const src = source(1);
      const doubleSrc = query(() => src.val * 2);
      const doubleSrcAdd1 = query(() => doubleSrc.val + 1);
      const subscriber = import.meta.jest.fn<void, [number]>();
      const cleanup = watch(doubleSrcAdd1, subscriber);
      expect(doubleSrcAdd1.val).toBe(3);
      expect(subscriber).toBeCalledWith(3);
      src.set(2);
      expect(doubleSrcAdd1.val).toBe(5);
      expect(subscriber).toBeCalledWith(5);
      expect(subscriber).toBeCalledTimes(2);
      cleanup();
    });
    it("should update subscription", () => {
      const num = source(0);
      const bool = source(false);
      const q = query(() => (bool.val ? num.val : -1));
      const fn = import.meta.jest.fn();
      const cleanup = watch(q, fn);
      expect(fn).toBeCalledTimes(1);
      num.set(1);
      expect(fn).toBeCalledTimes(1);
      bool.set(true);
      expect(fn).toBeCalledTimes(2);
      num.set(2);
      expect(fn).toBeCalledTimes(3);
      bool.set(false);
      expect(fn).toBeCalledTimes(4);
      num.set(3);
      expect(fn).toBeCalledTimes(4);
      cleanup();
    });
    it("should not evaluate selector with no subscription", () => {
      const src = source(0);
      const evaluate = import.meta.jest.fn(() => src.val * 2);
      const doubleSrc = query(evaluate);
      src.set(1);
      expect(evaluate).toBeCalledTimes(0);
      const watcher = import.meta.jest.fn();
      const unwatch = watch(doubleSrc, watcher);
      expect(evaluate).toBeCalledTimes(1);
      expect(watcher).toBeCalledTimes(1);
      src.set(2);
      expect(evaluate).toBeCalledTimes(2);
      expect(watcher).toBeCalledTimes(2);
      unwatch();
      src.set(3);
      expect(evaluate).toBeCalledTimes(2);
      expect(watcher).toBeCalledTimes(2);
    });
  });
  describe("dispatch", () => {
    it("should continue to dispatch when some subscribers emitted errors", () => {
      const s = source(0);
      const errorSpy = import.meta.jest.spyOn(console, "error");
      errorSpy.mockImplementation(() => {});

      const cleanup1 = watch(s, (latest) => {
        if (latest === 1) {
          throw new Error("fake error");
        }
      });

      const subscriber = import.meta.jest.fn();
      const cleanup2 = watch(s, subscriber);
      expect(subscriber).toBeCalledTimes(1);
      s.set(1);
      expect(subscriber).toBeCalledTimes(2);
      expect(errorSpy).toBeCalledTimes(1);
      cleanup1();
      cleanup2();
      errorSpy.mockReset();
      errorSpy.mockRestore();
    });
  });
});
