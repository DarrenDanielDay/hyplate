import { emit } from "../../dist/compiler/node-emitter";
describe("node-emitter.ts", () => {
  describe("emit", () => {
    it("should emit error when path does not have `.html` extension", async () => {
      try {
        await emit("template.htm");
        fail("did not throw");
      } catch (error) {}
    });
    it("should write 4 files", async () => {
      await emit("./tests/file-tests/example/example.template.html");
    });
  });
});
