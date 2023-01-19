import { appendChild, attr, element } from "./core.js";
import { addCleanUp, isFragment, isNode, isValidSlotContent } from "./internal.js";
import type { AttachFunc, CleanUpFunc, NativeSlotContent, Renderer, SlotContent, SlotMap } from "./types.js";
import { fori, push } from "./util.js";

export const slotName = (name: string) => `${name}-slot`;

export const insertSlot = (host: Element, slotName: string, element: Element) => {
  attr(element, "slot", slotName);
  appendChild(host)(element);
};

export const assignSlot = (host: Element, slot: HTMLSlotElement, contents: NativeSlotContent[]) => {
  host.append(...contents);
  slot.assign(...contents);
};

const validateSlotContent = (node: Node, contents: NativeSlotContent[]) => {
  if (isValidSlotContent(node)) {
    push(contents, node);
  } else if (isFragment(node)) {
    for (let child = node.firstChild; child; child = child.nextSibling) {
      validateSlotContent(child, contents);
    }
  }
};

const renderSlotContent = (mount: Renderer, content: SlotContent, cleanups: CleanUpFunc[]): NativeSlotContent[] => {
  const contents: NativeSlotContent[] = [];
  if (isNode(content)) {
    validateSlotContent(content, contents);
  } else {
    const attach: AttachFunc = (node) => {
      validateSlotContent(node, contents);
    };
    const [cleanup] = mount(content, attach);
    addCleanUp(cleanups, cleanup);
  }
  return contents;
};

export const assignSlotMap = (mount: Renderer, host: Element, slotMap: SlotMap, cleanups: CleanUpFunc[]): void => {
  fori(host.shadowRoot!.querySelectorAll("slot"), (slot) => {
    const { name } = slot;
    if (!(name in slotMap)) {
      return;
    }
    const content = slotMap[name];
    if (!content) {
      return;
    }
    const contents = renderSlotContent(mount, content, cleanups);
    if (contents.length) {
      assignSlot(host, slot, contents);
    }
  });
};

export const insertSlotMap = (
  mount: Renderer,
  host: Element,
  slotMap: SlotMap,
  slotTag: string,
  cleanups: CleanUpFunc[]
): void => {
  for (const name in slotMap) {
    const content = slotMap[name];
    if (!content) {
      continue;
    }
    const contents = renderSlotContent(mount, content, cleanups);
    const slotContainer = element(slotTag);
    slotContainer.append(...contents);
    insertSlot(host, name, slotContainer);
  }
};
