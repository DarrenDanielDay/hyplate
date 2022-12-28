import { configureParser as configure, parse } from "../../dist/compiler/parser";
import type { ParsedNode, ViewSlots } from "../../dist/compiler/types";
describe("parser.ts", () => {
  describe("when `preserveEmptyTextNodes` is true", () => {
    beforeAll(() => {
      configure({
        preserveEmptyTextNodes: true,
      });
    });
    it("should not omit empty text node", () => {
      const templates = parse(`\
<template>
  <div>Hello, world!</div>
</template>
`);
      const defaultTemplate = templates.default;
      expect(defaultTemplate).toBeTruthy();
      expect(defaultTemplate.nodes).toStrictEqual<ParsedNode[]>([
        {
          type: "text",
          content: `
  `,
        },
        {
          type: "open",
          name: "div",
          attributes: [],
        },
        {
          type: "text",
          content: `Hello, world!`,
        },
        {
          type: "close",
          name: "div",
        },
        {
          type: "text",
          content: `
`,
        },
      ]);
    });
  });
  describe("when `preserveEmptyTextNodes` is false", () => {
    beforeAll(() => {
      configure({
        preserveEmptyTextNodes: false,
      });
    });
    it("should omit empty text node", () => {
      const templates = parse(`\
<template>
  <div> Hello, world! </div>
</template>
`);
      const defaultTemplate = templates.default;
      expect(defaultTemplate).toBeTruthy();
      expect(defaultTemplate.nodes).toStrictEqual<ParsedNode[]>([
        {
          type: "open",
          name: "div",
          attributes: [],
        },
        {
          type: "text",
          content: `Hello, world!`,
        },
        {
          type: "close",
          name: "div",
        },
      ]);
    });
  });
  describe("when `preserveComment` is true", () => {
    beforeAll(() => {
      configure({
        preserveComment: true,
      });
    });
    it("should not omit comment node", () => {
      const templates = parse(`\
<template>
  <!--should not be omitted-->
</template>
`);
      const defaultTemplate = templates.default;
      expect(defaultTemplate.nodes.find((node) => node.type === "text" && node.content.includes("!--"))).toBeTruthy();
    });
  });
  describe("when `preserveComment` is false", () => {
    beforeAll(() => {
      configure({
        preserveComment: false,
      });
    });
    it("should omit empty text node", () => {
      const templates = parse(`\
<template>
  <!-- should be omitted -->
</template>
`);
      const defaultTemplate = templates.default;
      expect(defaultTemplate.nodes.find((node) => node.type === "text" && node.content.includes("!--"))).toBeFalsy();
    });
  });
  describe("when `preserveAnchor` is true", () => {
    beforeAll(() => {
      configure({
        preserveAnchor: true,
      });
    });
    it("should not omit anchor attribute", () => {
      const templates = parse(`\
<template>
  <div #root>the root</div>
</template>
`);
      const defaultTemplate = templates.default;
      expect(
        defaultTemplate.nodes.find(
          (node) => node.type === "open" && node.attributes.find((a) => a.name.value.startsWith("#"))
        )
      ).toBeTruthy();
    });
    it("should work with self closing tags", () => {
      const templates = parse(`\
      <template>
        <img #img />
      </template>
      `);
      const defaultTemplate = templates.default;
      expect(
        defaultTemplate.nodes.find(
          (node) => node.type === "self" && node.attributes.find((a) => a.name.value.startsWith("#"))
        )
      ).toBeTruthy();
    });
  });
  describe("when `preserveAnchor` is false", () => {
    beforeAll(() => {
      configure({
        preserveAnchor: false,
      });
    });
    it("should omit anchor attribute", () => {
      const templates = parse(`\
<template>
  <div #root>the root</div>
</template>
`);
      const defaultTemplate = templates.default;
      expect(
        defaultTemplate.nodes.find(
          (node) => node.type === "open" && node.attributes.find((a) => a.name.value.startsWith("#"))
        )
      ).toBeFalsy();
    });
    it("should work with self closing tag", () => {
      const templates = parse(`\
<template>
  <br #newLine/>
</template>
      `);
      const defaultTemplate = templates.default;
      expect(
        defaultTemplate.nodes.find(
          (node) => node.type === "open" && node.attributes.find((a) => a.name.value.startsWith("#"))
        )
      ).toBeFalsy();
    });
  });
  describe("warnings & errors", () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
      warnSpy = import.meta.jest.spyOn(console, "warn");
      warnSpy.mockImplementation(() => {});
    });
    afterEach(() => {
      warnSpy.mockReset();
      warnSpy.mockRestore();
    });
    it("should emit warning if global text is present", () => {
      parse(`Should warn with global text.
<template>
  <div>world</div>
</template>
`);
      expect(warnSpy).toBeCalledTimes(1);
      parse(`
<!-- But not the comments. -->
<template>
  <div>world</div>
</template>
`);
      expect(warnSpy).toBeCalledTimes(1);
    });
    it("should emit warning if global tag except `template` is present", () => {
      parse(`<div>ignored global tag div</div>`);
      expect(warnSpy).toBeCalledTimes(1);
    });
    it("should emit error if duplicated template anchor found", () => {
      expect(() => {
        parse(`
        <template>
        </template>
        
        <template>
        </template>
        `);
      }).toThrow(/duplicated/i);
      expect(() => {
        parse(`
        <template #foo>
        </template>
        
        <template #foo>
        </template>
        `);
      }).toThrow(/duplicated/i);
      expect(() => {
        parse(`
        <template #foo>
        </template>
        
        <template #bar>
        </template>
        `);
      }).not.toThrow(/duplicated/i);
    });
    it("should emit warning if anchor value provided", () => {
      parse(`<template #a="b"></template>`);
      expect(warnSpy).toBeCalledTimes(1);
    });
    it("should emit error if mutiple anchor attribute specified", () => {
      expect(() => {
        parse(`<template #a #b></template>`);
      }).toThrow(/multiple/i);
      expect(() => {
        parse(`
<template #a>
  <div #a #b></div>
</template>
`);
      }).toThrow(/multiple/i);
      expect(() => {
        parse(`
<template #a>
  <hr #a #b/>
</template>
`);
      }).toThrow(/multiple/i);
    });
    it("should emit error if slot name is not specified", () => {
      expect(() => {
        parse(`
<template>
  <header>
    <slot></slot>
  </header>
</template>`);
      }).toThrow(/slot name/i);
      expect(() => {
        parse(`
<template>
  <header>
    <slot name></slot>
  </header>
</template>`);
      }).toThrow(/name attribute/i);
    });
    it("should emit error if multiple slot names specified", () => {
      expect(() => {
        parse(`
<template>
  <header>
    <slot name="a" name="b"></slot>
  </header>
</template>`);
      }).toThrow(/multiple name/i);
      expect(() => {
        parse(`
<template>
  <header>
    <slot name="a"></slot>
  </header>
  <footer>
    <slot name="a"></slot>
  </footer>
</template>`);
      }).toThrow(/duplicated slot name/i);
    });
    it("should emit error if global template anchor is not a valid identifier", () => {
      expect(() => {
        // Empty string is invalid.
        parse(`<template #></template>`);
      }).toThrow(/invalid identifier/i);
      expect(() => {
        // Starting with number is invalid.
        parse(`<template #1abc></template>`);
      }).toThrow(/invalid identifier/i);
      expect(() => {
        // `kebab-case` is invalid.
        parse(`<template #some-name></template>`);
      }).toThrow(/invalid identifier/i);
      expect(() => {
        // Keyword is invalid.
        parse(`<template #if></template>`);
      }).toThrow(/invalid identifier/i);
      expect(() => {
        // `package` is reserved word in strict mode.
        parse(`<template #package></template>`);
      }).toThrow(/invalid identifier/i);
      // But not the child templates.
      expect(() => {
        parse(`\
<template>
  <template #if></template>
</template>
`);
      }).not.toThrow(/invalid identifier/i);
    });
  });
  describe("nested template", () => {
    it("should create nested template", () => {
      const templates = parse(`
<template #foo>
  <ul class="list">
    <template #item>
      <li class="item"></li>
    </template>
  </ul>
</template>
`);
      expect(templates.foo).toBeTruthy();
      expect(templates.foo.children.item).toBeTruthy();
    });
  });
  describe("anchor refs", () => {
    it("should transform with path", () => {
      const templates = parse(`
<template>
  <div></div>
  <div class="toolbar">
    <button #ok>confirm</button>
    <button #cancel>cancel</button>
  </div>
</template>
`);
      expect(templates.default.refs.ok.path).toStrictEqual([1, 0]);
      expect(templates.default.refs.cancel.path).toStrictEqual([1, 1]);
    });
    it("should infer anchor element type", () => {
      const templates = parse(`
<template>
  <div #div1></div>
  <span #span1></span>
  <a #a1></a>
  <svg #svg1 xmlns="http://www.w3.org/2000/svg">
    <a #a2></a>
    <svg xmlns="http://www.w3.org/2000/svg">
      <a #a3></a>
    </svg>
  </svg>
  <a #a4></a>
  <custom-element #c1></custom-element>
</template>
`);
      const template = templates.default;
      expect(template.refs.div1.el).toBe("HTMLDivElement");
      expect(template.refs.span1.el).toBe("HTMLSpanElement");
      expect(template.refs.a1.el).toBe("HTMLAnchorElement");
      expect(template.refs.svg1.el).toBe("SVGSVGElement");
      expect(template.refs.a2.el).toBe("SVGAElement");
      expect(template.refs.a3.el).toBe("SVGAElement");
      expect(template.refs.a4.el).toBe("HTMLAnchorElement");
      // Unknown tags are treated as "Element".
      expect(template.refs.c1.el).toBe("Element");
    });
  });
  describe("slots", () => {
    it("should detect slot names", () => {
      const templates = parse(`\
<template>
  <header>
    <slot name="header">fallback header</slot>
  </header>
  <footer>
    <slot name="footer">fallback footer</slot>
  </footer>
</template>`);
      const expected: ViewSlots = {
        header: {
          name: "header",
          position: {
            line: 3,
            column: 15,
          },
        },
        footer: {
          name: "footer",
          position: {
            line: 6,
            column: 15,
          },
        },
      };
      expect(templates.default.slots).toStrictEqual(expected);
    });
  });
  describe("extracted", () => {
    it("should extract style elements", () => {
      const defaultTemplate = parse(`\
<template>
  <div>Hello, <span>world</span>!</div>
  <style>
    span {
      color: red;
    }
  </style>
</template>
`).default;
      expect(defaultTemplate.styles.length).toBe(1);
    });
  });
});
