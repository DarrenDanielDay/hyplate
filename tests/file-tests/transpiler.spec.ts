import { parse } from "../../dist/compiler/parser";
import { configureTranspiler, transpile } from "../../dist/compiler/transpiler";
import { readFile } from "./file-util";
describe("transpiler.ts", () => {
  describe("transpile", () => {
    it("should transpile like this", async () => {
      const examplePath = "./tests/file-tests/example/example.template.html";
      const templates = parse(await readFile(examplePath));
      const transpiled = transpile(templates, examplePath);
      expect(transpiled[0].code.content).toBe(await readFile("./tests/file-tests/example/example.template.js"));
    });
    describe("external styles", () => {
      describe("usage", () => {
        const templates = parse(`\
<template>
  <input type="checkbox" checked />
  <style media="screen" scoped>input:checked { background-color: blue; }</style>
</template>
`);

        const fakePath = "./inline.html";
        it("should emit inline style code when `externalStyles` set to false", () => {
          configureTranspiler({
            externalStyles: false,
          });
          const transpiled = transpile(templates, fakePath);
          expect(transpiled[0].code.content.includes("</style>")).toBeTruthy();
        });
        it("should emit style file when `externalStyles` set to false", () => {
          configureTranspiler({
            externalStyles: true,
          });
          const transpiled = transpile(templates, fakePath);
          expect(transpiled.length).toBe(2);
          expect(transpiled[0].code.content.includes("</style>")).toBeFalsy();
          expect(transpiled[1].code.content).toBe("input:checked { background-color: blue; }");
        });
      });
      describe("self closing style tag", () => {
        // It's semantically invalid, but syntactically correct.
        const templates = parse(`\
<template>
  <style />
</template>
  `);
        const fakePath = "./inline.html";
        it("should not throw", () => {
          configureTranspiler({
            externalStyles: false,
          });
          expect(() => {
            transpile(templates, fakePath);
          }).not.toThrow();
          configureTranspiler({
            externalStyles: true,
          });
          expect(() => {
            transpile(templates, fakePath);
          }).not.toThrow();
        });
      });
    });
    describe("relative urls", () => {
      it("should not change url like attributes when `relativeURLs` set to false", () => {
        configureTranspiler({
          relativeURLs: false,
        });
        const transpiled = transpile(
          parse(`\
<template>
  <img src="./foo.jpg"/>
</template>
`),
          "./inline.html"
        );
        expect(transpiled[0].code.content).toMatch(/src=(['"])\.\/foo\.jpg\1/);
      });
    });
  });
});
