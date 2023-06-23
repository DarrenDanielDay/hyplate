import { $attr, $content, $text, isSubscribable, resetBinding, subscribe } from "../dist/binding";
import { appendChild, element } from "../dist/core";
import { signal } from "../dist/signals";
import { setHyplateStore } from "./configure-store";
import { useConsoleSpy } from "./test-util";

describe("binding.ts", () => {
  describe("bindText", () => {
    beforeAll(() => {
      setHyplateStore();
    });
    afterAll(() => {
      resetBinding();
    });
    it("should bind textContent", () => {
      const data = signal("1");
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
    const spy = useConsoleSpy();
    it("should bind textContent with reactive store", () => {
      const p = document.createElement("p");
      const a1 = signal(1);
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
      // @ts-expect-error invalid usage
      $text(["111", "222", "333"], "");
      expect(spy.error).toBeCalled();
    });

    it("should emit error when called with non-reactive object child expression", () => {
      // @ts-expect-error invalid usage
      $text(["111", "222"], {});
      expect(spy.error).toBeCalled();
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
      const disabled = signal(false);
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
    const spy = useConsoleSpy();
    it("should emit warning if not configured", () => {
      resetBinding();
      const s = signal(0);
      subscribe(s, () => {});
      expect(spy.warn).toBeCalledTimes(2);
      isSubscribable(s);
      expect(spy.warn).toBeCalledTimes(3);
    });
  });
});
