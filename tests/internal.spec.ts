import { before, element } from "../dist/core";
import { comment, withCommentRange } from "../dist/internal";
import { setMode } from "../dist/util";
describe("internal.ts", () => {
  describe("comment", () => {
    it("should create comment", () => {
      expect(comment()).toBeInstanceOf(Comment);
    });

    it("should create comment with content", () => {
      expect(comment("message").textContent).toBe("message");
    });
    it("should ", () => {
      setMode(false);
      expect(comment("message").textContent).toBe("");
      setMode(true);
    });
  });
  describe("with comment range", () => {
    it("should create a comment range", () => {
      const container = document.createElement("div");
      const [cleanup, [begin, end, clear], getRange] = withCommentRange("test");
      container.append(begin, end);
      const attach = before(end);
      attach(new Text("text 1"));
      attach(new Text("text 2"));
      expect(getRange()).toStrictEqual([begin, end]);
      expect(container.textContent).toBe("text 1text 2");
      clear();
      expect(container.textContent).toBe("");
      cleanup();
    });
  });
});
