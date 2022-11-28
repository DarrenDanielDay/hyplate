/// <reference path="../node_modules/es-modularize/dist/index.d.ts" />

ESModularize.createProjectLoader({
  nodeGlobals: {
    process: {
      env: {
        NODE_ENV: 'development'
      }
    }
  }
}).load({})