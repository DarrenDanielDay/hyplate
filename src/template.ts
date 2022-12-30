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
import { applyAll, isFunction, objectEntriesMap, once, patch, push } from "./util.js";
import { withCommentRange } from "./internal.js";

export const template = (input: string | HTMLTemplateElement): HTMLTemplateElement =>
  input instanceof HTMLTemplateElement ? input : patch(element("template"), { innerHTML: input });

const anonymousElement = () =>
  class HyplateAnonymousElement<T> extends HTMLElement implements HyplateElement<T> {
    readonly exposed: T = null as T;
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
      const parent = attach(owner);
      const shadow = owner.attachShadow({ mode: "open" });
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;
      shadow.appendChild(fragment);
      if (slots) {
        for (const [name, slotInput] of Object.entries(slots)) {
          if (slotInput == null) {
            continue;
          }
          const element = document.createElement(slotTag);
          if (isFunction(slotInput)) {
            const [cleanupSlot] = slotInput(appendChild(element));
            push(localCleanups, cleanupSlot);
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
      const exposed = setup?.(props as never, context) as never;
      quitHooks();
      Object.defineProperty(owner, "exposed", {
        value: exposed,
      });
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
        applyAll(localCleanups)();
        cleanupView();
      });
      return [unmount, exposed, () => [owner, owner]];
    };
  };
};
// @ts-expect-error generic overload
export const replaced: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup, name) => {
    const componentName = templateName(name);
    return (options) => (attach) => {
      const localCleanups: CleanUpFunc[] = [];
      const slots = options.children;
      const [cleanupComment, [begin, end, clearRange]] = withCommentRange(componentName);
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;
      attach(begin);
      const host = attach(fragment);
      attach(end);
      if (slots) {
        const fragmentSlots = host.querySelectorAll("slot");
        for (const slot of fragmentSlots) {
          const slotInput = slots[slot.name as keyof typeof slots];
          if (slotInput == null) {
            continue;
          }
          const attach = before(slot);
          if (isFunction(slotInput)) {
            const [cleanupSlot] = slotInput(attach);
            push(localCleanups, cleanupSlot);
          } else {
            attach(slotInput);
          }
          remove(slot);
        }
      }
      const [hooks, cleanupHooks] = createHooks({ host, parent: host });
      enterHooks(hooks);
      const exposed = setup?.(options as never, context) as never;
      quitHooks();
      const cleanupView = () => {
        clearRange();
        cleanupComment();
      };
      const unmount = once(() => {
        cleanupHooks();
        applyAll(localCleanups)();
        cleanupView();
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
  return (fragment) => ({
    refs: objectEntriesMap(paths, ([, value]) => access(fragment, value)),
  });
};
