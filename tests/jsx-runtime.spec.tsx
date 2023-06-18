import { resetBinding } from "../dist/binding";
import { appendChild, element } from "../dist/core";
import { If, Show } from "../dist/directive";
import { create, createElement, Fragment, h, jsx, jsxRef, jsxs, mount, unmount } from "../dist/jsx-runtime";
import { source } from "../dist/store";
import type { AttachFunc, FunctionalComponent, JSXChild, ObjectEventHandler, Rendered } from "../dist/types";
import { noop } from "../dist/util";
import { setHyplateStore } from "./configure-store";
import { mock, reset } from "./slot-mock";
describe("jsx-runtime.ts", () => {
  beforeAll(() => {
    setHyplateStore();
    mock();
  });
  afterAll(() => {
    resetBinding();
    reset();
  });
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
      const el1 = <If condition={condition} then={() => <div>yes</div>} else={() => <div>no</div>}></If>;
      const el2 = (
        <Show when={condition} fallback={() => <div>no</div>}>
          {() => <div>yes</div>}
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
      attach = appendChild(container);
    });
    afterEach(() => {
      container.remove();
    });
    it("should create document element", () => {
      const render = <span></span>;
      const el1 = mount(render, attach)[1];
      const el2 = mount(render, attach)[1];
      expect(el1).toBeInstanceOf(HTMLSpanElement);
      expect(el2).toBeInstanceOf(HTMLSpanElement);
      expect(el1).not.toBe(el2);
    });
    it("should render extended custom element", () => {
      const fn = import.meta.jest.fn();
      class MySpan extends window.HTMLSpanElement {
        constructor() {
          super();
          fn();
        }
      }
      customElements.define("test-custom-extended-span", MySpan, { extends: "span" });
      const mountable = <span is="test-custom-extended-span"></span>;
      const el = mount(mountable, attach)[1];
      expect(el).toBeInstanceOf(MySpan);
      expect(fn).toBeCalledTimes(1);
    });
    it("should create MathML elements", () => {
      const mathRef = jsxRef<MathMLElement>();
      const createElementNSMock = import.meta.jest.spyOn(document, "createElementNS");
      const rendered = mount(
        <p>
          The infinite sum
          <math display="block" ref={mathRef}>
            <mrow>
              <munderover>
                <mo>∑</mo>
                <mrow>
                  <mi>n</mi>
                  <mo>=</mo>
                  <mn>1</mn>
                </mrow>
                <mrow>
                  <mo>+</mo>
                  <mn>∞</mn>
                </mrow>
              </munderover>
              <mfrac>
                <mn>1</mn>
                <msup>
                  <mi>n</mi>
                  <mn>2</mn>
                </msup>
              </mfrac>
            </mrow>
          </math>
          is equal to the real number
          <math display="inline">
            <mfrac>
              <msup>
                <mi>π</mi>
                <mn>2</mn>
              </msup>
              <mn>6</mn>
            </mfrac>
          </math>
          .
        </p>,
        attach
      );
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "math");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "mfrac");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "msup");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "mi");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "mo");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "mrow");
      expect(createElementNSMock).toHaveBeenCalledWith("http://www.w3.org/1998/Math/MathML", "munderover");
      createElementNSMock.mockReset();
      createElementNSMock.mockRestore();
      unmount(rendered);
    });
    it("should create nested svg element and have valid type", () => {
      const svgTitleRef = jsxRef<SVGTitleElement>();
      const documentTitleRef = jsxRef<SVGTitleElement>();
      const svgTitleRef2 = jsxRef<SVGTitleElement>();
      const documentTitleRef2 = jsxRef<SVGTitleElement>();
      const [, nestedSvg] = mount(
        <svg version="1.1" width="300" height="200">
          <rect width="100%" height="100%" fill="red" />
          <circle cx="150" cy="100" r="80" fill="green" />
          <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">
            SVG
          </text>
          <title ref={svgTitleRef2}>{".a {color: red;}"}</title>
          <foreignObject>
            <title ref={documentTitleRef2}>{".a {color: red;}"}</title>
          </foreignObject>
          <svg viewBox="0 0 20 10">
            <circle cx="5" cy="5" r="4">
              <title ref={svgTitleRef}>I'm a circle</title>
            </circle>
            <rect x="11" y="1" width="8" height="8">
              <title>I'm a square</title>
            </rect>
          </svg>
        </svg>,
        attach
      );
      mount(<title ref={documentTitleRef}></title>, attach);
      expect(nestedSvg).toBeInstanceOf(window.SVGSVGElement);
      expect(svgTitleRef.current).toBeInstanceOf(window.SVGTitleElement);
      expect(svgTitleRef.current).not.toBeInstanceOf(window.HTMLTitleElement);
      expect(svgTitleRef2.current).toBeInstanceOf(window.SVGTitleElement);
      expect(svgTitleRef2.current).not.toBeInstanceOf(window.HTMLTitleElement);
      expect(documentTitleRef2.current).toBeInstanceOf(window.HTMLTitleElement);
      expect(documentTitleRef2.current).not.toBeInstanceOf(window.SVGTitleElement);
      expect(documentTitleRef.current).toBeInstanceOf(window.HTMLTitleElement);
      expect(documentTitleRef.current).not.toBeInstanceOf(window.SVGSVGElement);
    });

    it("should insert child node directly", () => {
      const el = element("span");
      el.textContent = "I'm here.";
      const render = <div id="single-div">{el}</div>;
      const [cleanup, , getRange] = mount(render, attach);
      expect(container.textContent).toBe("I'm here.");
      const div = document.getElementById("single-div");
      expect(getRange()).toStrictEqual([div, div]);
      cleanup();
    });
    it("should mount mountable in sequence", () => {
      const mountable1 = <span>span 1</span>;
      const mountable2 = <span>span 2</span>;
      const [cleanup] = mount(
        <div>
          {mountable1}
          {mountable2}
        </div>,
        attach
      );
      expect(container.textContent).toBe("span 1span 2");
      cleanup();
    });
    it("should assign element jsxRef", () => {
      const inputRef = jsxRef<HTMLInputElement>();
      const mountable = <input ref={inputRef}></input>;
      expect(inputRef.current).toBeNull();
      const [cleanup, el] = mount(mountable, attach);
      expect(inputRef.current).toBe(el);
      cleanup();
    });
    it("should assign component exposed jsxRef", () => {
      interface AppExposed {
        foo: string;
      }

      const App: FunctionalComponent<{}, undefined, AppExposed> = (props) => (attach) => {
        return [noop, { foo: "bar" }, noop];
      };
      const appRef = jsxRef<AppExposed>();
      const mountable = <App ref={appRef}></App>;
      expect(appRef.current).toBeNull();
      const [cleanup, app] = mount(mountable, attach);
      expect(appRef.current).toBe(app);
      expect(app).toStrictEqual({ foo: "bar" });
      cleanup();
    });
    it("should assign static attributes", () => {
      const mountable = <div class="foo" data-x></div>;
      const [cleanup, el]: Rendered<HTMLDivElement> = mount(mountable, attach);
      expect(el.getAttribute("class")).toBe("foo");
      expect(el.getAttribute("data-x")).toBe("true");
      cleanup();
    });
    it("should create binding for attributes", () => {
      const disabled = source(false);
      const mountable = <button disabled={disabled}></button>;
      const [cleaup, button]: Rendered<HTMLButtonElement> = mount(mountable, attach);
      expect(button.disabled).toBeFalsy();
      disabled.set(true);
      expect(button.disabled).toBeTruthy();
      disabled.set(false);
      expect(button.disabled).toBeFalsy();
      cleaup();
      disabled.set(true);
      expect(button.disabled).toBeFalsy();
    });
    /*
    // This test case is inactivated because the `isSubscribable` check API is exposed to user.
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
    //*/
    it("should bind functional event handler", () => {
      const handler = import.meta.jest.fn();
      const mountable = <button onClick={handler}></button>;
      const [cleanup, button]: Rendered<HTMLButtonElement> = mount(mountable, attach);
      expect(handler).toBeCalledTimes(0);
      button.click();
      expect(handler).toBeCalledTimes(1);
      button.click();
      expect(handler).toBeCalledTimes(2);
      cleanup();
      button.click();
      expect(handler).toBeCalledTimes(2);
    });
    it("should bind object event handler", () => {
      const handleEvent = import.meta.jest.fn();
      const handler: ObjectEventHandler<MouseEvent> = {
        handleEvent,
      };
      const buttonRef = jsxRef<HTMLButtonElement>();
      mount(<button ref={buttonRef} onClick={handler}></button>, attach);
      const button = buttonRef.current!;
      expect(button).toBeTruthy();
      button.click();
      expect(handleEvent).toBeCalledTimes(1);
    });
    it("should add delegate event handler", () => {
      const handler = import.meta.jest.fn();
      const mountable = <button on:click={handler}></button>;
      const [cleanup, button]: Rendered<HTMLButtonElement> = mount(mountable, attach);
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
      const rendered = mount(mountable, attach);
      expect(container.textContent).toBe("aaabbb");
      unmount(rendered);
      expect(container.textContent).toBe("");
    });
    it("should render empty fragment", () => {
      const [cleanup, , getRange] = mount(
        <>
          <>
            <>
              <></>
            </>
          </>
        </>,
        attach
      );
      expect(container.textContent).toBe("");
      expect(getRange()).toBeUndefined();
      cleanup();
    });
    it("should render empty children", () => {
      const [cleanup, , getRange] = mount(jsx(Fragment, { children: [] }), attach);
      expect(container.textContent).toBe("");
      expect(getRange()).toBeUndefined();
      cleanup();
    });
    it("should render single child", () => {
      const [cleanup, , getRange] = mount(
        <>
          <div id="single-div"></div>
        </>,
        attach
      );
      expect(container.textContent).toBe("");
      const div = document.getElementById("single-div");
      expect(getRange()).toStrictEqual([div, div]);
      cleanup();
    });
    it("should get child range", () => {
      const [cleanup, , getRange] = mount(
        <>
          <div id="div1"></div>
          <div id="div2"></div>
          <div id="div3"></div>
        </>,
        attach
      );
      expect(getRange()).toStrictEqual([document.getElementById("div1"), document.getElementById("div3")]);
      cleanup();
    });
    it("should return noop if no real side effect", () => {
      const [cleanup] = mount(
        <>
          <div id="div1"></div>
          <div id="div2"></div>
          <div id="div3"></div>
        </>,
        attach
      );
      expect(cleanup).toBe(noop);
    });
    it("should not return noop with side effect", () => {
      const [cleanup] = mount(
        <>
          <div id="div1" onClick={() => {}}></div>
          <div id="div2"></div>
          <div id="div3"></div>
        </>,
        attach
      );
      expect(cleanup).not.toBe(noop);
    });
    it("should not have type error", () => {
      const submit = jsxRef<HTMLButtonElement>();
      const onSubmit: (e: SubmitEvent) => void = noop;
      const onClick: (e: Event) => void = noop;
      interface MyCustomEvent extends Event {
        foo: string;
      }
      const onCustomEvent: (e: MyCustomEvent) => void = noop;
      const rendered = mount(
        <div onSubmit={onSubmit} onClick={onClick} onCustom={onCustomEvent}>
          <form>
            <input name="foo" value="bar" type="hidden"></input>
            <button type="sumbit" ref={submit}></button>
          </form>
        </div>,
        attach
      );
      unmount(rendered);
    });
  });
  describe("jsxs, h, createElement", () => {
    it("should be alias of jsx", () => {
      expect(jsxs).toBe(jsx);
      expect(h).toBe(jsx);
      expect(createElement).toBe(jsx);
    });
    it("should work with multiple jsx mode", () => {
      const container = element("div");
      expect(() => {
        const el = jsx("div");
        const rendered = mount(el, container);
        expect(container.innerHTML).toBe("<div></div>");
        unmount(rendered);
      }).not.toThrow();
      expect(() => {
        const fc: FunctionalComponent<{}, JSXChild> = (props) => <>{props.children}</>;
        const el = jsx(fc, null, jsx("div"));
        const rendered = mount(el, container);
        expect(container.innerHTML).toBe("<div></div>");
        unmount(rendered);
      }).not.toThrow();
      expect(() => {
        const el = jsx("div", null, jsx("div"), "text");
        const rendered = mount(el, container);
        expect(container.innerHTML).toBe("<div><div></div>text</div>");
        unmount(rendered);
      }).not.toThrow();
    });
  });
  describe("jsxRef", () => {
    it("should return an object with `current` property", () => {
      const ref = jsxRef();
      expect(ref).toStrictEqual({ current: null });
    });
  });
  describe("create", () => {
    it("should return DOM node", () => {
      expect(create(<div>Hello</div>)).toBeInstanceOf(window.HTMLDivElement);
      expect(
        create(
          <>
            <div>Hello</div>
            <br></br>
            <div>World</div>
          </>
        )
      ).toBeInstanceOf(window.DocumentFragment);
    });
  });
});
export {};
