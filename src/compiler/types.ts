/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
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
   * The content HTML text between `template` tags.
   * `<template>` tags inside the template body is treated as child templates and will not be included.
   */
  content: string;
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
  map: EmitFile;
}