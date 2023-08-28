import { type ViewModelPropertyNode, type PlainTextNode, NodeType } from "../../dist/compiler/ast";
import { isValidIdentifier, parseVMPropsInText } from "../../dist/compiler/lexer";
import { Locator } from "../../dist/compiler/locator";

describe("lexer.ts", () => {
  describe("isValidIdentifier", () => {
    it("should return false with string starting with number", () => {
      expect(isValidIdentifier("0asd")).toBeFalsy();
      expect(isValidIdentifier("1asd")).toBeFalsy();
      expect(isValidIdentifier("9")).toBeFalsy();
    });
    it("should return true with valid identifier", () => {
      expect(isValidIdentifier("_1")).toBeTruthy();
      expect(isValidIdentifier("hello")).toBeTruthy();
      expect(isValidIdentifier("_hello")).toBeTruthy();
      expect(isValidIdentifier("Привет")).toBeTruthy();
      expect(isValidIdentifier("你好")).toBeTruthy();
      expect(isValidIdentifier("こんにちは")).toBeTruthy();
      expect(isValidIdentifier("안녕하세요")).toBeTruthy();
      expect(isValidIdentifier("مرحبًا")).toBeTruthy();
      expect(isValidIdentifier("Ħello")).toBeTruthy();
      expect(isValidIdentifier("សួស្តី")).toBeTruthy();
    });
  });
  describe("parseVMPropsInText", () => {
    it("should work with multiple patterns", () => {
      const text = `\
{ a } asdasd {  b : xx} sth inside {{ c:d}}{a:shouldbeskipped:x}{{ aaa}}trailing\
`;
      const locator = new Locator(text);
      const parsedNodes = parseVMPropsInText(text, locator, 0);
      expect(parsedNodes).toStrictEqual<(ViewModelPropertyNode | PlainTextNode)[]>([
        {
          type: 5,
          typedef: undefined,
          identifier: { type: 0, content: "a", loc: { begin: { line: 1, column: 2 }, end: { line: 1, column: 3 } } },
          loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
        },
        { type: 0, content: " asdasd ", loc: { begin: { line: 1, column: 5 }, end: { line: 1, column: 13 } } },
        {
          type: 5,
          identifier: { type: 0, content: "b", loc: { begin: { line: 1, column: 16 }, end: { line: 1, column: 17 } } },
          typedef: { type: 0, content: "xx", loc: { begin: { line: 1, column: 20 }, end: { line: 1, column: 22 } } },
          loc: { begin: { line: 1, column: 13 }, end: { line: 1, column: 23 } },
        },
        { type: 0, content: " sth inside ", loc: { begin: { line: 1, column: 23 }, end: { line: 1, column: 35 } } },
        {
          type: 4,
          identifier: { type: 0, content: "c", loc: { begin: { line: 1, column: 38 }, end: { line: 1, column: 39 } } },
          typedef: { type: 0, content: "d", loc: { begin: { line: 1, column: 40 }, end: { line: 1, column: 41 } } },
          loc: { begin: { line: 1, column: 35 }, end: { line: 1, column: 43 } },
        },
        {
          type: 0,
          content: "{a:shouldbeskipped:x}",
          loc: { begin: { line: 1, column: 43 }, end: { line: 1, column: 64 } },
        },
        {
          type: 4,
          typedef: undefined,
          identifier: {
            type: 0,
            content: "aaa",
            loc: { begin: { line: 1, column: 67 }, end: { line: 1, column: 70 } },
          },
          loc: { begin: { line: 1, column: 64 }, end: { line: 1, column: 72 } },
        },
        { type: 0, content: "trailing", loc: { begin: { line: 1, column: 72 }, end: { line: 1, column: 80 } } },
      ]);
    });
    it("should parse single pattern", () => {
      const text = `{ a }`;
      const locator = new Locator(text);
      const parsedNodes = parseVMPropsInText(text, locator, 0);
      expect(parsedNodes).toStrictEqual<ViewModelPropertyNode[]>([
        {
          type: 5,
          typedef: undefined,
          identifier: { type: 0, content: "a", loc: { begin: { line: 1, column: 2 }, end: { line: 1, column: 3 } } },
          loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
        },
      ]);
    });
    it("should skip braces with invalid first identifiers", () => {
      const text = `{ 0 }`;
      const locator = new Locator(text);
      const parsedNodes = parseVMPropsInText(text, locator, 0);
      expect(parsedNodes).toStrictEqual<PlainTextNode[]>([
        {
          type: 0,
          content: `{ 0 }`,
          loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 5 } },
        },
      ]);
    });
    it("should skip braces with invalid second identifiers", () => {
      const text = `{ a: 0 }`;
      const locator = new Locator(text);
      const parsedNodes = parseVMPropsInText(text, locator, 0);
      expect(parsedNodes).toStrictEqual<PlainTextNode[]>([
        {
          type: 0,
          content: `{ a: 0 }`,
          loc: { begin: { line: 1, column: 0 }, end: { line: 1, column: 8 } },
        },
      ]);
    });
  });
});
