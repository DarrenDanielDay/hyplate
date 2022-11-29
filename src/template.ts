import { $$, appendChild, before, clone, element, insertSlot, remove } from "./core.js";
import { createHooks, enterHooks, quitHooks } from "./hooks.js";
import type { FunctionalComponentTemplateFactory, SlotMap } from "./types.js";
import { isFunction, once, patch } from "./util.js";
import { withComments } from "./internal.js";

export const template = (input: string | HTMLTemplateElement): HTMLTemplateElement =>
  input instanceof HTMLTemplateElement ? input : patch(element("template"), { innerHTML: input });

const anonymousElement = () => class HyplateAnonymousElement extends HTMLElement {};

let templateId = 0;
const templateName = (name: string | undefined) => name ?? `hype-${templateId++}`;
export const shadowed: FunctionalComponentTemplateFactory = (input, name) => {
  const t = template(input);
  return (setup) => {
    const elementTag = templateName(name);
    const slotTag = `${elementTag}-slot`;
    customElements.define(elementTag, anonymousElement());
    customElements.define(slotTag, anonymousElement());
    return (options) => (attach) => {
      const slots = options.children;
      const owner = document.createElement(elementTag);
      const parent = attach(owner);
      const shadow = owner.attachShadow({ mode: "open" });
      shadow.appendChild(clone(t.content));
      if (slots) {
        for (const [name, slotInput] of Object.entries<SlotMap[string]>(slots)) {
          const element = document.createElement(slotTag);
          if (isFunction(slotInput)) {
            slotInput(appendChild(element));
          } else {
            appendChild(element)(slotInput);
          }
          insertSlot(owner, name, element);
        }
      }
      const [hooks, cleanupHooks] = createHooks({
        host: shadow,
        parent,
      });
      enterHooks(hooks);
      const exposed = setup?.(options as never) as never;
      quitHooks();
      const cleanupView = () => {
        for (const child of Array.from(shadow.childNodes)) {
          remove(child);
        }
        for (const child of Array.from(owner.childNodes)) {
          remove(child);
        }
        remove(owner);
      };
      const unmount = once(() => {
        cleanupHooks();
        cleanupView();
      });
      return [unmount, exposed];
    };
  };
};

export const replaced: FunctionalComponentTemplateFactory = (input, name) => {
  const t = template(input);
  const componentName = templateName(name);
  return (setup) => {
    return (options) => (attach) => {
      const slots = options.children;
      const [cleanupComment, [begin, end, clearRange]] = withComments(componentName);
      const fragment = clone(t.content);
      attach(begin);
      const host = attach(fragment);
      attach(end);
      if (slots) {
        const fragmentSlots = $$(host, "slot");
        for (const slot of fragmentSlots) {
          const slotInput = slots[slot.name as keyof typeof slots];
          if (!slotInput) {
            continue;
          }
          const attach = before(slot);
          if (isFunction(slotInput)) {
            slotInput(attach);
          } else {
            attach(slotInput);
          }
          remove(slot);
        }
      }
      const [hooks, cleanupHooks] = createHooks({ host, parent: host });
      enterHooks(hooks);
      const exposed = setup?.(options as never) as never;
      quitHooks();
      const cleanupView = () => {
        clearRange();
        cleanupComment();
      };
      const unmount = once(() => {
        cleanupHooks();
        cleanupView();
      });
      return [unmount, exposed];
    };
  };
};
