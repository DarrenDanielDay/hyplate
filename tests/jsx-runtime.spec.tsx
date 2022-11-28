describe("jsx-runtime.ts", () => {
  describe("JSX syntax", () => {
    it("should work", () => {
      const msg = "world";
      const x = (
        <div data-x=''>
          <div>Hello, {msg} !</div>
        </div>
      );
      expect(x).toBeTruthy();
    });
  });
});
export {};
