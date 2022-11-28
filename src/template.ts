import { $$, appendChild, before, clone, element, insertSlot, remove } from "./core.js";
import { createHooks, enterHooks, quitHooks } from "./hooks.js";
import { __DEV__ } from "./internal.js";
import type { FunctionalComponentTemplateFactory } from "./types.js";
import { isFunction, once, patch } from "./util.js";

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
    return (options, slots) => (attach) => {
      const owner = document.createElement(elementTag);
      const parent = attach(owner);
      const shadow = owner.attachShadow({ mode: "open" });
      shadow.appendChild(clone(t.content));
      if (slots) {
        for (const [name, slotInput] of Object.entries(slots)) {
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
      const exposed = setup?.(options) as never;
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
    return (options, slots) => (attach) => {
      const fragment = clone(t.content);
      const begin = new Comment(__DEV__ ? ` ${componentName} begin ` : "");
      attach(begin);
      const host = attach(fragment);
      const end = new Comment(__DEV__ ? ` ${componentName} end ` : "");
      attach(end);
      if (slots) {
        const fragmentSlots = $$(host, "slot");
        for (const slot of fragmentSlots) {
          const slotInput = slots[slot.name];
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
      const exposed = setup?.(options) as never;
      quitHooks();
      const cleanupView = () => {
        const range = new Range();
        range.setStart(begin, 0);
        range.setEnd(end, end.length);
        range.deleteContents();
        range.detach();
        remove(begin);
        remove(end);
      };
      const unmount = once(() => {
        cleanupHooks();
        cleanupView();
      });
      return [unmount, exposed];
    };
  };
};
