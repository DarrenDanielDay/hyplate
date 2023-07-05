import { appendChild, content, element } from "../dist/core";
import { If, Show, For, EventDelegateDirective, ModelDirective, ClassBindingDirective, CSSVariableBindingDirective } from "../dist/directive";
import { useCleanUp } from "../dist/hooks";
import { jsxRef, mount, registerDirective, unmount } from "../dist/jsx-runtime";
import { computed, signal } from "../dist/signals";
import { pure } from "../dist/template";
import type { AttachFunc, Mountable, Rendered, Signal, WritableSignal } from "../dist/types";
import { noop } from "../dist/util";
import { useSignals } from "./configure-store";
import { mockInput } from "./dom-api-mock";
import { useConsoleSpy, useDocumentClear, useTestContext } from "./test-util";
describe("directive.ts", () => {
  useSignals();
  describe("if", () => {
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
    const spy = useConsoleSpy();
    it("should create view when data of `that` is true", () => {
      const condition = signal(true);
      const mountable = <If condition={condition} then={() => <span>then</span>}></If>;
      const rendered = mount(mountable, attach);
      expect(container.textContent).toBe("then");
      unmount(rendered);
      expect(container.textContent).toBe("");
    });
    it("should destroy view when data of `that` changed to falsy", () => {
      const condition = signal(true);
      const mountable = <If condition={condition} then={() => <span>then</span>}></If>;
      const [cleanup] = mount(mountable, attach);
      expect(container.textContent).toBe("then");
      condition.set(false);
      expect(container.textContent).toBe("");
      cleanup();
    });
    it("should create false result view with else", () => {
      const condition = signal(true);
      const mountable = <If condition={condition} then={() => <span>then</span>} else={() => <span>else</span>}></If>;
      const [cleanup] = mount(mountable, attach);
      expect(container.textContent).toBe("then");
      condition.set(false);
      expect(container.textContent).toBe("else");
      cleanup();
    });
    it("should re-create view with changed condition", () => {
      const src = signal({});
      // @ts-expect-error
      const condition: Signal<boolean> = computed(() => src());
      const ref = jsxRef<HTMLButtonElement>();
      const mountable = <If condition={condition} then={() => <button ref={ref}>then</button>}></If>;
      const [cleanup] = mount(mountable, attach);
      const button1 = ref.current;
      src.set({});
      const button2 = ref.current;
      expect(button2).not.toBe(button1);
      expect(button1).toBeInstanceOf(HTMLButtonElement);
      cleanup();
    });
    it("should not create view with unchanged condition", () => {
      const obj = {};
      const src = signal(obj);
      // @ts-expect-error
      const condition: Signal<boolean> = computed(() => src());
      const ref = jsxRef<HTMLButtonElement>();
      const mountable = <If condition={condition} then={() => <button ref={ref}>then</button>}></If>;
      const [cleanup] = mount(mountable, attach);
      const button1 = ref.current;
      src.set(obj);
      const button2 = ref.current;
      expect(button2).toBe(button1);
      expect(button1).toBeInstanceOf(HTMLButtonElement);
      cleanup();
    });
    it("should emit warning when no children provided", () => {
      // @ts-expect-error invalid usage
      const [cleanup, , getRange] = (<If></If>)(attach);
      expect(getRange()).toBeUndefined();
      expect(spy.warn).toBeCalledTimes(1);
      cleanup();
    });
    it("should expose reference of currently rendered", () => {
      type T = {
        foo: number;
      };
      type F = {
        bar: number;
      };
      const Comp1: Mountable<T> = () => {
        return [noop, { foo: 111 }, noop];
      };
      const Comp2: Mountable<F> = () => [noop, { bar: 222 }, noop];
      const ref = jsxRef<T | F>();
      const cond = signal(false);
      const rendered = mount(<If ref={ref} condition={cond} then={() => Comp1} else={() => Comp2}></If>, container);
      expect(ref.current).toStrictEqual<F>({ bar: 222 });
      cond.set(true);
      expect(ref.current).toStrictEqual<T>({ foo: 111 });
      unmount(rendered);
    });
  });
  describe("show", () => {
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
    const spy = useConsoleSpy();
    it("should emit warning when no children given", () => {
      // @ts-expect-error invalid usage
      const [cleanup, , getRange] = (<Show></Show>)(attach);
      expect(getRange()).toBeUndefined();
      expect(spy.warn).toBeCalledTimes(1);
      cleanup();
    });
  });

  describe("for", () => {
    type Item = {
      val: number;
    };
    let container: HTMLDivElement;
    let attach: AttachFunc;
    let list: WritableSignal<Item[]>;
    const renderChildImpl = (item: Item) => <span>{item.val}</span>;
    let renderChild: jest.Mock<ReturnType<typeof renderChildImpl>, Parameters<typeof renderChildImpl>>;
    beforeEach(() => {
      list = signal<Item[]>(Array.from({ length: 10 }, (_, i) => ({ val: i })));
      container = document.createElement("div");
      document.body.appendChild(container);
      renderChild = import.meta.jest.fn(renderChildImpl);
      attach = appendChild(container);
    });
    afterEach(() => {
      container.remove();
    });
    const spy = useConsoleSpy();
    it("should emit error when children is not a function", () => {
      // @ts-expect-error invalid usage
      <For of={list}></For>;
      expect(spy.error).toBeCalledTimes(1);
    });
    it("should emit warning when duplicated children found", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      const arr = list();
      list.set([arr[1], arr[0], arr[0], arr[9]]);
      expect(spy.warn).toBeCalled();
    });
    it("should render list", () => {
      const rendered = mount(<For of={list}>{(item: Item) => <span>{item.val}</span>}</For>, attach);
      expect(container.children.length).toBe(10);
      expect(container.textContent).toBe("0123456789");
      unmount(rendered);
    });
    it("should perform insert", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list();
      const newList: Item[] = [
        ...listContent.slice(0, 3),
        { val: -1 },
        listContent[3],
        { val: -2 },
        ...listContent.slice(4),
      ];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(12);
      expect(container.textContent).toBe("012-13-2456789");
    });
    it("should perform move", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list();
      const item2 = listContent[2]!;
      const item5 = listContent[5]!;
      const newList: Item[] = [...listContent.slice(0, 2), item5, item2, ...listContent.slice(6)];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("01526789");
    });
    it("should perform remove", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list();
      const newList: Item[] = [...listContent.slice(0, 2), ...listContent.slice(3)];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("013456789");
    });
    it("should perform remove and move", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list();
      const [a, b, c, d, e, , , , i, j] = listContent;
      const newList: Item[] = [a, b, d, e, c, i, j];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("0134289");
    });
    it("should cover LIS", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      const arr = list();
      const newList: Item[] = [arr[2], arr[1], arr[5], arr[3], arr[6], arr[4], arr[8], arr[9], arr[7]];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("215364897");
    });
    it("should work altogether", () => {
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("0123456789");
      const [a, b, c, d, e, f, g, h, i, j] = list();
      list.set([a, b, d, e, c, { val: 10 }, g, h, i, j]);
      expect(renderChild).toBeCalledTimes(11);
      expect(container.textContent).toBe("01342106789");
    });
    it("should work with fragment", () => {
      renderChild.mockImplementation((item) => (
        <>
          <span>{item.val}</span>
          <span>@</span>
        </>
      ));
      mount(<For of={list}>{renderChild}</For>, attach);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("0@1@2@3@4@5@6@7@8@9@");
      const [a, b, c, d, e, f, g, h, i, j] = list();
      list.set([a, b, d, e, c, { val: 10 }, g, h, i, j]);
      expect(renderChild).toBeCalledTimes(11);
      expect(container.textContent).toBe("0@1@3@4@2@10@6@7@8@9@");
    });
    it("should call all item's cleanup when unmounted", () => {
      const createMock = import.meta.jest.fn();
      const cleanupMock = import.meta.jest.fn();
      const Component = pure(
        `<span></span>`,
        (f) => f.firstChild! as HTMLSpanElement
      )(({ val }: Item, span) => {
        content(span, val);
        createMock();
        useCleanUp(cleanupMock);
      });
      const rendered = mount(<For of={list}>{(item) => <Component {...item} />}</For>, attach);
      expect(createMock).toBeCalledTimes(10);
      expect(container.textContent).toBe("0123456789");
      const [a, b, c, d, e, f, g, h, i, j] = list();
      list.set([a, b, d, e, c, { val: 10 }, g, h, i, j]);
      expect(createMock).toBeCalledTimes(11);
      expect(container.textContent).toBe("01342106789");
      unmount(rendered);
      expect(cleanupMock).toBeCalledTimes(11);
    });
  });
  describe("delegate", () => {
    useDocumentClear();
    useTestContext(() => registerDirective(new EventDelegateDirective()));
    it("should add delegate event handler", () => {
      const handler = import.meta.jest.fn();
      const mountable = <button on:click={handler}></button>;
      const [cleanup, button]: Rendered<HTMLButtonElement> = mount(mountable, document.body);
      expect(handler).toBeCalledTimes(0);
      button.click();
      expect(handler).toBeCalledTimes(1);
      button.click();
      expect(handler).toBeCalledTimes(2);
      cleanup();
      button.click();
      expect(handler).toBeCalledTimes(2);
    });
  });
  describe("class", () => {
    useDocumentClear();
    useTestContext(() => registerDirective(new ClassBindingDirective()));
    it("should bind class", () => {
      const show = signal(false);
      const el = element("div");
      const rendered = mount(<div ref={el} class:show={show}></div>, document.body);
      expect(el.classList.contains("show")).toBeFalsy();
      show.set(true);
      expect(el.classList.contains("show")).toBeTruthy();
      unmount(rendered);
    });
  });
  describe("var", () => {
    useDocumentClear();
    useTestContext(() => registerDirective(new CSSVariableBindingDirective()));
    it("should bind css variable", () => {
      const colorVariable = signal<string | null>(null);
      const el = element("div");
      const rendered = mount(<div ref={el} var:color={colorVariable}></div>, document.body);
      expect(el.style.getPropertyValue("--color")).toBe("");
      colorVariable.set("#1f1e33");
      expect(el.style.getPropertyValue("--color")).toBe("#1f1e33");
      unmount(rendered);
    });
  });
  describe("h-model", () => {
    useDocumentClear();
    useTestContext(() => registerDirective(new ModelDirective()));
    const spy = useConsoleSpy();
    it("should emit error with non-writable subscribable", () => {
      // @ts-expect-error invalid usage
      unmount(mount(<input h-model={computed(() => "")}></input>, document.body));
      expect(spy.error).toBeCalled();
    });
    it("should emit warning if no `value` property is present on the element", () => {
      unmount(mount(<span h-model={signal("")}></span>, document.body));
      expect(spy.warn).toBeCalled();
    });
    it("should bind text model", () => {
      const text = signal("init");
      const input = element("input");
      expect(input.value).toBe("");
      const rendered = mount(
        <div>
          <input ref={input} h-model={text}></input>
        </div>,
        document.body
      );
      expect(input.value).toBe("init");
      mockInput(input, "new value 1");
      expect(text()).toBe("new value 1");
      text.set("new value 2");
      expect(input.value).toBe("new value 2");
      unmount(rendered);
    });
    it("should treat word after `:` as `as` option", () => {
      const count = signal(0);
      const input = element("input");
      expect(input.valueAsNumber).toBeNaN();
      const rendered = mount(
        <div>
          <input ref={input} type="number" h-model:number={count}></input>
        </div>,
        document.body
      );
      expect(input.valueAsNumber).toBe(0);
      unmount(rendered);
    });
    it("should bind select", () => {
      const select = element("select");
      const options = Array.from({ length: 3 }, (_, i) => i + 1);
      const selectValue = signal("1");
      const rendered = mount(
        <div>
          <select ref={select} h-model={selectValue}>
            {options.map((o) => (
              <option value={`${o}`}>{o}</option>
            ))}
          </select>
        </div>,
        document.body
      );
      expect(select.value).toBe("1");
      selectValue.set("2");
      expect(select.value).toBe("2");
      unmount(rendered);
    });
  });
});
