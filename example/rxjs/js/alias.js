/// <reference path="../node_modules/es-modularize/dist/index.d.ts" />
const json = ESModularize.createStaticProjectLoader({
  nodeGlobals: {
    process: {
      env: {
        NODE_ENV: "production",
      },
    },
  },
}).loadResolved();
ESModularize.build(json);
