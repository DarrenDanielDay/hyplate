import { isSubscribable } from "../dist/binding";
import {} from "../dist/defaults";
import { isQuery } from "../dist/store";
describe("defaults.ts", () => {
  describe("attribute decorator", () => {
    it("should enable builtin store", () => {
      expect(isQuery).toBe(isSubscribable);
    });
  });
});
