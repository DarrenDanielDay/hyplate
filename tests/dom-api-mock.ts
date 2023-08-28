import type { ModelableElement } from "../dist/types";

let assign: HTMLSlotElement["assign"] | undefined;
let assignedNodes: HTMLSlotElement["assignedNodes"] | undefined;
let attachInternals: HTMLElement["attachInternals"] | undefined;
const HTMLSlotElement = window.HTMLSlotElement;
export const mock = () => {
  assign = HTMLSlotElement.prototype.assign;
  assignedNodes = HTMLSlotElement.prototype.assignedNodes;
  HTMLSlotElement.prototype.assign = function assign(...nodes) {
    // @ts-ignore
    this.__assignedNodes = nodes;
  };
  HTMLSlotElement.prototype.assignedNodes = function assignedNodes() {
    // @ts-ignore
    return this.__assignedNodes;
  };
  // @ts-ignore
  HTMLElement.prototype.attachInternals = function () {
    return {};
  };
};

export const reset = () => {
  HTMLSlotElement.prototype.assign = assign!;
  HTMLSlotElement.prototype.assignedNodes = assignedNodes!;
  HTMLElement.prototype.attachInternals = attachInternals!;
};

export const mockInput = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input"));
};

export const mockChange = (input: ModelableElement<string>, value?: string) => {
  if (value != null) {
    input.value = value;
  }
  input.dispatchEvent(new Event("change"));
};
