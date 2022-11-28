/**
 * @license MIT
 * MIT License
 *
 * Copyright (c) 2022 DarrenDanielDay
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

type Optional<T> = T | undefined | null;
export type CleanUpFunc = () => void;

export interface Query<T extends unknown> {
  readonly val: T;
}

export interface Source<T extends unknown> extends Query<T> {
  set(newVal: T): void;
}

export type Subscriber<T extends unknown> = (latest: T) => void;

/**
 * Should return true if the two value is treated as same.
 */
export type Differ = <T>(a: T, b: T) => boolean;

export type TextInterpolation = string | number | bigint | boolean;

export type AttributeInterpolation = string | number | boolean;

export type EventMap<T extends EventTarget> = T extends HTMLElement
  ? HTMLElementEventMap
  : T extends SVGElement
  ? SVGElementEventMap
  : T extends XMLHttpRequestEventTarget
  ? XMLHttpRequestEventMap
  : never;

export type Handler<T extends EventTarget, E extends Extract<keyof EventMap<T>, string>> = (
  this: T,
  e: EventMap<T>[E]
) => void;

export type Events<T extends EventTarget> = Extract<keyof EventMap<T>, string>;

export type EventHost<T extends EventTarget> = <E extends Events<T>>(
  name: E,
  handler: Handler<T, E>,
  options?: boolean | EventListenerOptions
) => CleanUpFunc;

export interface Hooks {
  /**
   * Get the cleanup collector function.
   */
  useCleanUpCollector(): (cleanup: CleanUpFunc) => CleanUpFunc;
  /**
   * Get the hosting element of the component instance.
   */
  useHost(): ParentNode;
  /**
   * Get the parent element of the component instance.
   */
  useParent(): Element;
}

/**
 * Slot name map for
 */
export type SlotMap = Record<string, Element | DocumentFragment | Mountable<any>>;
export type ExposeBase = {} | void;
export type OptionsBase = { };
export type Mountable<E extends ExposeBase> = (attach: AttachFunc) => Rendered<E>;

export type FunctionalComponent<O extends OptionsBase, S extends SlotMap = SlotMap, E extends ExposeBase = void> = (
  optinos: O,
  slots?: Optional<S>
) => Mountable<E>;
export type FunctionalComponentTemplateFactory = <S extends SlotMap>(
  input: string | HTMLTemplateElement,
  name?: string
) => <O extends OptionsBase, E extends ExposeBase>(setup?: (options: O) => E) => FunctionalComponent<O, S, E>;
export type AttachFunc = (el: Node) => Element;

export type Rendered<E extends ExposeBase> = [CleanUpFunc, E];
