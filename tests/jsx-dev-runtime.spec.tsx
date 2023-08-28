import { element } from "../dist/core";
import { jsxDEV } from "../dist/jsx-dev-runtime";
import { mount, unmount } from "../dist/jsx-runtime";

describe("jsx-dev-runtime.ts", () => {
  describe("jsxDEV", () => {
    it("should create mountable", () => {
      const mountable = jsxDEV("p");
      const rendered = mount(mountable, element("div"));
      expect(rendered[1]).toBeInstanceOf(window.HTMLParagraphElement);
      unmount(rendered);
    });
  });
});
