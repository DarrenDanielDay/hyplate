import pluginTerser from "rollup-plugin-terser";
import pluginReplace from "@rollup/plugin-replace";
/** @type {import('rollup').RollupOptions} */
const config = {
  input: {
    "index.browser.esm.min": "./dist/index.js",
    "binding.browser.esm.min": "./dist/binding.js",
    "core.browser.esm.min": "./dist/core.js",
    "directive.browser.esm.min": "./dist/directive.js",
    "hooks.browser.esm.min": "./dist/hooks.js",
    "identifiers.browser.esm.min": "./dist/identifiers.js",
    "jsx-runtime.browser.esm.min": "./dist/jsx-runtime.js",
    "store.browser.esm.min": "./dist/store.js",
    "template.browser.esm.min": "./dist/template.js",
    "toolkit.browser.esm.min": "./dist/toolkit.js",
  },
  external: [],
  plugins: [
    pluginReplace({
      preventAssignment: true,
      "process.env.NODE_ENV": "'production'",
    }),
  ],
  output: {
    format: "esm",
    dir: "dist",
    plugins: [pluginTerser.terser()],
  },
};
export default config;
