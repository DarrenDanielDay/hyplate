import { resolve } from "path";
import { readFile as r } from "fs/promises";

const cwd = process.cwd();

export const readFile = (pathToProjectRoot: string) => {
  const absPath = resolve(cwd, pathToProjectRoot);
  return r(absPath, { encoding: "utf-8" });
};
