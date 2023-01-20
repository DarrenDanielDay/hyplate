import { $attr, $content, $text, isSubscribable, resetBinding, subscribe } from "../dist/binding";
import { appendChild, element } from "../dist/core";
import { source } from "../dist/store";
import { setHyplateStore } from "./configure-store";

describe("binding.ts", () => {
  describe("bindText", () => {
    beforeAll(() => {
      setHyplateStore();
    });
    afterAll(() => {
      resetBinding();
    });
    it("should bind textContent", () => {
      const data = source("1");
      const p = element("p");
      $content(p, data);
      expect(p.textContent).toBe("1");
      data.set("2");
      expect(p.textContent).toBe("2");
    });
  });
  describe("interpolation", () => {
    beforeAll(() => {
      setHyplateStore();
    });
    afterAll(() => {
      resetBinding();
    });
    it("should bind textContent with reactive store", () => {
      const p = document.createElement("p");
      const a1 = source(1);
      const fn = $text`print: ${a1}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      a1.set(2);
      expect(p.textContent).toBe("print: 2");
      fn();
    });

    it("should insert text with primitive values", () => {
      const p = document.createElement("p");
      const content = "1";
      const fn = $text`print: ${content}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      fn();
    });

    it("should emit error when called with invalid templates arguments", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      $text(["111", "222", "333"], "");
      expect(fn).toBeCalled();
      fn.mockReset();
      fn.mockRestore();
    });

    it("should emit error when called with non-reactive object child expression", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      $text(["111", "222"], {});
      expect(fn).toBeCalled();
      fn.mockReset();
      fn.mockRestore();
    });
  });

  describe("bindAttr", () => {
    beforeAll(() => {
      setHyplateStore();
    });
    afterAll(() => {
      resetBinding();
    });
    it("should bind attribute", () => {
      const disabled = source(false);
      const button = document.createElement("button");
      const cleanup = $attr(button, "disabled", disabled);
      expect(button.disabled).toBeFalsy();
      disabled.set(true);
      expect(button.disabled).toBeTruthy();
      cleanup();
      disabled.set(false);
      expect(button.disabled).toBeTruthy();
    });
  });

  describe("warnings", () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
      warnSpy = import.meta.jest.spyOn(console, "warn");
      warnSpy.mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
    it("should emit warning if not configured", () => {
      resetBinding();
      const s = source(0);
      subscribe(s, () => {});
      expect(warnSpy).toBeCalledTimes(2);
      isSubscribable(s);
      expect(warnSpy).toBeCalledTimes(3);
    });
  });
});
