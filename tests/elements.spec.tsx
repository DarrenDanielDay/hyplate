import "../dist/polyfill";
import { element } from "../dist/core";
import { nil } from "../dist/directive";
import { HyplateElement, CustomElement } from "../dist/elements";
import { jsxRef, mount, unmount } from "../dist/jsx-runtime";
import { signal } from "../dist/signals";
import type { Mountable, OnAttributeChanged, OnConnected } from "../dist/types";
import { useSignals } from "./configure-store";
import { mock, reset } from "./dom-api-mock";
import { useDocumentClear } from "./test-util";

describe("elements.ts", () => {
  useSignals();
  beforeAll(() => {
    mock();
  });
  afterAll(() => {
    reset();
  });
  describe("usage", () => {
    it("should work with class component", () => {
      @CustomElement({
        tag: "test-class-component-0",
      })
      class ClassComponent0 extends HyplateElement {
        override render() {
          this.attachInternals;
          return <div></div>;
        }
      }
      @CustomElement({
        tag: "test-class-component-1",
      })
      class ClassComponent1 extends HyplateElement<{ msg: string }, "slot1" | "slot2"> {
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
      @CustomElement({
        tag: "test-class-component-2",
      })
      class ClassComponent2 extends ClassComponent1 {
        static slotTag = "div";
      }
      @CustomElement({
        tag: "test-class-component-3",
      })
      class ClassComponent3 extends HyplateElement {
        static shadowRootInit: Omit<ShadowRootInit, "mode"> = {
          slotAssignment: "manual",
        };
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
      @CustomElement({
        tag: "test-class-component-4",
      })
      class ClassComponent4 extends HyplateElement {
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
      @CustomElement({
        tag: "test-class-component-wrapper",
      })
      class WrapperClassComponent extends HyplateElement {
        render(): JSX.Element {
          const lang = signal("");
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
  describe("HyplateElement", () => {
    useDocumentClear();
    it("should have no observed attributes", () => {
      expect(HyplateElement.observedAttributes ?? []).toStrictEqual([]);
    });
    it("should not perform mount more than once", () => {
      @CustomElement({
        tag: "test-auto-mount",
      })
      class AutoMount extends HyplateElement implements OnConnected {
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
    it("should emit error if user code does not override `render`", () => {
      @CustomElement({
        tag: "error-component-1",
      })
      class ErrorComponent extends HyplateElement {}
      expect(() => {
        mount(<ErrorComponent></ErrorComponent>, document.body);
      }).toThrow(/render/i);
    });
    it("should attach internals with `formAssociated`: true", () => {
      @CustomElement({ tag: "test-attach-internals", formAssociated: true })
      class TestAttachInternals extends HyplateElement {
        render(): Mountable<any> {
          return nil;
        }
      }
      const formRef = jsxRef<HTMLFormElement>();
      const componentRef = jsxRef<TestAttachInternals>();
      const rendered = mount(
        <form ref={formRef}>
          <TestAttachInternals ref={componentRef} attr:name="foo"></TestAttachInternals>
        </form>,
        document.body
      );
      const internals = componentRef.current!.internals;
      expect(internals).toBeTruthy();
      unmount(rendered);
    });
    it("should execute effect callback after component mount and register effect cleanup", () => {
      const cleanup = import.meta.jest.fn();
      @CustomElement({
        tag: "test-effect",
      })
      class TestEffect extends HyplateElement {
        override render(): Mountable<any> {
          const ref = jsxRef<HTMLDivElement>();
          this.effect(() => {
            expect(ref.current).toBeInstanceOf(window.HTMLDivElement);
            return cleanup;
          });
          return <div ref={ref}></div>;
        }
      }
      const rendered = mount(<TestEffect />, document.body);
      expect(cleanup).toBeCalledTimes(0);
      unmount(rendered);
      expect(cleanup).toBeCalledTimes(1);
    });
  });
  describe("CustomElement", () => {
    it("should define static fields", () => {
      const fn = import.meta.jest.fn();
      @CustomElement({
        tag: "test-decorator-component",
        shadowRootInit: {
          slotAssignment: "manual",
        },
        observedAttributes: ["id"],
      })
      class MyComponent extends HyplateElement<{ msg: string }, "the-slot"> implements OnAttributeChanged {
        render(): JSX.Element {
          return (
            <div>
              <p>Hello, {this.props.msg}</p>
              <slot name={this.slots["the-slot"]}></slot>
            </div>
          );
        }
        attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
          fn(name, oldValue, newValue);
        }
      }
      const container = element("div");
      const rendered = mount(
        <MyComponent attr:id="foo" msg="world">
          {{
            "the-slot": <p>the slot content</p>,
          }}
        </MyComponent>,
        container
      );
      expect(container.firstElementChild?.tagName.toLowerCase()).toBe("test-decorator-component");
      expect(fn).toBeCalledWith("id", null, "foo");
      unmount(rendered);
    });
  });
});
