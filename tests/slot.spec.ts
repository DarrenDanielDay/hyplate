import { assignSlot, insertSlot } from "../dist/slot";
import { mock, reset } from "./dom-api-mock";
describe("slot.ts", () => {
  beforeAll(mock);
  afterAll(reset);
  describe("insertSlot", () => {
    it("should insert element as slot", () => {
      const container = document.createElement("div");
      const slotElement = document.createElement("div");
      insertSlot(container, "test", slotElement);
      expect(slotElement.parentElement).toBe(container);
      expect(slotElement.slot).toBe("test");
    });
  });
  describe("assignSlot", () => {
    it("should assign element or text as slot", () => {
      const container = document.createElement("div");
      container.attachShadow({ mode: "open" });
      const slotElement = document.createElement("slot");
      const slotContent = document.createElement("div");
      assignSlot(container, slotElement, [slotContent]);
      expect(slotContent.parentElement).toBe(container);
      expect(slotElement.assignedNodes()).toStrictEqual([slotContent]);
    });
  });
});
