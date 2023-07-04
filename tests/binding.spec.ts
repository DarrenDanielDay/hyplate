import {
  $attr,
  $class,
  $content,
  $model,
  $style,
  $text,
  $var,
  dispatch,
  isSubscribable,
  isWritable,
  resetBinding,
  subscribe,
} from "../dist/binding";
import { appendChild, attr, element } from "../dist/core";
import { signal } from "../dist/signals";
import { useSignals } from "./configure-store";
import { mockChange, mockInput } from "./dom-api-mock";
import { useConsoleSpy } from "./test-util";

describe("binding.ts", () => {
  describe("$content", () => {
    useSignals();
    it("should bind textContent", () => {
      const data = signal("1");
      const p = element("p");
      $content(p, data);
      expect(p.textContent).toBe("1");
      data.set("2");
      expect(p.textContent).toBe("2");
    });
  });
  describe("$text", () => {
    useSignals();
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

  describe("$attr", () => {
    useSignals();
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

  describe("$class", () => {
    useSignals();
    it("should bind class", () => {
      const el = element("div");
      const foo = signal(true);
      expect(el.classList.contains("foo")).toBeFalsy();
      $class(el, "foo", foo);
      expect(el.classList.contains("foo")).toBeTruthy();
      foo.set(false);
      expect(el.classList.contains("foo")).toBeFalsy();
    });
  });

  describe("$style", () => {
    useSignals();
    it("should bind style", () => {
      const el = element("div");
      const foo = signal<string | null>(null);
      expect(el.style.zIndex).toBe("");
      $style(el, "zIndex", foo);
      expect(el.style.zIndex).toBe("");
      foo.set("0");
      expect(el.style.zIndex).toBe("0");
      foo.set(null);
      expect(el.style.zIndex).toBe("");
    });
  });

  describe("$var", () => {
    useSignals();
    it("should bind css variables", () => {
      const el = element("div");
      const foo = signal<string | null>(null);
      expect(el.style.getPropertyValue("--foo")).toBe("");
      $var(el, "foo", foo);
      expect(el.style.getPropertyValue("--foo")).toBe("");
      foo.set("0");
      expect(el.style.getPropertyValue("--foo")).toBe("0");
      foo.set(null);
      expect(el.style.getPropertyValue("--foo")).toBe("");
    });
  });

  describe("$model", () => {
    useSignals();
    it("should bind <input>", () => {
      const input = element("input");
      const text = signal("init");

      const observer = import.meta.jest.fn();
      const unsubscribe1 = subscribe(text, observer);
      expect(observer).toBeCalledTimes(1);

      expect(input.value).toBe("");
      const unsubscribe2 = $model(input, text);
      expect(input.value).toBe("init");
      mockInput(input, "inita");
      expect(text()).toBe("inita");
      expect(observer).toBeCalledTimes(2);
      unsubscribe1();
      unsubscribe2();
      // test unbind logic
      mockInput(input, "initab");
      expect(observer).toBeCalledTimes(2);
    });
    it("should bind <input type='number'>", () => {
      const input = element("input");
      attr(input, "type", "number");
      const count = signal(0);

      const observer = import.meta.jest.fn();
      const unsubscribe1 = subscribe(count, observer);
      expect(observer).toBeCalledTimes(1);
      expect(input.valueAsNumber).toBeNaN();
      const unsubscribe2 = $model(input, count, { as: "number" });
      expect(input.valueAsNumber).toBe(0);

      mockInput(input, "123");
      expect(count()).toBe(123);
      expect(input.valueAsNumber).toBe(123);
      expect(observer).toBeCalledTimes(2);
      unsubscribe1();
      unsubscribe2();
    });
    it("should bind <input type='date'>", () => {
      const input = element("input");
      attr(input, "type", "date");
      const initDate = new Date();
      const date = signal(initDate);

      const observer = import.meta.jest.fn();
      const unsubscribe1 = subscribe(date, observer);
      expect(observer).toBeCalledTimes(1);

      expect(input.valueAsDate).toBeNull();
      const unsubscribe2 = $model(input, date, { as: "date" });
      expect(input.valueAsDate).not.toBeNull();
      const newDate = new Date(initDate.getTime() + 1e6);

      mockInput(input, newDate.toDateString());
      expect(+date()).not.toBe(+initDate);
      expect(observer).toBeCalledTimes(2);
      unsubscribe1();
      unsubscribe2();
    });
    it("should bind <select>", () => {
      const select = element("select");
      const options = ["", "a", "b", "c"];
      select.append(
        ...options.map((o) => {
          const option = element("option");
          option.value = o;
          return option;
        })
      );

      const selectedValue = signal("a");
      const observer = import.meta.jest.fn();
      const unsubscribe1 = subscribe(selectedValue, observer);
      expect(observer).toBeCalledTimes(1);

      expect(select.value).toBe("");
      const unsubscribe2 = $model(select, selectedValue);
      expect(select.value).toBe("a");

      mockChange(select, "b");
      expect(selectedValue()).toBe("b");
      expect(observer).toBeCalledTimes(2);
      unsubscribe1();
      unsubscribe2();
    });
    it("should bypass unknown `as` value as `text`", () => {
      const input = element("input");
      const text = signal("init");

      const observer = import.meta.jest.fn();
      const unsubscribe1 = subscribe(text, observer);
      expect(observer).toBeCalledTimes(1);

      expect(input.value).toBe("");
      // @ts-expect-error invalid usage
      const unsubscribe2 = $model(input, text, { as: "typo" });
      expect(input.value).toBe("init");
      mockInput(input, "inita");
      expect(text()).toBe("inita");
      expect(observer).toBeCalledTimes(2);
      unsubscribe1();
      unsubscribe2();
      // test unbind logic
      mockInput(input, "initab");
      expect(observer).toBeCalledTimes(2);
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
      isWritable(s);
      expect(spy.warn).toBeCalledTimes(4);
      dispatch(s, 1);
      expect(spy.warn).toBeCalledTimes(6);
    });
  });
});
