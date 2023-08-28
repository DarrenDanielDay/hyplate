import type { Position } from "source-map";

export interface SourceLocation {
  begin: Position;
  end: Position;
}

interface BaseNode<T extends NodeType> {
  type: T;
  loc: SourceLocation;
}

export enum NodeType {
  PlainText,
  Element,
  Comment,
  Attribute,
  Interpolation,
  Binding,
  EventBinding,
}

/**
 * Content that is treated as plain text. Plain text nodes may also occur in attributes.
 * ```html
 * <h1 lang="en">Hello, {{identifier}}! </h1>
 * <!--^^^^  ^^  ^^^^^^^              ^^ -->
 * ```
 */
export interface PlainTextNode extends BaseNode<NodeType.PlainText> {
  /**
   * Raw text content, not escaped.
   */
  content: string;
}

/**
 * ```html
 * <p>Hello, { typedef:identifier } </p>
 * <!--      ^^^^^^^^^^^^^^^^^^^^^^ -->
 * ```
 */
export interface BindingNode extends BaseNode<NodeType.Binding> {
  typedef: void | PlainTextNode;
  identifier: PlainTextNode;
}

/**
 * ```html
 * <p>Hello, {{ typedef:identifier }} </p>
 * <!--      ^^^^^^^^^^^^^^^^^^^^^^^^ -->
 * ```
 */
export interface InterpolationNode extends BaseNode<NodeType.Interpolation> {
  typedef: void | PlainTextNode;
  identifier: PlainTextNode;
}

export type AttributeValueNode = PlainTextNode | ViewModelPropertyNode;

export type ViewModelPropertyNode = BindingNode | InterpolationNode;

/**
 * Attribute node. `value` is not required.
 * ```html
 * <input placeholder="input here" >
 * <!--   ^^^^^^^^^^^^^^^^^^^^^^^ -->
 * ```
 */
export interface AttributeNode extends BaseNode<NodeType.Attribute> {
  /**
   * Attribute name node.
   */
  name: PlainTextNode;
  /**
   * Attribute value node.
   */
  value: void | AttributeValueNode;
  /**
   * Quote type if attribute value is present.
   */
  quote: void | '"' | "'";
}

export type ElementChildNode = ElementNode | PlainTextNode | ViewModelPropertyNode | CommentNode;

/**
 * The whole element node, with tag info. Void elements have no children.
 */
export interface ElementNode extends BaseNode<NodeType.Element> {
  tag: string;
  attributes: (AttributeNode | EventBindingNode)[];
  children: void | ElementChildNode[];
}

/**
 * Comment in template. Text binding pattern inside comment are ignored.
 */
export interface CommentNode extends BaseNode<NodeType.Comment> {
  /**
   * Raw comment text with `<!--` and `-->` included.
   */
  raw: string;
}

export enum EventMode {
  Raw,
  Delegate,
}

/**
 * Event attribute node with special binding syntax.
 * ```html
 * <input onchange="deletate:identifier" >
 * <!--   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ -->
 * ```
 */
export interface EventBindingNode extends BaseNode<NodeType.EventBinding> {
  /**
   * Attribute name node.
   */
  name: PlainTextNode;
  /**
   * Parsed event name.
   */
  event: string;
  /**
   * Event binding mode, can be declared in label. Default to {@link EventMode.Raw}.
   */
  mode: EventMode;
  /**
   * Event handler name.
   */
  identifier: PlainTextNode;
}

export interface ParsedTemplateFile {
  source: string;
  rootNodes: ElementChildNode[];
}
