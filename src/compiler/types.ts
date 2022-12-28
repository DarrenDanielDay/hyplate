/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { IAttribute, ITag } from "html5parser";
import type { Position } from "source-map";

export type TemplateFactory = "shadowed" | "replaced";

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
   * Whether to transpile style elements as external files.
   * @default true
   */
  externalStyles: boolean;
  /**
   * Whether to transform relative urls.
   * @default true
   */
  relativeURLs: boolean;
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

export interface EmitFile {
  path: string;
  content: string;
}

export interface OutputWithSourceMap {
  code: EmitFile;
  map?: EmitFile;
}
