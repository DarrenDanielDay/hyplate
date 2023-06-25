/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { jsx } from "./jsx-runtime.js";
import type { JSXFactory } from "./types.js";

/**
 * This JSX factory is just for tool chain compatibility.
 */
export const jsxDEV: JSXFactory = (type: any, props: any) => jsx(type, props);

export { Fragment } from "./jsx-runtime.js";
