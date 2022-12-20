// @ts-check
import esbuild from "esbuild";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { emit } from "hyplate/compiler";
esbuild.serve(
  {
    servedir: "public",
  },
  {
    entryPoints: ["./src/index.tsx"],
    //#region development mode
    platform: "neutral",
    define: {
      "process.env.NODE_ENV": "'development'",
    },
    //#endregion
    //#region production mode
    // platform: 'browser',
    //#endregion
    bundle: true,
    sourcemap: true,
    outdir: "public/dist",
    plugins: [
      {
        name: "hyplate",
        setup(b) {
          const pattern = /\.template(\.js|\.html)?$/;
          b.onResolve({ filter: pattern }, async ({ path, resolveDir }) => ({
            path: resolve(resolveDir, path.replace(pattern, ".template.html")),
          }));
          b.onLoad({ filter: pattern }, async ({ path }) => {
            try {
              // This is the essential compiler method of hyplate. All in one!
              await emit(path, "shadowed");
            } catch (error) {
              return {
                errors: [
                  {
                    detail: error,
                    text: error instanceof Error ? error.message : undefined,
                  },
                ],
              };
            }
            return {
              watchFiles: [path],
              contents: await readFile(path.replace(pattern, ".template.js")),
            };
          });
        },
      },
    ],
  }
);
