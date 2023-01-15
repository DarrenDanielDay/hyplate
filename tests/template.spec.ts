import { appendChild, unmount } from "../dist/core";
import { basedOnURL, contextFactory, replaced, shadowed, template } from "../dist/template";
import type { HyplateElement, Mountable } from "../dist/types";
import { noop } from "../dist/util";
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
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should create shadow root", () => {
      const App = shadowed(`<div>1</div><div>2</div><div>3</div>`)(noop, "shadow-element-1");
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
    it("should define readonly `exposed` property", () => {
      const Comopnent = shadowed(``)(() => {
        return {};
      }, "test-exposed");
      const [unmount, exposed] = Comopnent({})(appendChild(document.body));
      const el = document.querySelector<HyplateElement<unknown>>("test-exposed")!;
      expect(el.exposed).toBe(exposed);
      expect(() => {
        // @ts-expect-error readonly property
        el.exposed = {};
      }).toThrow();
      unmount();
    });
  });
  describe("replaced", () => {
    it("should replace slot with given element", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createElement("span");
      slotContent.textContent = "3";
      const rendered = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      const [, , getRange] = rendered;
      expect(document.body.textContent).toBe("123");
      expect(getRange()).toStrictEqual([document.body.firstChild, document.body.lastChild]);
      unmount(rendered);
    });
    it("should replace slot with given fragment", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createDocumentFragment();
      slotContent.appendChild(new Text("3"));
      slotContent.appendChild(new Text("4"));
      const rendered = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("1234");
      unmount(rendered);
    });
    it("should replace slot with given fragment", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createDocumentFragment();
      slotContent.appendChild(new Text("3"));
      slotContent.appendChild(new Text("4"));
      const rendered = App({
        children: {
          slot1: slotContent,
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("1234");
      unmount(rendered);
    });
    it("should replace slot with given mountable", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const cleanupSlot = import.meta.jest.fn();
      const rendered = App({
        children: {
          slot1: () => [cleanupSlot, undefined, () => {}],
        },
      })(appendChild(document.body));
      expect(document.body.textContent).toBe("12");
      unmount(rendered);
      expect(cleanupSlot).toBeCalledTimes(1);
    });
    it("should skip slot replacement when slot content not provided", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1">fallback</slot>`)();
      const rendered = App({ children: {} })(appendChild(document.body));
      expect(document.body.textContent).toBe("12fallback");
      unmount(rendered);
    });
  });
  describe("based on url", () => {
    it("should concat the relative url", () => {
      const basedOnFilePath = basedOnURL("http://localhost:3000/foo");
      expect(basedOnFilePath("./bar")).toBe("http://localhost:3000/bar");
      const basedOnDirPath = basedOnURL("http://localhost:3000/foo/");
      expect(basedOnDirPath("./bar")).toBe("http://localhost:3000/foo/bar");
      expect(basedOnDirPath("/bar")).toBe("http://localhost:3000/bar");
    });
  });
  describe("context factory", () => {
    it("should return factory function", () => {
      const cf = contextFactory({ list: [0] });
      const fragment = template(`<ul></ul>`).content;
      const list = fragment.firstElementChild;
      expect(cf(fragment)).toStrictEqual({
        refs: { list },
      });
    });
  });
});
