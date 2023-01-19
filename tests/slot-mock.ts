let assign: HTMLSlotElement["assign"] | undefined;
let assignedNodes: HTMLSlotElement["assignedNodes"] | undefined;
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
};

export const reset = () => {
  HTMLSlotElement.prototype.assign = assign!;
  HTMLSlotElement.prototype.assignedNodes = assignedNodes!;
};
