/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IAttribute, ITag, IText } from "html5parser";
import { SourceMapGenerator } from "source-map";
import { objectEntriesMap } from "../util.js";
import { createObjLikeExp, mergedOptions, replaceExt, sourceName, str, tabs } from "./shared.js";
import type {
  ChildTemplates,
  ExtractedNode,
  OutputWithSourceMap,
  Template,
  TemplateInfo,
  TranspileOptions,
  ViewRef,
} from "./types.js";

export const defaultTranspileOptions = Object.freeze<TranspileOptions>({
  accessBy: "node",
  externalStyles: "link",
  factory: "shadowed",
  processInlineCSS: (style, _template) => style.body?.map((n) => (n as IText).value).join("") ?? "",
  relativeURLs: "resolve",
});

let transpilerOptions = defaultTranspileOptions;

const mergeOptions = mergedOptions(defaultTranspileOptions);

export const configureTranspiler = (options: Partial<TranspileOptions>) => {
  transpilerOptions = mergeOptions(options);
};

const FACTORY = "f";
const FRAGMENT = "d";
const FIRST_CHILD = "c";
const NEXT_SIBLIING = "n";
const PURE = "p";
const BASE_URL = "b";
const TO_URL = "u";

export const transpile = (templates: ChildTemplates, file: string): OutputWithSourceMap[] => {
  const { accessBy, externalStyles, factory, processInlineCSS, relativeURLs } = transpilerOptions;
  const source = sourceName(file);
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
      file,
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
      ? (() => {
          const addStyleLink = (url: string) => {
            const styleURL = asRelative(url);
            buf.push(`<link rel="stylesheet" href="${styleURL}"/>`);
          };
          const addStyleImport = (url: string) => {
            addSideEffectImport(url);
            buf.push(`<style></style>`);
          };
          const handlers: Record<typeof externalStyles, (generatedURL: string) => void> = {
            import: addStyleImport,
            link: addStyleLink,
          };
          const handle = handlers[externalStyles];
          return (style) => {
            const links = (externals[id] ??= []);
            const templateId = templateInfo.path.join(".");
            const generatedURL = `./${replaceExt(source, "")}.${templateId}-${links.length}.css`;
            handle(generatedURL);
            links.push({
              code: {
                content: processInlineCSS(style, templateInfo),
                path: generatedURL,
              },
            });
          };
        })()
      : (style) => {
          addToTemplate(
            `<${style.name}${style.attributes.map(normalAttribute)}>${processInlineCSS(style, templateInfo)}</${
              style.name
            }>`
          );
        };
    const transpileAttribute: (attribute: IAttribute) => string = relativeURLs
      ? (() => {
          const trasformRelativeURL = relativeURLs === "resolve" ? asRelative : asImportURL;
          return (attribute) => {
            if (attribute.value && urlLikeAttributes.has(attribute.name.value) && isRelative(attribute.value.value)) {
              return ` ${attribute.name.value}=${trasformRelativeURL(attribute.value.value)}`;
            }
            return normalAttribute(attribute);
          };
        })()
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
    const [getRefsCode, refsExpr] = transpileReference(template, 2);
    return `\
// ${templateInfo.path.map((anchor) => `[#${anchor}]`).join(" ")}
const ${id} = ${isGlobal ? FACTORY : PURE}(
  \`${transpileTemplate(id)}\`,
  (${FRAGMENT}) => {
    ${getRefsCode}
    return {
      refs: ${refsExpr},
    }
  },
);
${Object.entries(template.children)
  .map(
    ([ref, child]) => `${id}[${str(ref)}]=${mapTemplateToId.get(child)!};
`
  )
  .join("")}`;
  };
  const transpileReference = (template: Template, indent: number): [declarations: string, expr: string] => {
    const indexer: Record<
      TranspileOptions["accessBy"],
      {
        [K in keyof ViewRef]: ViewRef[K] extends number[] ? K : never;
      }[keyof ViewRef]
    > = {
      element: "path",
      node: "indexes",
    };
    const indexBy = indexer[accessBy];
    const variables: {
      /**
       * The variable id.
       */
      id: number;
      /**
       * The previous referenced variable id. 0 for the fragment.
       */
      previous: number;
      /**
       * Whether the prevous node is the parent node.
       */
      fromParent: boolean;
      /**
       * The count of `nextSibling`.
       */
      count: number;
    }[] = [];
    const refs: Record<string, number> = {};
    let currentId = 0;
    const refEntries = Object.entries(template.refs).sort(([, { [indexBy]: a }], [, { [indexBy]: b }]) => {
      let i = 0,
        la = a.length,
        lb = b.length;
      let result = 0;
      for (; i < la && i < lb; i++) {
        const ea = a[i],
          eb = b[i];
        if (ea !== eb) {
          // Actually it's always negative, and the `sort` is unnecessary,
          // because `Object.entries` ensures the keys are return in the inserting order.
          result = ea - eb;
          break;
        }
      }
      return result;
    });
    const indexMatrix = refEntries.map(([, value]) => value[indexBy]);
    const resolveNode = (
      row: number,
      column: number,
      previousId: number,
      parentMaxColumn: number,
      fromParent: boolean,
      parentIndex: number
    ): [resolvedId: number, columnBound: number, startingIndex: number] => {
      currentId++;
      const id = currentId;
      const indexes = indexMatrix[column]!;
      const fragmentIndex = indexes[row]!;
      // Get the same parents prefixes.
      let maxColumn = column;
      while (maxColumn < parentMaxColumn && indexMatrix[maxColumn]![row] === fragmentIndex) {
        maxColumn++;
      }
      variables.push({
        id,
        previous: previousId,
        fromParent,
        count: fromParent ? fragmentIndex : fragmentIndex - parentIndex,
      });
      const nextRow = row + 1;
      if (nextRow === indexes.length) {
        // The last index represents the reference node.
        refs[refEntries[column]![0]] = currentId;
      }
      // Resolve its children.
      previousId = id;
      let startingIndex = fragmentIndex;
      for (let nextChildColumn = column; nextChildColumn < maxColumn; ) {
        const indexes = indexMatrix[nextChildColumn]!;
        if (nextRow >= indexes.length) {
          nextChildColumn++;
        } else {
          [previousId, nextChildColumn, startingIndex] = resolveNode(
            nextRow,
            nextChildColumn,
            previousId,
            maxColumn,
            previousId === id,
            startingIndex
          );
        }
      }
      return [id, maxColumn, fragmentIndex];
    };
    if (indexMatrix.length) {
      resolveNode(0, 0, currentId, indexMatrix.length, true, 0);
    }
    const nodeVar = (n: number) => `_$node${n}`;
    const declarations = `const ${nodeVar(0)} = ${FRAGMENT}${variables.length ? "," : ""}
    ${variables.map(
      ({ id, previous, count, fromParent }) =>
        `${nodeVar(id)} = ${nodeVar(previous)}${fromParent ? `[${FIRST_CHILD}]` : ""}${`[${NEXT_SIBLIING}]`.repeat(
          count
        )}`
    ).join(`,
${tabs(indent)}`)};`;
    return [
      declarations,
      `${createObjLikeExp(
        objectEntriesMap(refs, ([, value]) => {
          return nodeVar(value);
        }),
        indent + 1,
        ","
      )}`,
    ];
  };
  const addtionalImportStatements: string[] = [];
  const addSideEffectImport = (url: string) => {
    addtionalImportStatements.push(`import ${str(url)};`);
  };
  const addDefaultImport = (() => {
    let count = 0;
    return (url: string) => {
      const defaultName = `_default_${count++}`;
      addtionalImportStatements.push(`import ${defaultName} from ${str(url)};`);
      return defaultName;
    };
  })();

  let usedToURL = false;
  const asRelative = (relativeURL: string) => {
    usedToURL = true;
    return inserted(`${TO_URL}(${str(relativeURL)})`);
  };
  const asImportURL = (relativeURL: string) => {
    return inserted(addDefaultImport(relativeURL));
  };
  // Using library function code rather than `import.meta.resolve` for bundlers to inline `import.meta.url`.
  const toURLCode = `const ${TO_URL}=${BASE_URL}(import.meta.url);
`;
  const createSetupCode = emitIdSequence.map((id) => jsCodeTemplate(id)).join("");
  //#region imports
  const templateImport = `import{${factory} as ${FACTORY},pure as ${PURE}${
    usedToURL ? `,basedOnURL as ${BASE_URL}` : ""
  }}from"hyplate/template";`;
  type Identifiers = keyof typeof import("../identifiers.js");
  const accessorNames: Record<TranspileOptions["accessBy"], [firstChild: Identifiers, nextSibling: Identifiers]> = {
    node: ["firstChild", "nextSibling"],
    element: ["firstElementChild", "nextElementSibling"],
  };
  const [firstChild, nextSibling] = accessorNames[accessBy];
  const identifierImport = `import{${firstChild} as ${FIRST_CHILD},${nextSibling} as ${NEXT_SIBLIING}}from"hyplate/identifiers"`;
  const importCode = `${templateImport}${identifierImport}${addtionalImportStatements.map((s) => "\n" + s).join("")}`;
  //#endregion
  const exportCode = `export {${Object.keys(templates)
    .map((key, i) => `_${i} as ${key}`)
    .join(",")}};`;
  const code = `\
${importCode}
${usedToURL ? toURLCode : ""}${createSetupCode}${exportCode}
//# sourceMappingURL=${replaceExt(source, ".js.map")}`;
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
const inserted = (expr: string) => `\${${expr}}`;
const normalAttribute = (attribute: IAttribute): string => {
  return ` ${attribute.name.value}${
    attribute.value ? `=${attribute.value.quote}${attribute.value.value}${attribute.value.quote}` : ``
  }`;
};
