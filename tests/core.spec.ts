import {
  $,
  $$,
  access,
  after,
  anchor,
  appendChild,
  attr,
  before,
  listen,
  clone,
  docFragment,
  element,
  moveRange,
  remove,
  select,
  seqAfter,
  svg,
  content,
  delegate,
} from "../dist/core";
import { template } from "../dist/template";

describe("core.ts", () => {
  describe("element", () => {
    it("should create HTML element", () => {
      const node = element("div");
      expect(node).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("svg", () => {
    it("should create SVG element", () => {
      const node = svg("a");
      expect(node).toBeInstanceOf(window.SVGElement);
      // TODO: Switch to this when jsdom supports SVGAElement:
      // expect(node).toBeInstanceOf(window.SVGAElement);
    });
  });

  describe("docFragment", () => {
    it("should create document fragment", () => {
      expect(docFragment()).toBeInstanceOf(DocumentFragment);
    });
  });

  describe("clone", () => {
    it("should clone DOM node deeply", () => {
      const node = element("div");
      node.innerHTML = `<p>test1</p><p>test2</p>`;
      const cloneNode = clone(node);
      expect(cloneNode.innerHTML).toBe(node.innerHTML);
    });
  });

  describe("attr", () => {
    it("should set element attribute", () => {
      const node = document.createElement("div");
      attr(node, "id", "test");
      expect(node.id).toBe("test");
      attr(node, "id", null);
      expect(node.id).toBeFalsy();
      attr(node, "id", "test");
      expect(node.id).toBe("test");
      attr(node, "id", false);
      expect(node.id).toBeFalsy();
    });
  });

  describe("text content", () => {
    it("should insert text content", () => {
      const span = document.createElement("span");
      content(span, "the content");
      expect(span.textContent).toBe("the content");
    });
  });

  describe("select", () => {
    it("should select element in DOM subtree by CSS selector", () => {
      const container = document.createElement("div");
      const button = document.createElement("button");
      button.id = "foo";
      appendChild(container)(button);
      const currentElement = select(container, "button#foo");
      expect(currentElement).toBe(button);
    });

    it("should select DOM element from documnet", () => {
      const node = document.createElement("div");
      document.body.appendChild(node);
      const currentElement = select("div");
      expect(currentElement).toBe(node);
    });
  });

  describe("anchor", () => {
    beforeAll(() => {
      document.body.innerHTML = `<template #t1>
            <div #t></div>
          </template>
          <div id="parent">
            <div id="child" #child></div>
          </div>`;
    });

    it("it should get HTMLTemplateElement with a single string argument", () => {
      const anchorReferenced = anchor("t1");
      const template1 = document.querySelector(`template[\\#t1]`);
      expect(anchorReferenced).toBe(template1);
    });

    it("it should get child element", () => {
      const parentNode = document.getElementById("parent")!;
      const childAnchorReferenced = anchor(parentNode, "child");
      const childElement = document.getElementById("child");
      expect(childAnchorReferenced).toBe(childElement);
    });
  });

  describe("$", () => {
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should perform `querySelector`", () => {
      const node = element("div");
      const list = [];
      for (let i = 0; i < 10; i++) {
        const p = element("p");
        list.push(p);
        appendChild(node)(p);
      }
      appendChild(document.body)(node);
      expect($("p")).toBe(list[0]);
    });
  });

  describe("$$", () => {
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should perform `querySelectorAll`", () => {
      const node = element("div");
      const list = [];
      for (let i = 0; i < 10; i++) {
        const p = element("p");
        list.push(p);
        appendChild(node)(p);
      }
      appendChild(document.body)(node);
      expect($$("p")).toStrictEqual(list);
    });
  });

  describe("listen", () => {
    it("should bind event", () => {
      const fn = import.meta.jest.fn();
      const buttonElement = document.createElement("button");
      const cleanup = listen(buttonElement)("click", fn);
      buttonElement.click();
      expect(fn).toBeCalledTimes(1);
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
      cleanup();
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
    });
  });

  describe("delegate", () => {
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should bind delegated event", () => {
      const fn = import.meta.jest.fn();
      const buttonElement = document.createElement("button");
      document.body.appendChild(buttonElement);
      const cleanup = delegate(buttonElement)("click", fn);
      buttonElement.click();
      expect(fn).toBeCalledTimes(1);
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
      cleanup();
      buttonElement.click();
      expect(fn).toBeCalledTimes(2);
    });
    it("should continue and error when error happens", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      const buttonElement = document.createElement("button");
      const container = document.createElement("div");
      container.appendChild(buttonElement);
      document.body.appendChild(container);
      const callSequence: string[] = [];
      delegate(buttonElement)("click", () => {
        callSequence.push("button");
        throw new Error("");
      });
      delegate(container)("click", () => {
        callSequence.push("container");
      });
      buttonElement.click();
      // And the handlers should be invoked in the same order like bubbling.
      expect(callSequence).toStrictEqual(["button", "container"]);
      expect(fn).toBeCalledTimes(1);
      fn.mockReset();
      fn.mockRestore();
    });
  });

  describe("appendChild", () => {
    it("it should append child to given element", () => {
      const node = document.createElement("div");
      const p = document.createElement("p");
      appendChild(node)(p);
      expect(p.parentElement).toBe(node);
    });
  });

  describe("before", () => {
    it("it should insert element before given element", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      appendChild(container)(node);
      const p = document.createElement("p");
      before(node)(p);
      expect(p).toBe(node.previousElementSibling);
    });
  });

  describe("after", () => {
    it("should insert element after given element", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      appendChild(container)(node);
      const p = document.createElement("p");
      after(node)(p);
      expect(p).toBe(node.nextElementSibling);
    });
  });

  describe("seqAfter", () => {
    it("should insert sequence after given element", () => {
      const container = document.createElement("div");
      const childNode = document.createElement("button");
      appendChild(container)(childNode);
      const attach = seqAfter(childNode);
      const list = ["111", "222"];
      list.forEach((item) => {
        attach(new Text(item));
      });
      expect(container.textContent).toBe("111222");
    });
  });

  describe("remove", () => {
    it("should remove node", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      container.appendChild(node);
      expect(container.children.length).toBe(1);
      remove(node);
      expect(container.children.length).toBe(0);
    });
  });

  describe("moveRange", () => {
    it("should move nodes in given range", () => {
      const container = document.createElement("div");
      const box = document.createElement("div");
      const list = ["111", "222", "333", "444"];
      const fragment = list.map((item) => {
        const p = document.createElement("p");
        attr(p, "id", item);
        return p;
      });
      container.append(...fragment);

      const begin = fragment[1];
      const end = fragment[2];
      moveRange(begin, end, appendChild(box));
      expect(Array.from(container.children)).toEqual([fragment[0], fragment[3]]);
      expect(Array.from(box.children)).toEqual([fragment[1], fragment[2]]);
    });
  });

  describe("access", () => {
    let fragment: DocumentFragment;
    beforeAll(() => {
      fragment = template(`\
 <div id="div0">
  <span id="span0">span0</span>
  <span id="span1">span1</span>
 </div>
 <div id="div1">
  <span id="span2">span2</span>
 </div>
 `).content;
    });
    it("should access the node by index path", () => {
      expect(access(fragment, [0])).toBe(fragment.getElementById("div0"));
      expect(access(fragment, [0, 0])).toBe(fragment.getElementById("span0"));
      expect(access(fragment, [0, 1])).toBe(fragment.getElementById("span1"));
      expect(access(fragment, [1])).toBe(fragment.getElementById("div1"));
      expect(access(fragment, [1, 0])).toBe(fragment.getElementById("span2"));
    });

    it("should return null if cannot access more", () => {
      expect(access(fragment, [2])).toBeUndefined();
      expect(access(fragment, [1, 2])).toBeUndefined();
      expect(access(fragment, [0, 2])).toBeUndefined();
      expect(access(fragment, [0, 3])).toBeUndefined();
      expect(access(fragment, [0, 3, 8])).toBeUndefined();
    });
  });
});
