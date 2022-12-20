// @ts-check
import esbuild from "esbuild";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { emit } from "../dist/compiler/index.js";
esbuild.build({
  watch: true,
  entryPoints: ["./web/index.js"],
  bundle: true,
  sourcemap: true,
  outfile: "./web/bundle.js",
  plugins: [
    {
      name: "hyplate",
      setup(b) {
        const pattern = /\.template(\.js|\.html)?$/;
        b.onResolve({ filter: pattern }, async ({ path, resolveDir }) => ({
          path: resolve(resolveDir, path.replace(pattern, ".template.html")),
        }));
        b.onLoad({ filter: pattern }, async ({ path }) => {
          await emit(path);
          return {
            watchFiles: [path],
            contents: await readFile(path.replace(pattern, ".template.js")),
          };
        });
      },
    },
  ],
});
