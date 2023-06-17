/*
import { parse } from "../../dist/compiler/parser";
import { generateDeclaration } from "../../dist/compiler/generator";
import { readFile } from "./file-util";
describe("generator.ts", () => {
  describe("generate declaration", () => {
    it("should generate like this", async () => {
      const examplePath = "./tests/file-tests/example/example.template.html";
      const templates = parse(await readFile(examplePath));
      const transpiled = generateDeclaration(templates, examplePath);
      expect(transpiled.code.content).toBe(await readFile("./tests/file-tests/example/example.template.d.ts"));
    });
  });
});

*/