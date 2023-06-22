import { appendChild, listen } from "../dist/core";
import { useCleanUp } from "../dist/hooks";
import { mount, unmount } from "../dist/jsx-runtime";
import { basedOnURL, contextFactory, pure, replaced, shadowed, template } from "../dist/template";
import type { ExposedElement, Mountable } from "../dist/types";
import { noop } from "../dist/util";
import { mock, reset } from "./slot-mock";
describe("template.ts", () => {
  beforeAll(() => {
    mock();
  });
  afterAll(() => {
    reset();
  });
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
  describe("shadowed", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should create shadow root with given tag", () => {
      const App = shadowed(`<div>1</div><div>2</div><div>3</div>`)(noop, "span");
      const [cleanup, , getRange] = mount(App({}), appendChild(document.body));
      const el = document.body.children[0];
      expect(el.tagName.toLowerCase()).toBe("span");
      expect(el.shadowRoot).toBeTruthy();
      expect(getRange()).toStrictEqual([el, el]);
      cleanup();
    });
    it("should skip empty slot input", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const [cleanup] = mount(
        App({
          children: {
            slot1: undefined,
          },
        }),
        appendChild(document.body)
      );
      // JSDOM support for shadow root & slot?
      cleanup();
    });
    it("should insert mountable slot for shadow root", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const slotContent: Mountable<void> = () => {
        return [() => {}, void 0, () => {}];
      };
      const [cleanup] = mount(
        App({
          children: {
            slot1: slotContent,
          },
        }),
        appendChild(document.body)
      );
      // JSDOM support for shadow root & slot?
      cleanup();
    });
    it("should insert slot node for shadow root", () => {
      const App = shadowed<"slot1">(`<div>1</div><div>2</div><slot name="slot1"></slot>`)();
      const slotContent = document.createElement("div");
      slotContent.textContent = "3";
      const [cleanup] = mount(
        App({
          children: {
            slot1: slotContent,
          },
        }),
        appendChild(document.body)
      );
      // JSDOM support for shadow root & slot?
      cleanup();
    });
    it("should define readonly `exposed` property", () => {
      const Comopnent = shadowed(``)(() => {
        return {};
      });
      const [unmount, exposed] = mount(Comopnent({}), appendChild(document.body));
      const el = document.body.lastChild as ExposedElement<unknown>;
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
      const rendered = mount(
        App({
          children: {
            slot1: slotContent,
          },
        }),
        appendChild(document.body)
      );
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
      const rendered = mount(
        App({
          children: {
            slot1: slotContent,
          },
        }),
        appendChild(document.body)
      );
      expect(document.body.textContent).toBe("1234");
      unmount(rendered);
    });
    it("should replace slot with given fragment", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const slotContent = document.createDocumentFragment();
      slotContent.appendChild(new Text("3"));
      slotContent.appendChild(new Text("4"));
      const rendered = mount(
        App({
          children: {
            slot1: slotContent,
          },
        }),
        appendChild(document.body)
      );
      expect(document.body.textContent).toBe("1234");
      unmount(rendered);
    });
    it("should replace slot with given mountable", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1"></slot>`)();
      const cleanupSlot = import.meta.jest.fn();
      const rendered = mount(
        App({
          children: {
            slot1: () => [cleanupSlot, undefined, () => {}],
          },
        }),
        appendChild(document.body)
      );
      expect(document.body.textContent).toBe("12");
      unmount(rendered);
      expect(cleanupSlot).toBeCalledTimes(1);
    });
    it("should skip slot replacement when slot content not provided", () => {
      const App = replaced<"slot1">(`<span>1</span><span>2</span><slot name="slot1">fallback</slot>`)();
      const rendered = mount(App({ children: {} }), appendChild(document.body));
      expect(document.body.textContent).toBe("12fallback");
      unmount(rendered);
    });
    it("should wrap contents with wrapper element if provided", () => {
      const App = replaced(`content`)(undefined, "div");
      const rendered = mount(App({}), appendChild(document.body));
      expect(document.body.textContent).toBe("content");
      expect(document.body.innerHTML).toBe("<div>content</div>");
      unmount(rendered);
    });
  });
  describe("pure", () => {
    it("should return noop as cleanup when no side effect registered", () => {
      const App = pure(`<span>1</span><span>2</span>`)();
      const rendered = mount(App({}), appendChild(document.body));
      const [cleanup] = rendered;
      expect(document.body.textContent).toBe("12");
      expect(cleanup).toBe(noop);
      unmount(rendered);
    });
    it("should retuen cleanup with side effect", () => {
      const App = pure(
        `<span>1</span><span>2</span>`,
        (f) => f.firstChild!
      )((_, span) => {
        useCleanUp(listen(span)("click", () => {}));
      });
      const rendered = mount(App({}), appendChild(document.body));
      const [cleanup] = rendered;
      expect(document.body.textContent).toBe("12");
      expect(cleanup).not.toBe(noop);
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
