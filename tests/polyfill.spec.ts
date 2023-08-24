import "../dist/polyfill";
describe("polyfill.ts", () => {
  describe("Symbol.metadata", () => {
    it("should be defined", () => {
      expect(typeof Symbol).toBe("function");
      expect(typeof Symbol.metadata).toBe("symbol");
    });
    it("should have correct description", () => {
      expect(Symbol.metadata.description).toBe("Symbol.metadata");
    });
    it("should be immutable property", () => {
      const descriptor = Object.getOwnPropertyDescriptors(Symbol).metadata;
      expect(descriptor).toEqual<PropertyDescriptor>({
        configurable: false,
        enumerable: false,
        writable: false,
        value: Symbol.metadata,
      });
    });
    it("should not be a key in the global symbol registry", () => {
      expect(Symbol.keyFor(Symbol.metadata)).toBeUndefined();
    });
  });
});
