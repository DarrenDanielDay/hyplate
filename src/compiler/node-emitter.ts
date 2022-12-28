/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { readFile, writeFile } from "fs/promises";
import { parse as parsePath, resolve, dirname } from "path";
import { generateDeclaration } from "./generator.js";
import { parse } from "./parser.js";
import { transpile } from "./transpiler.js";
import type { EmitFile, OutputWithSourceMap, TemplateFactory } from "./types.js";

export const emit = async (templatePath: string, factory: TemplateFactory = "shadowed") => {
  if (parsePath(templatePath).ext !== ".html") {
    throw new Error(`Template file must have extension ".html".`);
  }
  const template = await readFile(templatePath, { encoding: "utf-8" });
  const templates = parse(template);
  const transpiled = transpile(templates, templatePath, factory);
  const ts = generateDeclaration(templates, templatePath);
  const emitOne = ({ path, content }: EmitFile) => {
    const targetPath = resolve(dirname(templatePath), path);
    return writeFile(targetPath, content);
  };
  const emitOutput = ({ code, map }: OutputWithSourceMap) => {
    if (map) {
      return [emitOne(code), emitOne(map)];
    }
    return [emitOne(code)];
  };
  await Promise.all([...transpiled.flatMap(emitOutput), ...emitOutput(ts)]);
};
