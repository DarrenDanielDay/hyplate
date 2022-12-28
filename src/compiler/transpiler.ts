/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IAttribute, ITag, IText } from "html5parser";
import { SourceMapGenerator } from "source-map";
import { objectEntriesMap } from "../util.js";
import { createObjLikeExp, mergedOptions, replaceExt, sourceName, str } from "./shared.js";
import type {
  ChildTemplates,
  ExtractedNode,
  OutputWithSourceMap,
  Template,
  TemplateFactory,
  TranspileOptions,
} from "./types.js";

const defaultTranspileOptions: TranspileOptions = {
  externalStyles: true,
  relativeURLs: true,
};

let transpilerOptions = defaultTranspileOptions;

const mergeOptions = mergedOptions(defaultTranspileOptions);

export const configureTranspiler = (options: Partial<TranspileOptions>) => {
  transpilerOptions = mergeOptions(options);
};

const FACTORY = "f";
const CONTEXT_FACTORY = "c";
const REPLACED = "r";
const BASE_URL = "b";
const TO_URL = "u";
/**
 * @internal
 */
interface TemplateInfo {
  /**
   * The indexed id like `_0_1_3`.
   */
  id: string;
  /**
   * The template name path.
   */
  path: string[];
  template: Template;
}
export const transpile = (
  templates: ChildTemplates,
  path: string,
  factory: TemplateFactory = "shadowed"
): OutputWithSourceMap[] => {
  const { externalStyles, relativeURLs } = transpilerOptions;
  const source = sourceName(path);
  // Currently generated JavaScript file have no symbol mapping.
  const sourcemap = new SourceMapGenerator({
    file: `${replaceExt(source, ".js")}`,
    sourceRoot: "",
  });
  const templateMap: Record<string, TemplateInfo> = {};
  const mapTemplateToId = new Map<Template, string>();
  const anchorPath: string[] = [];
  const indexPath: number[] = [];
  const emitIdSequence: string[] = [];
  const walk = (template: Template, i: number) => {
    anchorPath.push(template.anchor);
    indexPath.push(i);
    const templateIndexId = `_${indexPath.join("_")}`;
    templateMap[templateIndexId] = {
      id: templateIndexId,
      path: [...anchorPath],
      template,
    };
    mapTemplateToId.set(template, templateIndexId);
    traverseChildren(template.children);
    emitIdSequence.push(templateIndexId);
    indexPath.pop();
    anchorPath.pop();
  };
  const traverseChildren = (children: ChildTemplates) => {
    const keys = Object.keys(children);
    const childCount = keys.length;
    for (let i = 0; i < childCount; i++) {
      walk(children[keys[i]]!, i);
    }
  };
  traverseChildren(templates);
  const externals: Record<string, OutputWithSourceMap[]> = {};
  const transpileTemplate = (id: string): string => {
    const templateInfo = templateMap[id]!;
    const addStyle: (node: ITag) => void = externalStyles
      ? (style) => {
          const links = (externals[id] ??= []);
          const templateId = templateInfo.path.join(".");
          const generatedURL = `./${replaceExt(source, "")}.${templateId}-${links.length}.css`;
          const styleURL = asRelative(generatedURL);
          buf.push(`<link rel="stylesheet" href="${styleURL}"/>`);
          links.push({
            code: {
              content: style.body?.map((n) => (n as IText).value).join("") ?? "",
              path: generatedURL,
            },
          });
        }
      : (style) => {
          addToTemplate(
            `<${style.name}${style.attributes.map(normalAttribute)}>${
              style.body?.map((n) => (n as IText).value) ?? ""
            }</${style.name}>`
          );
        };
    const transpileAttribute: (attribute: IAttribute) => string = relativeURLs
      ? (attribute) => {
          if (attribute.value && urlLikeAttributes.has(attribute.name.value) && isRelative(attribute.value.value)) {
            return ` ${attribute.name}=${asRelative(attribute.value.value)}`;
          }
          return normalAttribute(attribute);
        }
      : normalAttribute;
    const buf: string[] = [];
    const addToTemplate = (text: string) => {
      buf.push(text.replaceAll("`", "\\`"));
    };
    const { nodes, styles } = templateInfo.template;
    const nextExternal = (elements: ExtractedNode[]) => {
      let i = 0;
      return (): ExtractedNode | undefined => {
        const result = elements[i];
        i++;
        return result;
      };
    };
    const nextStyle = nextExternal(styles);
    let currentStyle = nextStyle();
    for (let i = 0; i <= nodes.length; i++) {
      if (currentStyle?.index === i) {
        addStyle(currentStyle.node);
        currentStyle = nextStyle();
      }
      const node = nodes[i];
      if (!node) {
        break;
      }
      if (node.type === "open") {
        addToTemplate(`<${node.name}${node.attributes.map(transpileAttribute).join("")}>`);
        continue;
      }
      if (node.type === "close") {
        addToTemplate(`</${node.name}>`);
        continue;
      }
      if (node.type === "self") {
        addToTemplate(`<${node.name}${node.attributes.map(transpileAttribute).join("")} />`);
        continue;
      }
      addToTemplate(node.content);
    }
    return buf.join("");
  };
  const jsCodeTemplate = (id: string) => {
    const templateInfo = templateMap[id]!;
    const { template } = templateInfo;
    const isGlobal = templateInfo.path.length === 1;
    return `\
// ${templateInfo.path.map((anchor) => `[#${anchor}]`).join(" ")}
const ${id} = ${isGlobal ? FACTORY : "r"}(
  \`${transpileTemplate(id)}\`,
  ${CONTEXT_FACTORY}(${createObjLikeExp(
      objectEntriesMap(template.refs, ([, value]) => str(value.path)),
      1,
      ","
    )}),
);
${Object.entries(template.children)
  .map(
    ([ref, child]) => `${id}[${str(ref)}]=${mapTemplateToId.get(child)!};
`
  )
  .join("")}`;
  };
  const importCode = `import {${factory} as ${FACTORY},replaced as ${REPLACED},contextFactory as ${CONTEXT_FACTORY},basedOnURL as ${BASE_URL}}from"hyplate/template";`;
  let usedToURL = false;
  const asRelative = (relativeUrl: string) => {
    usedToURL = true;
    return `\${${TO_URL}(${str(relativeUrl)})}`;
  };
  // Using library function code rather than `import.meta.resolve` for bundlers to inline `import.meta.url`.
  const toURLCode = `const ${TO_URL}=${BASE_URL}(import.meta.url);
`;
  const createSetupCode = emitIdSequence.map((id) => jsCodeTemplate(id)).join("");
  const exportCode = `export {${Object.keys(templates)
    .map((key, i) => `_${i} as ${key}`)
    .join(",")}};`;
  const code = `\
${importCode}
${usedToURL ? toURLCode : ""}${createSetupCode}${exportCode}
//# sourceMappingURL=${replaceExt(path.split("/").at(-1)!, ".js.map")}`;
  return [
    {
      code: {
        content: code,
        path: `./${replaceExt(source, ".js")}`,
      },
      map: {
        content: sourcemap.toString(),
        path: `./${replaceExt(source, ".js.map")}`,
      },
    },
    ...Object.values(externals).flat(1),
  ];
};

const urlLikeAttributes = new Set(["href", "src"]);
const isRelative = (url: string) => !url.startsWith("/") && !/(\w+):\/\//.test(url);

const normalAttribute = (attribute: IAttribute): string => {
  return ` ${attribute.name.value}${
    attribute.value ? `=${attribute.value.quote}${attribute.value.value}${attribute.value.quote}` : ``
  }`;
};
