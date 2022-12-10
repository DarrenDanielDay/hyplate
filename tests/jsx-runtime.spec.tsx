import { appendChild, element } from "../dist/core";
import { If, Show } from "../dist/directive";
import { Fragment, jsx, jsxRef, jsxs } from "../dist/jsx-runtime";
import { source } from "../dist/store";
import type { AttachFunc, Mountable } from "../dist/types";
describe("jsx-runtime.ts", () => {
  describe("JSX syntax", () => {
    it("should work with intrinsic element tags and fragment", () => {
      const msg = "world";
      const x = (
        <div data-x>
          <div>Hello, {msg} !</div>
          {
            <>
              <div>fragment el1</div>
              <div></div>
            </>
          }
        </div>
      );
      expect(x).toBeTruthy();
    });

    it("should work with functional component", () => {
      const condition = source(false);
      const el1 = (
        <If condition={condition}>
          {{
            then: <div>yes</div>,
            else: <div>no</div>,
          }}
        </If>
      );
      const el2 = (
        <Show when={condition} fallback={<div>no</div>}>
          <div>yes</div>
        </Show>
      );
      expect(el1).toBeTruthy();
      expect(el2).toBeTruthy();
    });
  });
  describe("jsx", () => {
    let container: HTMLDivElement;
    let attach: AttachFunc;
    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      attach = appendChild<HTMLDivElement>(container);
    });
    afterEach(() => {
      container.remove();
    });
    it("should create document element", () => {
      const render = <span></span>;
      const el1 = render(attach)[1];
      const el2 = render(attach)[1];
      expect(el1).toBeInstanceOf(HTMLSpanElement);
      expect(el2).toBeInstanceOf(HTMLSpanElement);
      expect(el1).not.toBe(el2);
    });
    it("should insert child node directly", () => {
      const el = element("span");
      el.textContent = "I'm here.";
      const render = <div id="single-div">{el}</div>;
      const [cleanup, , getRange] = render(attach);
      expect(container.textContent).toBe("I'm here.");
      const div = document.getElementById("single-div");
      expect(getRange()).toStrictEqual([div, div]);
      cleanup();
    });
    it("should mount mountable in sequence", () => {
      const mountable1 = <span>span 1</span>;
      const mountable2 = <span>span 2</span>;
      const [cleanup] = (<div>
        {mountable1}
        {mountable2}
      </div>)(attach);
      expect(container.textContent).toBe("span 1span 2");
      cleanup();
    });
    it("should assign jsxRef", () => {
      const inputRef = jsxRef<HTMLInputElement>();
      const mountable = <input ref={inputRef}></input>;
      expect(inputRef.el).toBeNull();
      const [cleanup, el] = mountable(attach);
      expect(inputRef.el).toBe(el);
      cleanup();
    });
    it("should assign static attributes", () => {
      const mountable: Mountable<HTMLDivElement> = <div class="foo" data-x></div>;
      const [cleanup, el] = mountable(attach);
      expect(el.getAttribute("class")).toBe("foo");
      expect(el.getAttribute("data-x")).toBe("true");
      cleanup();
    });
    it("should create binding for attributes", () => {
      const disabled = source(false);
      const mountable: Mountable<HTMLButtonElement> = <button disabled={disabled}></button>;
      const [cleaup, button] = mountable(attach);
      expect(button.disabled).toBeFalsy();
      disabled.set(true);
      expect(button.disabled).toBeTruthy();
      disabled.set(false);
      expect(button.disabled).toBeFalsy();
      cleaup();
      disabled.set(true);
      expect(button.disabled).toBeFalsy();
    });
    it("should emit warning when object attribute is not a reactive source/query", () => {
      const warnSpy = import.meta.jest.spyOn(console, "error");
      warnSpy.mockImplementation(() => {});
      const item = { val: "item-id" };
      expect(() => {
        (<span id={item}></span>)(attach);
      }).toThrow();
      expect(warnSpy).toBeCalledTimes(1);
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
    it("should bind inline event handler", () => {
      const handler = import.meta.jest.fn();
      const mountable: Mountable<HTMLButtonElement> = <button onClick={handler}></button>;
      const [cleanup, button] = mountable(attach);
      expect(handler).toBeCalledTimes(0);
      button.click();
      expect(handler).toBeCalledTimes(1);
      button.click();
      expect(handler).toBeCalledTimes(2);
      cleanup();
      button.click();
      expect(handler).toBeCalledTimes(2);
    });
    it("should render nodes", () => {
      const mountable = (
        <>
          <div>aaa</div>
          <span>bbb</span>
        </>
      );
      const [cleanup] = mountable(attach);
      expect(container.textContent).toBe("aaabbb");
      cleanup();
      expect(container.textContent).toBe("");
    });
    it("should render empty fragment", () => {
      const [cleanup, , getRange] = (<></>)(attach);
      expect(container.textContent).toBe("");
      expect(getRange()).toBeUndefined();
      cleanup();
    });
    it("should render empty children", () => {
      const [cleanup, , getRange] = jsx(Fragment, { children: [] })(attach);
      expect(container.textContent).toBe("");
      expect(getRange()).toBeUndefined();
      cleanup();
    });
    it("should render single child", () => {
      const [cleanup, , getRange] = (<>
        <div id="single-div"></div>
      </>)(attach);
      expect(container.textContent).toBe("");
      const div = document.getElementById("single-div");
      expect(getRange()).toStrictEqual([div, div]);
      cleanup();
    });
    it("should get child range", () => {
      const [cleanup, , getRange] = (<>
        <div id="div1"></div>
        <div id="div2"></div>
        <div id="div3"></div>
      </>)(attach);
      expect(getRange()).toStrictEqual([document.getElementById("div1"), document.getElementById("div3")]);
      cleanup();
    });
  });
  describe("jsxs", () => {
    it("should be alias of jsx", () => {
      expect(jsxs).toBe(jsx);
    });
  });
  describe("jsxRef", () => {
    it("should return an object with `el` property", () => {
      const ref = jsxRef();
      expect(ref).toStrictEqual({ el: null });
    });
  });
});
export {};
