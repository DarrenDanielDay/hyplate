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
