/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { generateDeclaration } from "./generator.js";
import { parse } from "./parser.js";
import { transpile } from "./transpiler.js";
import type { EmitFile, EmitOptions, OutputWithSourceMap } from "./types.js";

export const createEmitter = ({ readFile, writeFile, path: { dirname, resolve, parse: parsePath } }: EmitOptions) => {
  return async (templatePath: string, force = false) => {
    if (parsePath(templatePath).ext !== ".html") {
      throw new Error(`Template file must have extension ".html".`);
    }
    const template = await readFile(templatePath);
    const templates = parse(template);
    const transpiled = transpile(templates, templatePath);
    const ts = generateDeclaration(templates, templatePath);
    const emitOne = async ({ path, content }: EmitFile) => {
      const targetPath = resolve(dirname(templatePath), path);
      if (!force) {
        try {
          const originalContent = await readFile(targetPath);
          if (originalContent === content) {
            return;
          }
        } catch {}
      }
      await writeFile(targetPath, content);
    };
    const emitOutput = ({ code, map }: OutputWithSourceMap) => {
      if (map) {
        return [emitOne(code), emitOne(map)];
      }
      return [emitOne(code)];
    };
    await Promise.all([...transpiled.flatMap(emitOutput), ...emitOutput(ts)]);
  };
};
