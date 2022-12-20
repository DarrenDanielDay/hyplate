import { IAttribute, INode, ITag, parse as parseHTML, SyntaxKind } from "html5parser";
import { warn } from "../util.js";
import { createLocator } from "./locator.js";
import type { ChildTemplates, Template, TemplateOptions, ViewRefs, ViewSlots } from "./types.js";

const defaultTemplateOptions: TemplateOptions = {
  preserveAnchor: false,
  preserveComment: false,
  preserveEmptyTextNodes: false,
};

let templateOptions: TemplateOptions = defaultTemplateOptions;

const mergeOptions = (options: Partial<TemplateOptions>): TemplateOptions => {
  const merged = Object.fromEntries(
    Object.entries(defaultTemplateOptions).map(([key, defaultValue]) => [
      key,
      Reflect.get(options, key) ?? defaultValue,
    ])
  );
  // @ts-expect-error Dynamic Implementation
  return merged;
};

export const configure = (options: Partial<TemplateOptions>) => {
  templateOptions = mergeOptions(options);
};

let currentSource = "";
let currentLocator = createLocator(currentSource);

export const parse = (source: string): ChildTemplates => {
  currentSource = source;
  currentLocator = createLocator(source);
  const templates: ChildTemplates = {};
  const nodes = parseHTML(source);
  for (const node of nodes) {
    if (node.type === SyntaxKind.Text) {
      const trimmed = node.value.trim();
      if (trimmed) {
        warn(`Text in global scope is ignored. Ignored:
${node.value}`);
      }
      continue;
    }
    if (isComment(node)) {
      // Comments in global scope are always ignored.
      continue;
    }
    if (!isTemplate(node)) {
      warn(`Tags in global scope except "template" is ignored. Ignored:
${source.slice(node.start, node.end)}`);
      continue;
    }
    const templateNode = createTemplate(node, true);
    if (templates[templateNode.anchor]) {
      throw new Error(`Duplicated template anchor: ${templateNode.anchor}`);
    }
    templates[templateNode.anchor] = templateNode;
  }
  return templates;
};

const isValidIdentifier = (name: string) => {
  try {
    eval(`\
(function (){
  "use strict";
  var ${name}
})()`);
    return true;
  } catch (error) {
    return false;
  }
};

const createTemplate = (templateNode: ITag, isGlobal?: boolean): Template => {
  const { preserveAnchor, preserveComment, preserveEmptyTextNodes } = templateOptions;
  const openTagHTML: (node: ITag) => string = preserveAnchor
    ? (node) => node.open.value
    : (node) => {
        if (isComment(node)) {
          return `<!--`;
        }
        const attributes: string[] = [];
        for (const attribute of node.attributes) {
          if (isAnchor(attribute)) {
            continue;
          }
          attributes.push(` ${currentSource.slice(attribute.start, attribute.end)}`);
        }
        const isSelfClosingTag = node.open.value.at(-2) === "/";
        return `<${node.name}${attributes.join("")}${isSelfClosingTag ? "/" : ""}>`;
      };
  const skipComment = !preserveComment;
  const children: ChildTemplates = {};
  const refs: ViewRefs = {};
  const slots: ViewSlots = {};
  const path: number[] = [];
  const enterBody = () => {
    path.push(-1);
  };
  const exitBody = () => {
    path.pop();
  };
  const nextElement = () => {
    const i = path.length - 1;
    path[i]++;
  };
  const buf: string[] = [];
  const templateAnchorAttr = findAnchor(templateNode);
  const anchor = templateAnchorAttr ? anchorAttrName(templateAnchorAttr, isGlobal) : "default";
  const walk = (node: INode) => {
    if (node.type === SyntaxKind.Text) {
      const text = preserveEmptyTextNodes ? node.value : node.value.trim();
      if (text || preserveEmptyTextNodes) {
        buf.push(text);
      }
      return;
    }
    if (skipComment && isComment(node)) {
      return;
    }
    if (isSlot(node)) {
      let nameAttribute: IAttribute | undefined;
      for (const attribute of node.attributes) {
        if (attribute.name.value === "name") {
          if (nameAttribute) {
            throw new Error(`Multiple name attribute for slot found: 
${node.open.value}`);
          }
          nameAttribute = attribute;
        }
      }
      if (!nameAttribute) {
        throw new Error(`Slot must have slot name attribute:
${node.open.value}`);
      }
      const nameValue = nameAttribute.value;
      if (!nameValue) {
        throw new Error(`Value of name attribute must be specified:
${node.open.value}`);
      }
      if (slots[nameValue.value]) {
        throw new Error(`Duplicated slot name: ${nameValue.value}`);
      }
      slots[nameValue.value] = {
        name: nameValue.value,
        position: currentLocator(nameValue.start),
      };
    }
    if (isTemplate(node)) {
      const childTemplate = createTemplate(node);
      children[childTemplate.anchor] = childTemplate;
      return;
    }
    nextElement();
    const { close, body } = node;
    const anchorRefAttr = findAnchor(node);
    if (anchorRefAttr) {
      const ref = anchorAttrName(anchorRefAttr);
      refs[ref] = {
        path: [...path],
        tag: node.name,
        position: currentLocator(anchorRefAttr.start),
      };
    }
    buf.push(openTagHTML(node));
    if (body) {
      enterBody();
      for (const child of body) {
        walk(child);
      }
      exitBody();
    }
    if (close) {
      buf.push(close.value);
    }
  };
  const body = templateNode.body;
  if (body) {
    enterBody();
    for (const child of body) {
      walk(child);
    }
    exitBody();
  }
  const position = currentLocator(templateAnchorAttr ? templateAnchorAttr.start : templateNode.start);
  return {
    anchor,
    refs,
    slots,
    position,
    children,
    content: buf.join(""),
  };
};

const isTemplate = (node: ITag) => node.name === "template";
const isSlot = (node: ITag) => node.name === "slot";
const isComment = (node: ITag) => node.name === "!--";
const isAnchor = (attribute: IAttribute) => attribute.name.value.startsWith("#");
const findAnchor = (node: ITag) => {
  let anchorAttribute: undefined | IAttribute = undefined;
  for (const attribute of node.attributes) {
    if (isAnchor(attribute)) {
      if (anchorAttribute) {
        throw new Error(`Multiple anchor attribute found in opening tag: ${node.open.value}
"${attribute.name.value}" and "${anchorAttribute.name.value}"`);
      }
      if (attribute.value) {
        warn(
          `Hyplate will never use the anchor attribute value.
Consider omit the value "${attribute.value.value}" of anchor "${attribute.name.value}":
${node.open.value}
${" ".repeat(attribute.value.start - node.start)}${"^".repeat(attribute.value.end - attribute.value.start)}
`
        );
      }
      anchorAttribute = attribute;
    }
  }
  return anchorAttribute;
};
const anchorAttrName = (templateAnchorAttr: IAttribute, isGlobal?: boolean) => {
  const rawName = templateAnchorAttr.name.value.slice(1);
  if (isGlobal && !isValidIdentifier(rawName)) {
    throw new Error(`Invalid identifier "${rawName}".`);
  }
  return rawName;
};