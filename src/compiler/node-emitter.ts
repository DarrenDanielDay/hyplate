/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { readFile, writeFile } from "fs/promises";
import { parse as parsePath } from "path";
import { generateDeclaration } from "./generator.js";
import { parse } from "./parser.js";
import { transpile } from "./transpiler.js";
import type { TemplateFactory } from "./types.js";

export const emit = async (templatePath: string, factory: TemplateFactory = "replaced") => {
  if (parsePath(templatePath).ext !== ".html") {
    throw new Error(`Template file must have extension ".html".`);
  }
  const template = await readFile(templatePath, { encoding: "utf-8" });
  const templates = parse(template);
  const js = transpile(templates, templatePath, factory);
  const ts = generateDeclaration(templates, templatePath);
  await Promise.all([
    writeFile(js.code.path, js.code.content),
    writeFile(js.map.path, js.map.content),
    writeFile(ts.code.path, ts.code.content),
    writeFile(ts.map.path, ts.map.content),
  ]);
};
