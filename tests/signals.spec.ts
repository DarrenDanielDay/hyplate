import { alwaysDifferent } from "../dist/toolkit";
import { computed, effect, setComparator, signal, watch } from "../dist/signals";

describe("store.ts", () => {
  describe("setDiffer", () => {
    it("should set comparator as given", () => {
      setComparator(alwaysDifferent);
      const s = signal(0);
      const subscriber = import.meta.jest.fn();
      const cleanup = watch(s, subscriber);
      expect(subscriber).toBeCalledTimes(1);
      s.set(0);
      expect(subscriber).toBeCalledTimes(2);
      s.set(0);
      expect(subscriber).toBeCalledTimes(3);
      setComparator(null);
      cleanup();
    });
  });
  describe("signal", () => {
    it("should notify change", () => {
      const src = signal("1");
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = watch(src, subscriber);
      expect(src()).toBe("1");
      src.set("2");
      expect(subscriber).toBeCalledWith("2");
      cleanup();
    });
    it("should prevent unnecessary dispatch", () => {
      const src = signal("1");
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
    describe("mutate", () => {
      it("should dispatch with same object", () => {
        const s = signal({ count: 0 });
        const fn = import.meta.jest.fn();
        expect(fn).toBeCalledTimes(0);
        watch(s, fn);
        expect(fn).toBeCalledTimes(1);
        s.mutate((p) => {
          p.count++;
        });
        expect(fn).toBeCalledTimes(2);
      });
    });
  });
  describe("computed", () => {
    it("should notify change", () => {
      const src = signal("1");
      const q = computed(() => `current value: ${src()}`);
      const subscriber = import.meta.jest.fn<void, [string]>();
      const cleanup = watch(q, subscriber);
      expect(subscriber).toBeCalledWith("current value: 1");
      expect(q()).toBe("current value: 1");
      src.set("2");
      expect(subscriber).toBeCalledWith("current value: 2");
      expect(subscriber).toBeCalledTimes(2);
      cleanup();
    });
    it("should prevent unnecessary dispatch", () => {
      const src = signal(0);
      const subscriber = import.meta.jest.fn<void, [number]>();
      const selector = import.meta.jest.fn(() => src() % 2);
      const q = computed(selector);
      const cleanup = watch(q, subscriber);
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
      const src = signal(1);
      const doubleSrc = computed(() => src() * 2);
      const doubleSrcAdd1 = computed(() => doubleSrc() + 1);
      const subscriber = import.meta.jest.fn<void, [number]>();
      const cleanup = watch(doubleSrcAdd1, subscriber);
      expect(doubleSrcAdd1()).toBe(3);
      expect(subscriber).toBeCalledWith(3);
      src.set(2);
      expect(doubleSrcAdd1()).toBe(5);
      expect(subscriber).toBeCalledWith(5);
      expect(subscriber).toBeCalledTimes(2);
      cleanup();
    });
    it("should update subscription", () => {
      const num = signal(0);
      const bool = signal(false);
      const q = computed(() => (bool() ? num() : -1));
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
      const src = signal(0);
      const evaluate = import.meta.jest.fn(() => src() * 2);
      const doubleSrc = computed(evaluate);
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
      const s = signal(0);
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
      cleanup1();
      cleanup2();
    });
  });
  describe("effect", () => {
    it("should run immediately", () => {
      const fn = import.meta.jest.fn();
      const unsubscribe = effect(fn);
      expect(fn).toBeCalledTimes(1);
      unsubscribe();
    });

    it("should re-run when dependencies are updated", () => {
      const count = signal(0);
      const double = computed(() => count() * 2);
      const increase = () => count.update((c) => c + 1);
      const fn = import.meta.jest.fn(() => {
        expect(double() % 2).toBe(0);
      });
      const unsubscribe = effect(fn);
      expect(fn).toBeCalledTimes(1);
      increase();
      expect(fn).toBeCalledTimes(2);
      increase();
      expect(fn).toBeCalledTimes(3);
      expect(count()).toBe(2);
      unsubscribe();
    });
    it("should run exactly once with an action of writing signal value", () => {
      const count = signal(0);
      const double = computed(() => count() * 2);
      const fn = import.meta.jest.fn(() => {
        expect(double()).toBe(count() * 2);
      });
      const unsubscribe = effect(fn);
      expect(fn).toBeCalledTimes(1);
      count.mutate((c) => c + 1);
      expect(fn).toBeCalledTimes(2);
      unsubscribe();
    });
  });
});
