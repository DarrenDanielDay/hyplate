import { resetBinding } from "../dist/binding";
import { appendChild, element } from "../dist/core";
import { If, Show } from "../dist/directive";
import { Component, createElement, Fragment, h, jsx, jsxRef, jsxs, mount, unmount } from "../dist/jsx-runtime";
import { source } from "../dist/store";
import type {
  AttachFunc,
  FunctionalComponent,
  JSXChild,
  Later,
  Mountable,
  ObjectEventHandler,
  OnConnected,
  Rendered,
} from "../dist/types";
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
    it("should work with class component", () => {
      class ClassComponent0 extends Component {
        static tag: string = this.defineAs("test-class-component-0");
        override render() {
          return <div></div>;
        }
      }
      class ClassComponent1 extends Component<{ msg: string }, "slot1" | "slot2"> {
        static tag: string = this.defineAs("test-class-component-1");
        override render(): JSX.Element {
          return (
            <div>
              <p>msg={this.props.msg}</p>
              <slot name={this.slots.slot1}></slot>
              <slot name={this.slots.slot2}></slot>
            </div>
          );
        }
      }
      class ClassComponent2 extends ClassComponent1 {
        static slotTag?: string | undefined = "div";
        static tag: string = this.defineAs("test-class-component-2");
      }
      class ClassComponent3 extends Component {
        static shadowRootInit?: Omit<ShadowRootInit, "mode"> | undefined = {
          slotAssignment: "manual",
        };
        static tag: string = this.defineAs("test-class-component-3");
        slot3 = jsxRef<HTMLSlotElement>();
        override render(): JSX.Element {
          return (
            <div>
              {/* using slot without type */}
              <slot name="slot0">not provided</slot>
              <slot name="slot1">provided undefined</slot>
              <slot name="slot2">provided null</slot>
              <slot ref={this.slot3} name="slot3">
                provided
              </slot>
            </div>
          );
        }
      }
      class ClassComponent4 extends Component {
        static tag: string = this.defineAs("test-class-component-4");
        render(): JSX.Element {
          return (
            <div>
              <slot name="foo"></slot>
            </div>
          );
        }
      }
      const ref1 = jsxRef<ClassComponent1>();
      const ref2 = jsxRef<ClassComponent2>();
      const ref3 = jsxRef<ClassComponent3>();
      const used = jsxRef<HTMLDivElement>();
      const unused = jsxRef<HTMLDivElement>();
      class WrapperClassComponent extends Component {
        static tag: string = this.defineAs("test-class-component-wrapper");
        render(): JSX.Element {
          const lang = source("");
          return (
            <>
              {/* no slot */}
              <ClassComponent0 />
              {/* named slot */}
              <ClassComponent1 ref={ref1} msg="the message1" attr:id="test-class-comp1" attr:lang={lang}>
                {{
                  slot1: <>fragment content for text</>,
                  slot2: <div>node content</div>,
                }}
              </ClassComponent1>
              {/* manual slot with custom tag */}
              <ClassComponent2 ref={ref2} msg="the message2">
                {{
                  slot1: <>fragment content for text</>,
                  slot2: <div>node content</div>,
                }}
              </ClassComponent2>
              {/* manual slot */}
              <ClassComponent3 ref={ref3}>
                {/* using slot without type checking */}
                {{
                  slot1: undefined,
                  // @ts-expect-error strict null checks to undefined
                  slot2: null,
                  slot3: <div ref={used}>used</div>,
                  slot4: <div ref={unused}>unused</div>,
                }}
              </ClassComponent3>
              {element(ClassComponent4.tag)}
              <ClassComponent4>
                {{
                  foo: undefined,
                }}
              </ClassComponent4>
            </>
          );
        }
      }
      const container = element("div");

      const rendered = mount(<WrapperClassComponent></WrapperClassComponent>, container);
      const instance1 = ref1.current!;
      expect(instance1.textContent).toBe("fragment content for textnode content");
      expect(instance1.shadowRoot.textContent).toBe("msg=the message1");
      expect(instance1.id).toBe("test-class-comp1");
      const instance2 = ref2.current!;
      expect(instance2.shadowRoot.textContent).toBe("msg=the message2");
      const instance3 = ref3.current!;
      expect(instance3.slot3.current!.assignedNodes()).toStrictEqual([used.current!]);
      unmount(rendered);
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
  describe("Component", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should have no observed attributes", () => {
      expect(Component.observedAttributes ?? []).toStrictEqual([]);
    });
    it("should not perform mount more than once", () => {
      class AutoMount extends Component implements OnConnected {
        static tag: string = this.defineAs("test-auto-mount");
        render() {
          return <div>auto mount</div>;
        }
        connectedCallback(): void {
          this.mount();
        }
      }
      // basic usage
      const container = element("div");
      document.body.appendChild(container);
      const rendered = mount(<AutoMount />, container);
      expect(container.firstElementChild?.shadowRoot?.innerHTML).toBe("<div>auto mount</div>");
      unmount(rendered);
      expect(container.firstElementChild).toBeNull();
      // use it as web component
      // const el = element(AutoMount.tag);
      // expect(el.shadowRoot).toBeFalsy();
      // container.appendChild(el);
      // expect(container.firstElementChild?.shadowRoot?.innerHTML).toBe("<div>auto mount</div>");
      // expect(el.shadowRoot).toBeTruthy();
    });
  });
});
export {};
