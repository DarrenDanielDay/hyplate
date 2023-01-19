import { element } from "../dist/core";
import { alwaysDifferent, deepDiffer, useBinding } from "../dist/toolkit";
// @ts-expect-error internal exports
import { enterHooks, quitHooks } from "../dist/hooks";
import type { CleanUpFunc } from "../dist/types";
import { source } from "../dist/store";
import { noop } from "../dist/util";
import { setHyplateStore } from "./configure-store";
import { resetBinding } from "../dist/binding";
describe("toolkit.ts", () => {
  describe("always different", () => {
    it("should always return false", () => {
      expect(alwaysDifferent(1, 2)).toBe(false);
      expect(alwaysDifferent(1, 1)).toBe(false);
      expect(alwaysDifferent(NaN, NaN)).toBe(false);
    });
  });
  describe("deep differ", () => {
    it("should compare object deep", () => {
      expect(deepDiffer({ a: 1 }, { a: 1 })).toBe(true);
      expect(deepDiffer({ a: 1 }, { a: 2 })).toBe(false);
      expect(deepDiffer({ a: { b: [] } }, { a: { b: [] } })).toBe(true);
      expect(deepDiffer({ a: { b: [] } }, { a: { b: [1] } })).toBe(false);
      expect(deepDiffer({ a: { b: [] } }, { a: { b: [] }, c: 0 })).toBe(false);
      expect(deepDiffer({ a: { b: [] } }, { a: { b: [1] }, c: 0 })).toBe(false);
    });

    it("should compare using `Object.is` logic", () => {
      expect(deepDiffer(NaN, NaN)).toBe(true);
    });
  });
  describe("use bind", () => {
    beforeAll(() => {
      setHyplateStore();
    });
    afterEach(() => {
      document.body.innerHTML = "";
    });
    afterAll(() => {
      resetBinding();
    });
    it("should call hooks", () => {
      expect(() => {
        useBinding(element("div"));
      }).toThrow(/invalid hook call/i);
    });
    it("should register cleanup", () => {
      const cleanups = new Set<CleanUpFunc>();
      const cleanUpCollector = import.meta.jest.fn<CleanUpFunc, [CleanUpFunc]>((a) => {
        cleanups.add(a);
        return noop;
      });
      enterHooks({ useCleanUpCollector: () => cleanUpCollector });
      const el = element("div");
      document.body.appendChild(el);
      const binding = useBinding(el);
      binding.attr("id", source("aaa"));
      expect(el.id).toBe("aaa");
      binding.content`Using useBind().content ${0} ${source(1)}`;
      expect(el.textContent).toBe(`Using useBind().content 0 1`);
      binding.text(source("Now changed"));
      expect(el.textContent).toBe("Now changed");
      const handler = import.meta.jest.fn();
      binding.event("click", handler);
      el.click();
      expect(handler).toBeCalledTimes(1);
      binding.delegate("click", handler);
      el.click();
      expect(handler).toBeCalledTimes(3);
      quitHooks();
      cleanups.forEach((c) => c());
      el.click();
      expect(handler).toBeCalledTimes(3);
    });
  });
});
