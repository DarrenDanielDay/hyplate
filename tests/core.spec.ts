import {
  $,
  $$,
  anchorRef,
  appendChild,
  attr,
  before,
  bindAttr,
  bindEvent,
  bindText,
  clone,
  docFragment,
  element,
  insertSlot,
  moveRange,
  remove,
  select,
  seqAfter,
  text,
} from "../dist/core";
import { useRef } from "../dist/hooks";
import { source } from "../dist/store";
import { template } from "../dist/template.js";

describe("core.ts", () => {
  describe("element", () => {
    it("", () => {
      const node = element("div");
      expect(node).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("docFragment", () => {
    it("", () => {
      expect(docFragment()).toBeInstanceOf(DocumentFragment);
    });
  });

  describe("clone", () => {
    it("", () => {
      const node = element("div");
      node.innerHTML = `<p>test1</p><p>test2</p>`;
      const cloneNode = clone(node);
      expect(cloneNode.innerHTML).toBe(node.innerHTML);
    });
  });

  describe("attr", () => {
    it("setting attributes", () => {
      const node = document.createElement("div");
      attr(node, "id", "test");
      expect(node.id).toBe("test");
      attr(node, "id", null);
      expect(node.id).toBeFalsy();
      attr(node, "id", false);
      expect(node.id).toBeFalsy();
    });
  });

  describe("select", () => {
    it("select DOM element", () => {
      const container = document.createElement("div");
      const button = document.createElement("button");
      appendChild(container)(button);
      const currentElement = select(container, "button");
      expect(currentElement).toBe(button);
    });

    it("select DOM element from documnet", () => {
      const node = document.createElement("div");
      document.body.appendChild(node);
      const currentElement = select("div");
      expect(currentElement).toBe(node);
    });
  });

  describe("anchorRef", () => {
    beforeAll(() => {
      document.body.innerHTML = `<template #t1>
            <div #t></div>
          </template>
          <div id="parent">
            <div #child></div>
          </div>`;
    });

    it("it should return HTMLTemplateElement", () => {
      const t1Anchor = anchorRef("t1");
      const t1Element = document.querySelector(`template[\\#t1]`);
      expect(t1Anchor).toBe(t1Element);
    });

    it("it should return Child Element", () => {
      const parentNode = document.getElementById("parent") as ParentNode;
      const childAnchor = anchorRef(parentNode, "child");
      const childElement = parentNode.querySelector(`[\\#child]`);
      expect(childAnchor).toBe(childElement);
    });
  });

  describe("$", () => {
    it("", () => {
      expect($).toBe(anchorRef);
    });
  });

  describe("$$", () => {
    it("equal if $$ search sucessful", () => {
      const node = element("div");
      const list = [];
      for (let i = 0; i < 10; i++) {
        const p = element("p");
        list.push(p);
        appendChild(node)(p);
      }
      expect($$(node, "p")).toStrictEqual(list);
    });
  });

  describe("bindText", () => {
    const data = source("1");
    const p = element("p");
    it("initial data bind text", () => {
      bindText(p, data);
      expect(p.textContent).toBe("1");
    });

    it("changed if data has changed", () => {
      data.set("2");
      expect(p.textContent).toBe("2");
    });
  });

  describe("text", () => {
    it("bind text", () => {
      const p = document.createElement("p");
      const a1 = source(1);
      const fn = text`print: ${a1}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      a1.set(2);
      expect(p.textContent).toBe("print: 2");
      fn();
      a1.set(3);
      expect(p.textContent).toBe("print: 2");
    });

    it("", () => {
      const p = document.createElement("p");
      const a1 = "1";
      const fn = text`print: ${a1}`(appendChild(p));
      expect(p.textContent).toBe("print: 1");
      fn();
    });

    it("bind text error", () => {
      const fn = import.meta.jest.spyOn(console, "error");
      fn.mockImplementation(() => {});
      // @ts-expect-error
      text(["111", "222", "333"], "");
      expect(fn).toBeCalled();
      fn.mockReset();
      fn.mockRestore();
    });
  });

  describe("bindAttr", () => {
    it("bind attribute", () => {
      const disabled = source(false);
      const button = document.createElement("button");
      const cleanup = bindAttr(button, "disabled", disabled);
      expect(button.disabled).toBeFalsy();
      disabled.set(true);
      expect(button.disabled).toBeTruthy();
      cleanup();
      disabled.set(false);
      expect(button.disabled).toBeTruthy();
    });
  });

  describe("bindEvent", () => {
    it("", () => {
      const fn = import.meta.jest.fn();
      const buttonElement = document.createElement("button");
      const cleanup = bindEvent(buttonElement)("click", fn);
      buttonElement.click();
      expect(fn).toBeCalled();
      cleanup();
      buttonElement.click();
      expect(fn).toBeCalledTimes(1);
    });
  });

  describe("appendChild", () => {
    it("it should append child to current element", () => {
      const node = document.createElement("div");
      const p = document.createElement("p");
      appendChild(node)(p);
      const searchElement = node.querySelector("p");
      expect(searchElement).toStrictEqual(p);
    });
  });

  describe("before", () => {
    it("it should append element to current element before", () => {
      const container = document.createElement("div");
      const node = document.createElement("div");
      appendChild(container)(node);
      const p = document.createElement("p");
      before(node)(p);
      const beforeElement = node.previousElementSibling;
      expect(beforeElement).toStrictEqual(p);
    });
  });

  // describe("after", () => {
  // });

  describe("seqAfter", () => {
    it("", () => {
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
    it("remove node", () => {
      const node = document.createElement("div");
      remove(node);
      expect(document.getElementById("test")).toBe(null);
    });
  });

  describe("moveRange", () => {
    it("", () => {
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
      const render = moveRange(begin, end);
      render(appendChild(box));
      expect(Array.from(container.children)).toEqual([fragment[0], fragment[3]]);
      expect(Array.from(box.children)).toEqual([fragment[1], fragment[2]]);
    });
  });

  describe("insertSlot", () => {
    it("", () => {
      const container = document.createElement("div");
      const slotElement = document.createElement("div");
      insertSlot(container, "test", slotElement);
      expect(slotElement.parentElement).toBe(container);
      expect(slotElement.getAttribute("slot")).toBe("test");
    });
  });
});
