import { query, source, subscribe } from "../dist/store";

describe("store.ts", () => {
  describe("source", () => {
    it("should notify change", () => {
      const src = source("1");
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = subscribe(src, subscriber);
      expect(src.val).toBe("1");
      src.set("2");
      expect(subscriber).toBeCalledWith("2");
      cleanup();
    });
  });
  describe("query", () => {
    it("should notify change", () => {
      const src = source("1");
      const q = query(() => `current value: ${src.val}`);
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = subscribe(q, subscriber);
      expect(subscriber).toBeCalledWith("current value: 1");
      expect(q.val).toBe("current value: 1");
      src.set("2");
      expect(subscriber).toBeCalledWith("current value: 2");
      expect(subscriber).toBeCalledTimes(2);
      cleanup();
    });
    it("should prevent unnecessary dispatch", () => {
      const src = source("1");
      const subscriber = import.meta.jest.fn<void, [string]>();
      subscribe(src, subscriber);
      expect(subscriber).toBeCalledWith("1");
      expect(subscriber).toBeCalledTimes(1);
      src.set("1");
      src.set("1");
      src.set("1");
      expect(subscriber).toBeCalledTimes(1);
    });
    it("should chain deps", () => {
      const src = source(1);
      const doubleSrc = query(() => src.val * 2);
      const doubleSrcAdd1 = query(() => doubleSrc.val + 1);
      const subscriber = import.meta.jest.fn<void, [number]>();
      subscribe(doubleSrcAdd1, subscriber);
      expect(doubleSrcAdd1.val).toBe(3);
      expect(subscriber).toBeCalledWith(3);
      src.set(2);
      expect(doubleSrcAdd1.val).toBe(5);
      expect(subscriber).toBeCalledWith(5);
      expect(subscriber).toBeCalledTimes(2);
    });
    it("should update subscription", () => {});
  });
});
