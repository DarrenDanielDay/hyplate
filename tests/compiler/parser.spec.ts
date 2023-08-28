import { NodeType, type ElementChildNode } from "../../dist/compiler/ast";
import { configureParser as configure, parse } from "../../dist/compiler/parser";
describe("parser.ts", () => {
  describe("Parser", () => {
    describe("functionality", () => {
      it("should parse void element", async () => {
        const { rootNodes } = await parse(`\
<input>
`);
        expect(rootNodes).toStrictEqual<ElementChildNode[]>([
          {
            type: 1,
            attributes: [],
            children: undefined,
            tag: "input",
            loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 7 } },
          },
        ]);
      });
    });
    describe("corner cases", () => {
      it("should treat unrecognized pattern as HTML", async () => {
        const { rootNodes } = await parse(`\
<time data-date-format="{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}"></time>
`);
        expect(rootNodes).toStrictEqual<ElementChildNode[]>([
          {
            type: 1,
            attributes: [
              {
                type: 3,
                name: {
                  type: 0,
                  content: "data-date-format",
                  loc: { begin: { line: 1, column: 6 }, end: { line: 1, column: 22 } },
                },
                loc: { begin: { line: 1, column: 6 }, end: { line: 1, column: 56 } },
                quote: '"',
                value: {
                  type: 0,
                  content: "{YYYY}-{MM}-{DD} {HH}:{mm}:{ss}",
                  loc: { begin: { line: 1, column: 23 }, end: { line: 1, column: 56 } },
                },
              },
            ],
            children: [],
            tag: "time",
            loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 64 } },
          },
        ]);
      });
      it("should treat unrecognized label as native JavaScript code", async () => {
        const { rootNodes } = await parse(`\
<button onclick="typo:handler">click me</button>
`);
        const [btn] = rootNodes;
        if (btn.type !== NodeType.Element) {
          fail();
        }
        const [typoAttr] = btn.attributes;
        if (typoAttr.type !== NodeType.Attribute) {
          fail();
        }
        const { value } = typoAttr;
        if (!value) {
          fail();
        }
        if (value.type !== NodeType.PlainText) {
          fail();
        }
        expect(value.content).toBe(`typo:handler`);
      });
    });
  });
  describe("when preserveEmptyTextNodes is true", () => {
    beforeAll(() => {
      configure({
        preserveEmptyTextNodes: true,
      });
    });
    it("should not omit empty text node", async () => {
      const { rootNodes } = await parse(`\
<template>
  <div lang="en" class="{cls}" id="{{id}}" onclick="delegate: greet">Hello, {world: string}!</div>
</template>
`);
      expect(rootNodes.length).toBe(2);
      const [template, emptyText] = rootNodes;
      if (emptyText.type !== NodeType.PlainText) {
        fail(`Should preserve empty text nodes`);
      }
      expect(emptyText.content).toBe("\n");
      if (template.type !== NodeType.Element) {
        fail();
      }
      if (!template.children) {
        fail();
      }
      expect(template.children.length).toBe(3);
    });
  });
  describe("when preserveEmptyTextNodes is false", () => {
    beforeAll(() => {
      configure({
        preserveEmptyTextNodes: false,
      });
    });
    it("should omit empty text node", async () => {
      const { rootNodes } = await parse(`\
<template>
  <div lang="en" class="{cls}" id="{{id}}" onclick="delegate: greet">Hello, {world: string}!</div>
</template>
`);
      expect(rootNodes.length).toBe(1);
      const [template] = rootNodes;
      if (template.type !== NodeType.Element) {
        fail();
      }
      if (!template.children) {
        fail();
      }
      expect(template.children.length).toBe(1);
    });
  });
  describe("when preserveComment is true", () => {
    beforeAll(() => {
      configure({
        preserveComment: true,
      });
    });
    it("should not omit comment node", async () => {
      const { rootNodes } = await parse(`\
<template>
  <!--should not be omitted-->
</template>
`);
      expect(rootNodes).toStrictEqual<ElementChildNode[]>([
        {
          type: NodeType.Element,
          attributes: [],
          children: [
            {
              type: NodeType.Comment,
              raw: `<!--should not be omitted-->`,
              loc: {
                begin: { line: 2, column: 2 },
                end: { line: 2, column: 30 },
              },
            },
          ],
          tag: "template",
          loc: {
            begin: { line: 1, column: 0 },
            end: { line: 3, column: 11 },
          },
        },
      ]);
    });
  });
  describe("when preserveComment is false", () => {
    beforeAll(() => {
      configure({
        preserveComment: false,
      });
    });
    it("should omit empty text node", async () => {
      const { rootNodes } = await parse(`\
<template>
  <!-- should be omitted -->
</template>
`);
      expect(rootNodes).toStrictEqual<ElementChildNode[]>([
        {
          type: NodeType.Element,
          attributes: [],
          children: [],
          tag: "template",
          loc: {
            begin: { line: 1, column: 0 },
            end: { line: 3, column: 11 },
          },
        },
      ]);
    });
  });
});
