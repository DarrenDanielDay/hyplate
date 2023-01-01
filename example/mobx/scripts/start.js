import G from "glob";
import { configureTranspiler, emit } from "hyplate/compiler";
import { watch } from "chokidar";
import { promisify } from "util";
import { exec as _exec } from "child_process";

/** @type {import('hyplate/compiler').TemplateFactory} */
const factory = "replaced";
const templatePattern = "./src/**/*.template.html";
configureTranspiler({
  relativeURLs: "import",
  externalStyles: "import",
});

function watchDev() {
  watch(templatePattern).on("change", async (path) => {
    try {
      await emit(path, factory);
    } catch (error) {
      console.error(`[hyplate error]:`, error);
    }
  });
}

async function buildOnce() {
  const glob = promisify(G.glob);
  const exec = promisify(_exec);
  const templates = await glob(templatePattern);
  await Promise.all(templates.map((template) => emit(template, factory)));
  await exec("tsc");
}
/**
 *
 * @param {boolean} buildOnly
 */
async function main(buildOnly) {
  await buildOnce();
  if (buildOnly) {
    return;
  } else {
    watchDev();
  }
}

main(process.argv.includes("--build"));
