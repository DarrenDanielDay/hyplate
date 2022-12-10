import { appendChild } from "../dist/core";
import { useHost, useParent } from "../dist/hooks";
import { replaced, shadowed, template } from "../dist/template";
import type { Mountable } from "../dist/types";
describe("template.ts", () => {
  describe("template", () => {
    it("should create template element with text", () => {
      const t1 = template(`<div>1</div><div>2</div>`);
      expect(t1).toBeInstanceOf(HTMLTemplateElement);
      expect(t1.content.textContent).toBe("12");
    });
    it("should return template element itself", () => {
      const t = document.createElement("template");
      const t1 = template(t);
      expect(t1).toBe(t);
    });
  });
  describe("shallowed", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });
    it("should create shadow root", () => {
      const App = shadowed(`<div>1</div><div>2</div><div>3</div>`, "shadow-element-1")();
      const [cleanup, , getRange] = App({})(appendChild(document.body));
      const el = document.body.children[0];
      expect(el.tagName.toLowerCase()).toBe("shadow-element-1");
      expect(el.shadowRoot).toBeTruthy();
      expect(getRange()).toStrictEqual([el, el]);
      cleanup();
    });
    it("should skip empty slot input", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const [cleanup] = App({
        children: {
          slot1: undefined,
        },
      })(appendChild(document.body));
      // JSDOM support for shadow root & slot?
      cleanup();
    });
    it("should insert mountable slot for shadow root", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const slotContent: Mountable<void> = () => {
        return [() => {}, void 0, () => {}];
      };
      const [cleanup] = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      // JSDOM support for shadow root & slot?
      cleanup();
    });
    it("should insert slot node for shadow root", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const slotContent = document.createElement("div");
      slotContent.textContent = "3";
      const [cleanup] = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      // JSDOM support for shadow root & slot?
      cleanup();
    });
  });
  describe("replaced", () => {
    it("should replace slot with given element", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createElement("span");
      slotContent.textContent = "3";
      const [cleanup, , getRange] = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("123");
      expect(getRange()).toStrictEqual([document.body.firstChild, document.body.lastChild]);
      cleanup();
    });
    it("should replace slot with given fragment", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createDocumentFragment();
      slotContent.appendChild(new Text("3"));
      slotContent.appendChild(new Text("4"));
      const [cleanup] = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("1234");
      cleanup();
    });
    it("should replace slot with given fragment", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createDocumentFragment();
      slotContent.appendChild(new Text("3"));
      slotContent.appendChild(new Text("4"));
      const [cleanup] = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("1234");
      cleanup();
    });
    it("should replace slot with given mountable", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const cleanupSlot = import.meta.jest.fn();
      const [cleanup] = App({
        children: {
          slot1: () => [cleanupSlot, undefined, () => {}],
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("12");
      cleanup();
      expect(cleanupSlot).toBeCalledTimes(1);
    });
    it("should skip slot replacement when slot content not provided", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1">fallback</slot>`)();
      const [cleanup] = App({ children: {} })(appendChild(document.body));
      expect(document.body.textContent).toBe("12fallback");
      cleanup();
    });
  });
});
