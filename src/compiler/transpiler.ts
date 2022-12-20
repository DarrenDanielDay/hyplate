import { SourceMapGenerator } from "source-map";
import { objectEntriesMap } from "../util.js";
import { createObjLikeExp, replaceExt, str } from "./shared.js";
import type { ChildTemplates, OutputWithSourceMap, Template, TemplateFactory } from "./types.js";

export const transpile = (
  templates: ChildTemplates,
  path: string,
  factory: TemplateFactory = "replaced"
): OutputWithSourceMap => {
  const source = path.split("/").at(-1)!;
  // Currently generated JavaScript file have no symbol mapping.
  const sourcemap = new SourceMapGenerator({
    file: `${replaceExt(source, ".js")}`,
    sourceRoot: "",
  });
  const templateMap: Record<string, Template> = {};
  const idToDisplay: Record<string, string> = {};
  const mapTemplateToId = new Map<Template, string>();
  const anchorPath: string[] = [];
  const indexPath: number[] = [];
  const emitIdSequence: string[] = [];
  const walk = (template: Template, i: number) => {
    anchorPath.push(`[#${template.anchor}]`);
    indexPath.push(i);
    const anchorPathDisplay = anchorPath.join(" ");
    const templateIndexId = `_${indexPath.join("_")}`;
    idToDisplay[templateIndexId] = anchorPathDisplay;
    templateMap[templateIndexId] = template;
    mapTemplateToId.set(template, templateIndexId);
    walkChildren(template.children);
    emitIdSequence.push(templateIndexId);
    indexPath.pop();
    anchorPath.pop();
  };
  const walkChildren = (children: ChildTemplates) => {
    const keys = Object.keys(children);
    const childCount = keys.length;
    for (let i = 0; i < childCount; i++) {
      walk(children[keys[i]]!, i);
    }
  };
  walkChildren(templates);
  const jsCodeTemplate = (id: string, template: Template) => `\
// ${idToDisplay[id]}
const ${id} = f(
  ${str(template.content)},
  c(${createObjLikeExp(
    objectEntriesMap(template.children, ([, value]) => mapTemplateToId.get(value)!),
    1,
    ","
  )}, ${createObjLikeExp(
    objectEntriesMap(template.refs, ([, value]) => str(value.path)),
    1,
    ","
  )}),
);
`;
  const importCode = `import {${factory} as f}from"hyplate/template";import {contextFactory as c}from"hyplate/template";`;
  const createSetupCode = emitIdSequence.map((id) => jsCodeTemplate(id, templateMap[id]!)).join("");
  const exportCode = `export {${Object.keys(templates)
    .map((key, i) => `_${i} as ${key}`)
    .join(",")}};`;
  const code = `\
${importCode}
${createSetupCode}${exportCode}
//# sourceMappingURL=${replaceExt(path.split("/").at(-1)!, ".js.map")}`;
  return {
    code: {
      content: code,
      path: replaceExt(path, ".js"),
    },
    map: {
      content: sourcemap.toString(),
      path: replaceExt(path, ".js.map"),
    },
  };
};
