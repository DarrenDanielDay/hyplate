import { countLineChars, locate } from "../../dist/compiler/locator";
describe("locator.ts", () => {
  describe("count line chars", () => {
    it("should work with source without trailing line", () => {
      const source = `\
aaa
bbbbb
c


`;
      const lines = countLineChars(source);
      expect(lines).toStrictEqual([4, 10, 12, 13, 14]);
      expect(lines.at(-1)).toBe(source.length);
    });
    it("should work with source with trailing line", () => {
      const source = `\
aaa
bbbbb
c`;
      const lines = countLineChars(source);
      expect(lines).toStrictEqual([4, 10, 11]);
      expect(lines.at(-1)).toBe(source.length);
    });
    it("should work with empty source", () => {
      const source = "";
      const lines = countLineChars(source);
      expect(lines).toStrictEqual([]);
    });
  });

  describe("locate", () => {
    it("should return the lower bound as line", () => {
      const lines = [12, 22, 35];
      expect(locate(lines, 20)).toStrictEqual({ line: 2, column: 8 });
    });
    it("should work with 0 index", () => {
      const lines = [12, 22];
      expect(locate(lines, 0)).toStrictEqual({ line: 1, column: 0 });
    });
  });
});
