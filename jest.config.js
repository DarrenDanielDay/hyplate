// @ts-check
/** @type {import('jest').Config} */
const config = {
  rootDir: "./test-dist",
  testMatch: ["./**/?(*.)+(spec|test).[j]s?(x)"],
  testEnvironment: "jsdom",
};
export default config;
