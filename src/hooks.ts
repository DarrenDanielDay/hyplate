/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { ParseSelector } from "typed-query-selector/parser.js";
import { bindEvent, anchor, select } from "./core.js";
import type {
  AttachFunc,
  CleanUpFunc,
  EventHost,
  ExposeBase,
  Hooks,
  Mountable,
} from "./types.js";
import { once, scopes } from "./util.js";

/**
 * @internal
 */
export const [enterHooks, quitHooks, _resolveHooks] = scopes<Hooks>();

const resolveHooks = (): Hooks => {
  let currentHooks = _resolveHooks();
  if (!currentHooks) {
    throw new Error(`Invalid hook call. Hooks can only be called inside the setup function of template-based component.`);
  }
  return currentHooks;
};
type CreateHooksResult = [Hooks, CleanUpFunc];

export const createHooks = ({ host, parent }: { host: ParentNode; parent: Element }): CreateHooksResult => {
  const cleanups = new Set<CleanUpFunc>();
  const effect = (cleanup: CleanUpFunc): CleanUpFunc => {
    const wrapped = once(() => {
      cleanups.delete(wrapped);
      cleanup();
    });
    cleanups.add(wrapped);
    return wrapped;
  };
  const useCleanUpCollector: Hooks["useCleanUpCollector"] = () => effect;
  const useHost: Hooks["useHost"] = () => host;
  const useParent: Hooks["useParent"] = () => parent;
  const hooks: Hooks = {
    useCleanUpCollector,
    useHost,
    useParent,
  };
  const cleanup = () => {
    for (const cleanup of [...cleanups]) {
      cleanup();
    }
    cleanups.clear();
  };
  return [hooks, cleanup];
};

export const useCleanUpCollector: Hooks["useCleanUpCollector"] = () => resolveHooks().useCleanUpCollector();

export const useHost: Hooks["useHost"] = () => resolveHooks().useHost();

export const useParent: Hooks["useParent"] = () => resolveHooks().useParent();

export const useAnchor = (hid: string) => anchor(useHost(), hid);

export const useChildView =
  <E extends ExposeBase>(mountable: Mountable<E>) =>
  (attach: AttachFunc) => {
    const [cleanup, exposed] = mountable(attach);
    useCleanUp(cleanup);
    return exposed;
  };

export const useCleanUp = (cleanup: CleanUpFunc) => resolveHooks().useCleanUpCollector()(cleanup);

export const useEvent = <T extends EventTarget>(target: T): EventHost<T> => {
  const eventHost = bindEvent(target);
  const effect = resolveHooks().useCleanUpCollector();
  return (name, handler, options) => {
    const cleanup = effect(eventHost(name, handler, options));
    return cleanup;
  };
};

export const useRef = <S extends string>(selecor: S): ParseSelector<S> | null => select(useHost(), selecor);
