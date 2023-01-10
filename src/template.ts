/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { access, appendChild, before, clone, element, insertSlot, remove } from "./core.js";
import { createHooks, enterHooks, quitHooks } from "./hooks.js";
import type {
  CleanUpFunc,
  ContextFactory,
  FunctionalComponentTemplateFactory,
  HyplateElement,
  TemplateContext,
} from "./types.js";
import { applyAll, fori, isFunction, once, patch, push } from "./util.js";

export const template = (input: string | HTMLTemplateElement): HTMLTemplateElement =>
  input instanceof HTMLTemplateElement ? input : patch(element("template"), { innerHTML: input });

const anonymousElement = () =>
  class HyplateAnonymousElement<T> extends HTMLElement implements HyplateElement<T> {
    declare exposed: T;
  };

let templateId = 0;
const templateName = (name: string | undefined) => name ?? `hype-${templateId++}`;
// @ts-expect-error generic overload
export const shadowed: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup, name) => {
    const elementTag = templateName(name);
    const slotTag = `${elementTag}-slot`;
    customElements.define(elementTag, anonymousElement());
    customElements.define(slotTag, anonymousElement());
    return (props) => (attach) => {
      const localCleanups: CleanUpFunc[] = [];
      const slots = props.children;
      // @ts-expect-error dynamic created element
      const owner: HyplateElement<unknown> = element(elementTag);
      attach(owner);
      const shadow = owner.attachShadow({ mode: "open" });
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;
      shadow.appendChild(fragment);
      if (slots) {
        for (const [name, slotInput] of Object.entries(slots)) {
          if (slotInput == null) {
            continue;
          }
          const slot = element(slotTag);
          if (isFunction(slotInput)) {
            const [cleanupSlot] = slotInput(appendChild(slot));
            push(localCleanups, cleanupSlot);
          } else {
            appendChild(slot)(slotInput);
          }
          insertSlot(owner, name, slot);
        }
      }
      const [hooks, cleanupHooks] = createHooks();
      enterHooks(hooks);
      const exposed = setup?.(props as never, context) as never;
      quitHooks();
      Object.defineProperty(owner, "exposed", {
        value: exposed,
      });
      const unmount = once(() => {
        cleanupHooks();
        applyAll(localCleanups)();
      });
      return [unmount, exposed, () => [owner, owner]];
    };
  };
};
// @ts-expect-error generic overload
export const replaced: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup) => {
    return (options) => (attach) => {
      const localCleanups: CleanUpFunc[] = [];
      const slots = options.children;
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;

      if (slots) {
        const fragmentSlots = fragment.querySelectorAll("slot");
        fori(fragmentSlots, (slot) => {
          const slotInput = slots[slot.name as keyof typeof slots];
          if (slotInput == null) {
            return;
          }
          const attach = before(slot);
          if (isFunction(slotInput)) {
            const [cleanupSlot] = slotInput(attach);
            push(localCleanups, cleanupSlot);
          } else {
            attach(slotInput);
          }
          remove(slot);
        });
      }
      const begin = fragment.firstChild;
      const end = fragment.lastChild;
      attach(fragment);
      const [hooks, cleanupHooks] = createHooks();
      enterHooks(hooks);
      const exposed = setup?.(options as never, context) as never;
      quitHooks();
      const unmount = once(() => {
        cleanupHooks();
        applyAll(localCleanups)();
      });
      return [unmount, exposed, () => [begin, end]];
    };
  };
};

export const basedOnURL = (url: string) => (path: string) => {
  return new URL(path, url) + "";
};

export const contextFactory = (
  paths: Record<string, number[]>
): ContextFactory<TemplateContext<Record<string, ParentNode | undefined>>> => {
  const refs: Record<string, ParentNode | undefined> = {};
  return (fragment) => {
    for (let k in paths) {
      refs[k] = access(fragment, paths[k]);
    }
    return {
      refs: { ...refs },
    };
  };
};
