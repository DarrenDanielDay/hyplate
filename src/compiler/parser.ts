/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { IAttribute, INode, ITag, parse as parseHTML, SyntaxKind } from "html5parser";
import { warn } from "../util.js";
import { createLocator } from "./locator.js";
import { HTMLTagTypeMapping, SVGTagTypeMapping } from "./mapping.js";
import { mergedOptions } from "./shared.js";
import type {
  ChildTemplates,
  ExtractedNode,
  ParsedNode,
  Template,
  TemplateOptions,
  ViewRefs,
  ViewSlots,
} from "./types.js";

export const defaultTemplateOptions = Object.freeze<TemplateOptions>({
  preserveAnchor: false,
  preserveComment: false,
  preserveEmptyTextNodes: false,
});

let templateOptions = defaultTemplateOptions;

const mergeOptions = mergedOptions(defaultTemplateOptions);

export const configureParser = (options: Partial<TemplateOptions>) => {
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
  const processOpeningTag: (node: ITag) => ParsedNode = preserveAnchor
    ? (node) => ({
        type: node.close ? "open" : "self",
        name: node.name,
        attributes: node.attributes,
      })
    : (node) => {
        const attributes: IAttribute[] = [];
        for (const attribute of node.attributes) {
          if (isAnchor(attribute)) {
            continue;
          }
          attributes.push(attribute);
        }
        return {
          type: node.close ? "open" : "self",
          name: node.name,
          attributes,
        };
      };
  const skipComment = !preserveComment;
  const children: ChildTemplates = {};
  const refs: ViewRefs = {};
  const slots: ViewSlots = {};
  const path: number[] = [];
  const indexes: number[] = [];
  const enterBody = () => {
    indexes.push(-1);
    path.push(-1);
  };
  const exitBody = () => {
    indexes.pop();
    path.pop();
  };
  let svgScopeCount = 0;
  const nextNode = () => {
    const i = indexes.length - 1;
    indexes[i]++;
  };
  const nextElement = () => {
    nextNode();
    const i = path.length - 1;
    path[i]++;
  };
  const nodes: ParsedNode[] = [];
  const styles: ExtractedNode[] = [];
  const templateAnchorAttr = findAnchor(templateNode);
  const anchor = templateAnchorAttr ? anchorAttrName(templateAnchorAttr, isGlobal) : "default";
  const walk = (node: INode) => {
    if (node.type === SyntaxKind.Text) {
      let { start, end } = node;
      let text: string;
      if (!preserveEmptyTextNodes) {
        for (; start < end && isBlankCharacter(currentSource[start]); start++);
        for (; start < end && isBlankCharacter(currentSource[end - 1]); end--);
        text = currentSource.slice(start, end);
      } else {
        text = node.value;
      }
      if (text || preserveEmptyTextNodes) {
        nodes.push({
          type: "text",
          content: text,
        });
        nextNode();
      }
      return;
    }
    if (isComment(node)) {
      if (skipComment) {
        return;
      }
      nodes.push({
        type: "text",
        content: currentSource.slice(node.start, node.end),
      });
      nextNode();
    }
    const isSvg = isSVG(node);
    if (isSvg) {
      svgScopeCount++;
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
    if (isStyle(node)) {
      // Style elements are extracted just for processing their contents,
      // and there must be a corresponding element in the template.
      // So the index cursor should be moved to next.
      styles.push({
        index: nodes.length,
        node,
      });
      return;
    }
    const { close, body } = node;
    const anchorRefAttr = findAnchor(node);
    if (anchorRefAttr) {
      const ref = anchorAttrName(anchorRefAttr);
      const tag = node.name;
      refs[ref] = {
        path: [...path],
        indexes: [...indexes],
        el: (svgScopeCount ? SVGTagTypeMapping[tag] : HTMLTagTypeMapping[tag]) ?? "Element",
        tag,
        position: currentLocator(anchorRefAttr.start),
      };
    }
    nodes.push(processOpeningTag(node));
    if (body) {
      enterBody();
      for (const child of body) {
        walk(child);
      }
      exitBody();
    }
    if (close) {
      nodes.push({
        type: "close",
        name: node.name,
      });
    }
    if (isSvg) {
      svgScopeCount--;
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
    nodes,
    styles,
  };
};

const isBlankCharacter = (char: string) => /\s/.test(char);
const isTemplate = (node: ITag) => node.name === "template";
const isStyle = (node: ITag) => node.name === "style";
const isSVG = (node: ITag) => node.name === "svg";
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
