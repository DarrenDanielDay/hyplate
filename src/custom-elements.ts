import type { HyplateElement } from "./types.js";

const ce = customElements;

export const anonymousElement = () =>
  class HyplateAnonymousElement<T> extends HTMLElement implements HyplateElement<T> {
    declare exposed: T;
  };

export const define = /* #__PURE__ */ ce.define.bind(ce);
