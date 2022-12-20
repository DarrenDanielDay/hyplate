import { SourceMapGenerator } from "source-map";
import { objectEntriesMap } from "../util.js";
import { HTMLTagTypeMapping } from "./mapping.js";
import { createObjLikeExp, replaceExt, str, tabs } from "./shared.js";
import type { ChildTemplates, OutputWithSourceMap, Template } from "./types.js";

const dtsCodeTemplate = (template: Template) => {
  const id = template.anchor;
  const mapping: Record<string, string | undefined> = HTMLTagTypeMapping;
  const createSlotUnion = (template: Template, indent: number) => {
    const unionSpace = tabs(indent);
    return (
      Object.entries(template.slots)
        .map(([s]) => `${unionSpace}| ${str(s)}`)
        .join("\n") || `${unionSpace}never`
    );
  };
  const createRefsType = (template: Template, indent: number) =>
    createObjLikeExp(
      objectEntriesMap(template.refs, ([, value]) => `${mapping[value.tag] ?? "Element"}`),
      indent,
      ";"
    );
  const createSetupFactoryType = (template: Template, indent: number): string => {
    return `F<C<${createObjLikeExp(
      objectEntriesMap(template.children, ([, value]) => {
        return createSetupFactoryType(value, indent + 1);
      }),
      indent,
      ";"
    )}, ${createRefsType(template, indent)}>,
${createSlotUnion(template, indent)}
${tabs(indent)}>`;
  };
  return `\
declare type $${id} = ${createSetupFactoryType(template, 0)};
declare const _${id}: $${id}`;
};

export const generateDeclaration = (templates: ChildTemplates, path: string): OutputWithSourceMap => {
  const code = generateDTS(templates, path);
  const map = generateDTSMap(templates, path);
  return {
    code: {
      content: code,
      path: replaceExt(path, ".d.ts"),
    },
    map: {
      content: map,
      path: replaceExt(path, ".d.ts.map"),
    },
  };
};

export const generateDTS = (templates: ChildTemplates, path: string) => {
  const importCode = `import type {ContextSetupFactory as F,TemplateContext as C} from "hyplate/types";`;
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
//# sourceMappingURL=${replaceExt(path.split("/").at(-1)!, ".d.ts.map")}
`;
  return code;
};

export const generateDTSMap = (templates: ChildTemplates, path: string): string => {
  let line = 0;
  let indent = 0;
  const source = path.split("/").at(-1)!;
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
    moveNextLine(); // skip ">;"
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
    moveNextLine(); // move to ">;"
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
