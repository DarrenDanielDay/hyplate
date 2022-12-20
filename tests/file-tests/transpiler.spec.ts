import { parse } from "../../dist/compiler/parser";
import { transpile } from "../../dist/compiler/transpiler";
import { readFile } from "./file-util";
describe("transpiler.ts", () => {
  describe("transpile", () => {
    it("should transpile like this", async () => {
      const examplePath = "./tests/file-tests/example/example.template.html";
      const templates = parse(await readFile(examplePath));
      const transpiled = transpile(templates, examplePath);
      expect(transpiled.code.content).toBe(await readFile("./tests/file-tests/example/example.template.js"));
    });
  });
});
