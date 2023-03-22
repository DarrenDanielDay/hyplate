/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  type IAttribute,
  type INode,
  type ITag,
  parse as parseHTML,
  SyntaxKind,
  type IText,
  type IBaseNode,
  type IAttributeValue,
} from "html5parser";
import { Locator } from "./locator.js";
import { capitalize, mergedOptions } from "./shared.js";
import type { TemplateOptions } from "./types.js";
import {
  NodeType,
  type ElementChildNode,
  type PlainTextNode,
  type AttributeNode,
  EventMode,
  type SourceLocation,
  type AttributeValueNode,
  type EventBindingNode,
  type ParsedTemplateFile,
} from "./ast.js";
import { isValidIdentifier, parseVMPropsInText, leadingSpaceCount, trailingSpaceCount } from "./lexer.js";

export const defaultTemplateOptions = Object.freeze<TemplateOptions>({
  preserveComment: false,
  preserveEmptyTextNodes: false,
});

let templateOptions = defaultTemplateOptions;

const mergeOptions = mergedOptions(defaultTemplateOptions);

export const configureParser = (options: Partial<TemplateOptions>) => {
  templateOptions = mergeOptions(options);
};

export const parse = (text: string) => new Parser().parse(text);

export class Parser {
  public readonly options: TemplateOptions;
  #source = "";
  #locator = new Locator("");
  public constructor(options: TemplateOptions = templateOptions) {
    this.options = mergeOptions(options);
  }

  public async parse(source: string): Promise<ParsedTemplateFile> {
    this.#setSource(source);
    try {
      const rootNodes = await this.#parse();
      return {
        rootNodes,
        source,
      };
    } finally {
      this.#setSource("");
    }
  }

  #setSource(source: string) {
    this.#source = source;
    this.#locator = new Locator(source);
  }

  async #parse(): Promise<ElementChildNode[]> {
    const htmlNodes = parseHTML(this.#source);
    return this.#parseChildren(htmlNodes);
  }

  async #parseChildren(children: INode[]): Promise<ElementChildNode[]> {
    const resultNodes: ElementChildNode[] = [];
    Loop: for (let i = 0, l = children.length; i < l; i++) {
      const node = children[i];
      switch (node.type) {
        case SyntaxKind.Text: {
          resultNodes.push(...this.#parseText(node));
          break;
        }
        case SyntaxKind.Tag: {
          if (isComment(node)) {
            if (!this.options.preserveComment) {
              continue Loop;
            }
            resultNodes.push({
              type: NodeType.Comment,
              loc: this.#location(node),
              raw: this.#source.slice(node.start, node.end),
            });
            break;
          }
          resultNodes.push({
            type: NodeType.Element,
            attributes: this.#parseAttributes(node.attributes),
            children: node.body ? await this.#parseChildren(node.body) : void 0,
            tag: node.name,
            loc: this.#location(node),
          });
          break;
        }
      }
    }
    return resultNodes;
  }

  #parseText(text: IText): ElementChildNode[] {
    const parsed = parseVMPropsInText(text.value, this.#locator, text.start);
    if (!this.options.preserveEmptyTextNodes) {
      const first = parsed.at(0);
      const last = parsed.at(-1);
      if (first?.type === NodeType.PlainText) {
        const content = first.content;
        const leadingSpace = leadingSpaceCount(content);
        if (leadingSpace === content.length) {
          parsed.shift();
        } else {
          first.content = content.slice(leadingSpace);
          first.loc.begin = this.#locator.locate(this.#locator.index(first.loc.begin) - leadingSpace);
        }
      }
      if (last?.type === NodeType.PlainText) {
        const content = last.content;
        const trailingSpace = trailingSpaceCount(content);
        if (trailingSpace === content.length) {
          parsed.pop();
        } else {
          last.content = content.slice(0, content.length - trailingSpace);
          last.loc.begin = this.#locator.locate(this.#locator.index(last.loc.begin) - trailingSpace);
        }
      }
    }
    return parsed;
  }

  #location(node: IBaseNode): SourceLocation {
    return this.#locator.range(node.start, node.end);
  }

  #textNode(node: Omit<IText, "type">): PlainTextNode {
    return {
      type: NodeType.PlainText,
      content: node.value,
      loc: this.#locator.range(node.start, node.end),
    };
  }

  #parseAttributes(attributes: IAttribute[]): (AttributeNode | EventBindingNode)[] {
    const attributeNodes: (AttributeNode | EventBindingNode)[] = [];
    for (let i = 0, l = attributes.length; i < l; i++) {
      const attribute = attributes[i];
      const attrNameNode = attribute.name;
      const attrName = attrNameNode.value;
      const attrValue = attribute.value;
      const eventName = this.#getEventName(attrName);
      let specialized = false;
      if (attrValue) {
        if (eventName) {
          const handlerValue = attrValue.value;
          const colonIndex = handlerValue.indexOf(":");
          if (colonIndex !== -1) {
            const mode = this.#getEventMode(handlerValue.slice(0, colonIndex));
            if (mode) {
              const handlerStart = colonIndex + 1;
              const handler = handlerValue.slice(handlerStart);
              if (isValidIdentifier(handler)) {
                const space = leadingSpaceCount(handler);
                const identifier = handler.trim();
                const start = attrValue.start + handlerStart + space;
                const end = start + identifier.length;
                attributeNodes.push({
                  type: NodeType.EventBinding,
                  name: this.#textNode(attrNameNode),
                  loc: this.#location(attribute),
                  event: eventName,
                  identifier: this.#textNode({
                    value: identifier,
                    start: space,
                    end,
                  }),
                  mode,
                });
                specialized = true;
              }
            }
          }
        }
      }
      if (!specialized) {
        attributeNodes.push({
          type: NodeType.Attribute,
          name: this.#textNode(attrNameNode),
          loc: this.#location(attribute),
          quote: attrValue?.quote,
          value: attrValue && this.#parseAttributeValue(attrValue),
        });
      }
    }
    return attributeNodes;
  }

  #parseAttributeValue(value: IAttributeValue): AttributeValueNode {
    const vmProps = parseVMPropsInText(value.value, this.#locator, value.start);
    if (vmProps.length !== 1) {
      return this.#textNode(value);
    }
    return vmProps[0]!;
  }

  #getEventName(attrName: string): string | false {
    const pattern = /on([a-z0-9-_]+)/i;
    const match = pattern.exec(attrName);
    if (!match) {
      return false;
    }
    return match[1]!;
  }

  #getEventMode(id: string): EventMode | false {
    const match = (["raw", "delegate"] as const).find((mode) => mode.startsWith(id));
    if (!match) {
      return false;
    }
    return EventMode[capitalize(match)];
  }
}

const isComment = (node: ITag) => node.name === "!--";
