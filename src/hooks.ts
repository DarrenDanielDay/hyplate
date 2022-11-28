import type { ParseSelector } from "typed-query-selector/parser.js";
import { bindEvent, anchorRef, select } from "./core.js";
import type { AttachFunc, CleanUpFunc, EventHost, ExposeBase, FunctionalComponent, Hooks, OptionsBase, SlotMap } from "./types.js";
import { once, scopes } from "./util.js";

/**
 * @internal
 */
export const [enterHooks, quitHooks, _resolveHooks] = scopes<Hooks>();

const resolveHooks = (): Hooks => {
  let currentHooks = _resolveHooks();
  if (!currentHooks) {
    throw new Error(`Invalid hook call.`);
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

export const useAnchor = (hid: string) => anchorRef(useHost(), hid);

export const useChildView =
  <O extends OptionsBase, S extends SlotMap, E extends ExposeBase>(component: FunctionalComponent<O, S, E>) =>
  (options: O, slots: S) =>
  (attach: AttachFunc) => {
    const [cleanup, exposed] = component(options, slots)(attach);
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
