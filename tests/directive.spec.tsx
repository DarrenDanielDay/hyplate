import { resetBinding } from "../dist/binding";
import { appendChild } from "../dist/core";
import { If, Show, For } from "../dist/directive";
import { jsxRef } from "../dist/jsx-runtime";
import { query, source } from "../dist/store";
import type { AttachFunc, Query, Source } from "../dist/types";
import { setHyplateStore } from "./configure-store";
describe("directive.ts", () => {
  beforeAll(() => {
    setHyplateStore();
  });
  afterAll(() => {
    resetBinding();
  });
  describe("if", () => {
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
    it("should create view when data of `that` is true", () => {
      const condition = source(true);
      const mountable = (
        <If condition={condition}>
          {{
            then: <span>then</span>,
          }}
        </If>
      );
      const [cleanup] = mountable(attach);
      expect(container.textContent).toBe("then");
      cleanup();
      expect(container.textContent).toBe("");
    });
    it("should destroy view when data of `that` changed to falsy", () => {
      const condition = source(true);
      const mountable = (
        <If condition={condition}>
          {{
            then: <span>then</span>,
          }}
        </If>
      );
      const [cleanup] = mountable(attach);
      expect(container.textContent).toBe("then");
      condition.set(false);
      expect(container.textContent).toBe("");
      cleanup();
    });
    it("should create false result view with else", () => {
      const condition = source(true);
      const mountable = (
        <If condition={condition}>
          {{
            then: <span>then</span>,
            else: <span>else</span>,
          }}
        </If>
      );
      const [cleanup] = mountable(attach);
      expect(container.textContent).toBe("then");
      condition.set(false);
      expect(container.textContent).toBe("else");
      cleanup();
    });
    it("should re-create view with changed condition", () => {
      const src = source({});
      // @ts-expect-error
      const condition: Query<boolean> = query(() => src.val);
      const ref = jsxRef<HTMLButtonElement>();
      const mountable = (
        <If condition={condition}>
          {{
            then: <button ref={ref}>then</button>,
          }}
        </If>
      );
      const [cleanup] = mountable(attach);
      const button1 = ref.current;
      src.set({});
      const button2 = ref.current;
      expect(button2).not.toBe(button1);
      expect(button1).toBeInstanceOf(HTMLButtonElement);
      cleanup();
    });
    it("should not create view with unchanged condition", () => {
      const obj = {};
      const src = source(obj);
      // @ts-expect-error
      const condition: Query<boolean> = query(() => src.val);
      const ref = jsxRef<HTMLButtonElement>();
      const mountable = (
        <If condition={condition}>
          {{
            then: <button ref={ref}>then</button>,
          }}
        </If>
      );
      const [cleanup] = mountable(attach);
      const button1 = ref.current;
      src.set(obj);
      const button2 = ref.current;
      expect(button2).toBe(button1);
      expect(button1).toBeInstanceOf(HTMLButtonElement);
      cleanup();
    });
    it("should emit warning when no children provided", () => {
      const warnSpy = import.meta.jest.spyOn(console, "warn");
      warnSpy.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      const [cleanup, , getRange] = (<If></If>)(attach);
      expect(getRange()).toBeUndefined();
      expect(warnSpy).toBeCalledTimes(1);
      cleanup();
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
  });
  describe("show", () => {
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
    it("should emit warning when no children given", () => {
      const warnSpy = import.meta.jest.spyOn(console, "warn");
      warnSpy.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      const [cleanup, , getRange] = (<Show></Show>)(attach);
      expect(getRange()).toBeUndefined();
      expect(warnSpy).toBeCalledTimes(1);
      cleanup();
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
  });

  describe("for", () => {
    type Item = {
      val: number;
    };
    let container: HTMLDivElement;
    let attach: AttachFunc;
    let list: Source<Item[]>;
    const renderChildImpl = (item: Item) => <span>{item.val}</span>;
    let renderChild: typeof renderChildImpl;
    beforeEach(() => {
      list = source<Item[]>(Array.from({ length: 10 }, (_, i) => ({ val: i })));
      container = document.createElement("div");
      document.body.appendChild(container);
      renderChild = import.meta.jest.fn(renderChildImpl);
      attach = appendChild<HTMLDivElement>(container);
    });
    afterEach(() => {
      container.remove();
    });
    it("should emit error when children is not a function", () => {
      const warnSpy = import.meta.jest.spyOn(console, "error");
      warnSpy.mockImplementation(() => {});
      // @ts-expect-error invalid usage
      <For of={list}></For>;
      expect(warnSpy).toBeCalledTimes(1);
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
    it("should emit warning when duplicated children found", () => {
      const warnSpy = import.meta.jest.spyOn(console, "warn");
      warnSpy.mockImplementation(() => {});
      (<For of={list}>{renderChild}</For>)(attach);
      const arr = list.val;
      list.set([arr[1], arr[0], arr[0], arr[9]]);
      expect(warnSpy).toBeCalled();
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
    it("should render list", () => {
      const [cleanup] = (<For of={list}>{(item: Item) => <span>{item.val}</span>}</For>)(attach);
      expect(container.children.length).toBe(10);
      expect(container.textContent).toBe("0123456789");
      cleanup();
    });
    it("should perform insert", () => {
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list.val;
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
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list.val;
      const item2 = listContent[2]!;
      const item5 = listContent[5]!;
      const newList: Item[] = [...listContent.slice(0, 2), item5, item2, ...listContent.slice(6)];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("01526789");
    });
    it("should perform remove", () => {
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list.val;
      const newList: Item[] = [...listContent.slice(0, 2), ...listContent.slice(3)];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("013456789");
    });
    it("should perform remove and move", () => {
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      const listContent = list.val;
      const [a, b, c, d, e, , , , i, j] = listContent;
      const newList: Item[] = [a, b, d, e, c, i, j];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("0134289");
    });
    it("should cover LIS", () => {
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      const arr = list.val;
      const newList: Item[] = [arr[2], arr[1], arr[5], arr[3], arr[6], arr[4], arr[8], arr[9], arr[7]];
      list.set(newList);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("215364897");
    });
    it("should work altogether", () => {
      (<For of={list}>{renderChild}</For>)(attach);
      expect(renderChild).toBeCalledTimes(10);
      expect(container.textContent).toBe("0123456789");
      const [a, b, c, d, e, f, g, h, i, j] = list.val;
      list.set([a, b, d, e, c, { val: 10 }, g, h, i, j]);
      expect(renderChild).toBeCalledTimes(11);
      expect(container.textContent).toBe("01342106789");
    });
  });
});
