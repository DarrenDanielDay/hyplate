/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { SourceMapGenerator } from "source-map";
import { objectEntriesMap } from "../util.js";
import { createObjLikeExp, replaceExt, sourceName } from "./shared.js";
import type { ChildTemplates, OutputWithSourceMap, Template } from "./types.js";

const dtsCodeTemplate = (template: Template) => {
  const id = template.anchor;
  const createSlotObjects = (template: Template, indent: number) =>
    createObjLikeExp(
      objectEntriesMap(template.slots, () => "S"),
      indent,
      ";"
    );
  const createRefsType = (template: Template, indent: number) =>
    createObjLikeExp(
      objectEntriesMap(template.refs, ([, value]) => `${value.el}`),
      indent,
      ";"
    );
  const createSetupFactoryType = (template: Template, indent: number): string => {
    return `F<C<${createRefsType(template, indent)}>, ${createSlotObjects(template, indent)}> & ${createObjLikeExp(
      objectEntriesMap(template.children, ([, value]) => {
        return createSetupFactoryType(value, indent + 1);
      }),
      indent,
      ";"
    )}`;
  };
  return `\
declare type $${id} = ${createSetupFactoryType(template, 0)};
declare const _${id}: $${id}`;
};

export const generateDeclaration = (templates: ChildTemplates, path: string): OutputWithSourceMap => {
  const source = sourceName(path);
  const code = generateDTS(templates, path);
  const map = generateDTSMap(templates, path);
  return {
    code: {
      content: code,
      path: `./${replaceExt(source, ".d.ts")}`,
    },
    map: {
      content: map,
      path: `./${replaceExt(source, ".d.ts.map")}`,
    },
  };
};

export const generateDTS = (templates: ChildTemplates, path: string) => {
  const source = sourceName(path);
  const importCode = `import type {ContextSetupFactory as F,TemplateContext as C, SlotContent as S} from "hyplate/types";`;
  const declarations = Object.values(templates)
    .map((template) => dtsCodeTemplate(template))
    .join("\n");
  const exportsCode = `export {${Object.keys(templates)
    .map((k) => `_${k} as ${k}`)
    .join(",")}};`;
  const code = `\
${importCode}
${declarations}
${exportsCode}
//# sourceMappingURL=${replaceExt(source, ".d.ts.map")}
`;
  return code;
};

export const generateDTSMap = (templates: ChildTemplates, path: string): string => {
  let line = 0;
  let indent = 0;
  const source = sourceName(path);
  const sourcemap = new SourceMapGenerator({
    file: `${replaceExt(source, ".d.ts")}`,
    sourceRoot: "",
  });
  const moveNextLine = () => {
    line++;
    // @ts-expect-error unknown source map issue
    sourcemap.addMapping({
      generated: {
        line,
        column: 0,
      },
    });
  };
  const walk = (template: Template) => {
    indent++;
    // refs
    for (const [, ref] of Object.entries(template.refs)) {
      moveNextLine();
      sourcemap.addMapping({
        original: ref.position,
        generated: {
          line,
          column: indent * 2,
        },
        source,
      });
    }
    moveNextLine(); // skip "}>,"
    // slots
    const slotEntries = Object.entries(template.slots);
    if (!slotEntries.length) {
      moveNextLine(); // move to "never"
    } else {
      for (const [, slot] of slotEntries) {
        moveNextLine();
        sourcemap.addMapping({
          original: slot.position,
          generated: {
            line,
            column: indent * 2,
          },
          source,
        });
      }
    }
    moveNextLine(); // move to "}> & {"
    // templates
    for (const child of Object.values(template.children)) {
      moveNextLine();
      sourcemap.addMapping({
        original: child.position,
        generated: {
          line,
          column: indent * 2,
        },
        source,
      });
      walk(child);
    }
    moveNextLine(); // skip "};"
  };
  moveNextLine();
  moveNextLine();
  for (const template of Object.values(templates)) {
    walk(template);
    // move to next declaration.
    moveNextLine();
    moveNextLine();
  }
  return sourcemap.toString();
};
