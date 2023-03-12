/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IAttribute, ITag } from "html5parser";
import type { Position } from "source-map";

export type TemplateFactory = "shadowed" | "replaced" | "pure";

export interface TemplateOptions {
  /**
   * Whether to preserve anchor attributes.
   * @default false
   */
  preserveAnchor: boolean;
  /**
   * Whether to preserve comment node.
   * @default false
   */
  preserveComment: boolean;
  /**
   * Whether to preserve empty text nodes which contains only spaces and new lines.
   * @default false
   */
  preserveEmptyTextNodes: boolean;
}

export interface TranspileOptions {
  /**
   * The way to access element.
   * When configured to `node`, the element refs will be get by `firstChild` and `nextSibling`.
   * When configured to `element`, the element refs will be get by `firstElementChild` and `nextElementSibling`.
   * @default "node"
   */
  accessBy: "node" | "element";
  /**
   * Define how to transpile inline style elements as external files.
   *
   * When configured to `false`, the style element will be kept inline.
   *
   * When configured to `"link"`, the style element will be replaced as an external `<link />` element.
   * (recommended for `shadowed` factory)
   *
   * When configured to `"import"`, the style element will be replaced with an empty `<style>` element,
   * and a CSS file import statement will be added to the JavaScript code.
   * (recommended for `replaced` factory and bundlers)
   *
   * Note that the generated external CSS files will always be relative to the template in the same directory.
   * @default "link"
   */
  externalStyles: false | "link" | "import";
  /**
   * The template factory function name, whether `shadowed` or `replaced`.
   * @default "shadowed"
   */
  factory: TemplateFactory;
  /**
   * Define how to process CSS code in templates. By default the transpiler leaves the content as what it is,
   * even the blanks and tabs in template HTML.
   * @param style the style tag (AST object) with element attributes info
   * @param template the template info
   * @returns the precessed CSS code
   */
  processInlineCSS: (style: ITag, template: TemplateInfo) => string;
  /**
   * Define how to transform relative urls.
   *
   * When configured to `false`, the relative URLs will be kept as what it is.
   *
   * When configured to `"resolve"`, the relative URL will be dynamically converted like the following dynamically:
   *
   * ```js
   * const _converted = new URL("<relative>", import.meta.url).toString();
   * // The `_converted` will be inserted into the template.
   * ```
   *
   * When configured to `"import"`, the relative URL will be treated as assets URLs and a import statement will be added.
   *
   * ```js
   * import _ref from "<relative>";
   * // The default export `_ref` should be a converted URL string, and it will be inserted into the template.
   * ```
   *
   * @default "resolve"
   */
  relativeURLs: false | "resolve" | "import";
}

export interface EmitOptions {
  /**
   * Defines how to read a file.
   */
  readFile: (file: string) => Promise<string>;
  /**
   * Defines how to write a file.
   */
  writeFile: (file: string, content: string) => Promise<void>;
  /**
   * Defines the path resolve system.
   */
  path: typeof import("path");
}

export interface ViewRef {
  /**
   * The HTML tag of the referencing element.
   */
  tag: string;
  /**
   * The inferred element name by tag and context.
   * SVG elements are also considered, but only tags under `<svg>`.
   */
  el: string;
  /**
   * Index of `children`. Must be index of an element array.
   */
  path: number[];
  /**
   * Indexes of `childNodes`. Must be index of a node array.
   */
  indexes: number[];
  /**
   * Position of the anchor attribute.
   */
  position: Position;
}

export interface ViewSlot {
  /**
   * The slot name attribute value.
   */
  name: string;
  /**
   * Position of the name attribute.
   */
  position: Position;
}

export type ViewRefs = Record<string, ViewRef>;

export type ViewSlots = Record<string, ViewSlot>;

export interface OpenTag {
  type: "open";
  name: string;
  attributes: IAttribute[];
}

export interface CloseTag {
  type: "close";
  name: string;
}

export interface SelfClosingTag {
  type: "self";
  name: string;
  attributes: IAttribute[];
}

export interface Texts {
  type: "text";
  content: string;
}

export interface ExtractedNode {
  /**
   * The index of `nodes` to insert after.
   */
  index: number;
  node: ITag;
}

export type ParsedNode = OpenTag | CloseTag | SelfClosingTag | Texts;

export interface Template {
  /**
   * Defined in HTML template files like the following:
   * ```html
   * <template #foo>
   *  <!--     ^^^^ -->
   * </template>
   * ```
   * The `anchor` for the above template is `foo`.
   * If no attributes starting with `#` specified in `<template>` element,
   * the anchor will be treated as `default`.
   */
  anchor: string;
  /**
   * The anchor reference map.
   */
  refs: ViewRefs;
  /**
   * The named slots map.
   */
  slots: ViewSlots;
  /**
   * Position of the anchor attribute if present.
   * Otherwise it will be the position of opening tag `<template>`.
   */
  position: Position;
  /**
   * The preprocessed content nodes.
   */
  nodes: ParsedNode[];
  /**
   * The extracted style nodes.
   */
  styles: ExtractedNode[];
  /**
   * The child templates.
   */
  children: ChildTemplates;
}

export type ChildTemplates = Record<string, Template>;

export interface TemplateInfo {
  /**
   * The indexed id like `_0_1_3`.
   */
  id: string;
  /**
   * The `file` parameter of `transpile`.
   */
  file: string;
  /**
   * The template name path.
   */
  path: string[];
  /**
   * The hyplate template object.
   */
  template: Template;
}

export interface EmitFile {
  path: string;
  content: string;
}

export interface OutputWithSourceMap {
  code: EmitFile;
  map?: EmitFile;
}
