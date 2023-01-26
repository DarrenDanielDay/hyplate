// @ts-check
import { readFile, writeFile } from "fs/promises";
import { resolve } from "path";

const cwd = process.cwd();

async function main() {
  const pjsonPath = resolve(cwd, "package.json");
  /** @type {import('fs').EncodingOption} */
  const options = "utf-8";
  /** @type {typeof import('../package.json')} */
  const packageJSON = JSON.parse(await readFile(pjsonPath, options));
  const files = packageJSON.files;
  const fileSet = new Set(files);
  /** @type {string[]} */
  const addedFiles = [];
  await Promise.all(
    Object.entries(packageJSON.exports).map(async ([subpath, fields]) => {
      if (!("default" in fields)) {
        return;
      }
      const exports = fields.default;
      const proxyPath = subpath === "." ? "./index.js" : `${subpath}.js`;
      const filename = proxyPath.slice(2);
      if (!fileSet.has(filename)) {
        addedFiles.push(filename);
      }
      const code = `export * from "${exports}";`;
      await writeFile(resolve(cwd, proxyPath), code, options);
    })
  );
  console.log(`✨ Files for proxy of package.json "exports" emitted.`);
  addedFiles.sort();
  files.push(...addedFiles);
  await writeFile(pjsonPath, JSON.stringify(packageJSON, undefined, 2) + "\n");
}

main();
