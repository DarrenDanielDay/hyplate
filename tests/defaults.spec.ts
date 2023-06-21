import { isSubscribable } from "../dist/binding";
import {} from "../dist/defaults";
import { isSignal } from "../dist/signals";
describe("defaults.ts", () => {
  describe("attribute decorator", () => {
    it("should enable builtin store", () => {
      expect(isSignal).toBe(isSubscribable);
    });
  });
});
