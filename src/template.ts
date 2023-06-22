/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { access, before, clone, element, remove } from "./core.js";
import { createHooks, enterHooks, quitHooks } from "./hooks.js";
import { addCleanUp, isTemplate } from "./internal.js";
import { mount } from "./jsx-runtime.js";
import { assignSlotMap } from "./slot.js";
import type {
  CleanUpFunc,
  ContextFactory,
  FunctionalComponentTemplateFactory,
  ExposedElement,
  TemplateContext,
} from "./types.js";
import { applyAll, applyAllStatic, defineProp, fori, isFunction, once, patch } from "./util.js";

export const template = (input: string | HTMLTemplateElement): HTMLTemplateElement =>
  isTemplate(input) ? input : patch(element("template"), { innerHTML: input });

// @ts-expect-error generic overload
export const shadowed: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup, wrapper) => {
    const elementTag = wrapper ?? "div";
    return (props) => (attach) => {
      const localCleanups: CleanUpFunc[] = [];
      const slots = props.children;
      // @ts-expect-error dynamic created element
      const host: ExposedElement<unknown> = element(elementTag);
      attach(host);
      const shadow = host.attachShadow({ mode: "open", slotAssignment: "manual" });
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;
      shadow.appendChild(fragment);
      if (slots) {
        assignSlotMap(mount, host, slots, localCleanups);
      }
      const hooks = createHooks(localCleanups);
      enterHooks(hooks);
      const exposed = setup?.(props as never, context) as never;
      quitHooks();
      defineProp(host, "exposed", {
        value: exposed,
      });
      const unmount = once(() => {
        applyAll(localCleanups);
      });
      return [unmount, exposed, () => [host, host]];
    };
  };
};
// @ts-expect-error generic overload
export const replaced: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup, wrapper) => {
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
            const [cleanupSlot] = mount(slotInput, attach);
            addCleanUp(localCleanups, cleanupSlot);
          } else {
            attach(slotInput);
          }
          remove(slot);
        });
      }
      let host: Node, begin: Node | null, end: Node | null;
      if (wrapper) {
        host = begin = end = element(wrapper);
        host.appendChild(fragment);
      } else {
        host = fragment;
        begin = fragment.firstChild;
        end = fragment.lastChild;
      }
      attach(host);
      const hooks = createHooks(localCleanups);
      enterHooks(hooks);
      const exposed = setup?.(options as never, context) as never;
      quitHooks();
      const unmount = once(() => {
        applyAll(localCleanups);
      });
      return [unmount, exposed, () => [begin, end]];
    };
  };
};

// @ts-expect-error generic overload
export const pure: FunctionalComponentTemplateFactory = (input, contextFactory) => {
  const t = template(input);
  return (setup) => {
    return (options) => (attach) => {
      const localCleanups: CleanUpFunc[] = [];
      const fragment = clone(t.content);
      const context = contextFactory?.(fragment)!;
      const begin = fragment.firstChild;
      const end = fragment.lastChild;
      attach(fragment);
      const hooks = createHooks(localCleanups);
      enterHooks(hooks);
      const exposed = setup?.(options as never, context) as never;
      quitHooks();
      const unmount = applyAllStatic(localCleanups);
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
