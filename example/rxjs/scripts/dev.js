// The compile steps of a hyplate project
import G from "glob";
import { promisify } from "util";
import { resolve } from "path";
import { emit } from "hyplate/compiler";
import ts from "typescript";
import { watch } from "fs";
import { loadStaticallyAndSaveDefaultJSON } from "es-modularize/node";
import packagejson from "../package.json" assert { type: "json" };
// build es-modularize static loaded json
await loadStaticallyAndSaveDefaultJSON(".", packagejson.dependencies);
// build typescript project
const watchTypeScriptProject = () => {
  /** @type {ts.FormatDiagnosticsHost} */
  const formatHost = {
    getCanonicalFileName: (path) => path,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getNewLine: () => ts.sys.newLine,
  };
  const host = ts.createWatchCompilerHost(
    resolve("./tsconfig.json"),
    {},
    ts.sys,
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    (diagnostic) => {
      console.error(
        "[TypeScript]",
        diagnostic.code,
        ":",
        ts.flattenDiagnosticMessageText(diagnostic.messageText, ts.sys.newLine)
      );
    },
    (diagnostic) => {
      console.info(ts.formatDiagnostic(diagnostic, formatHost));
    }
  );
  ts.createWatchProgram(host);
};
// build templates
const watchTemplates = async () => {
  const base = ".";
  const pattern = `${base}/**/*.template.html`;
  const existingTemplates = await promisify(G.glob)(pattern);
  await Promise.all(existingTemplates.map((t) => emit(t)));
  watch(
    base,
    {
      encoding: "utf-8",
      recursive: true,
    },
    (event, fileName) => {
      if (event === "change" && fileName.match(/\.template\.html$/)) {
        emit(resolve(base, fileName));
      }
    }
  );
};

watchTemplates();
watchTypeScriptProject();
