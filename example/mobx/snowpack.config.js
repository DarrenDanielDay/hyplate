// @ts-check
// Snowpack Configuration File
// See all supported options: https://www.snowpack.dev/reference/configuration

/** @type {import("snowpack").SnowpackUserConfig } */
const config = {
  mount: {
    src: "/",
  },
  plugins: [
    /* ... */
  ],
  packageOptions: {
    /* ... */
  },
  devOptions: {
    hmr: true,
    output: "stream",
    /* ... */
  },
  buildOptions: {
    jsxInject: 'import { jsx as h, Fragment } from "hyplate/jsx-runtime";',
    jsxFactory: "h",
    jsxFragment: "Fragment",
    /* ... */
  },
};
export { config as default };
