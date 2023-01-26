import { jsx } from "./jsx-runtime.js";
import type { JSXFactory } from "./types.js";

/**
 * This JSX factory is just for tool chain compatibility.
 */
export const jsxDEV: JSXFactory = (type: any, props: any) => jsx(type, props);

export { Fragment } from "./jsx-runtime.js";
