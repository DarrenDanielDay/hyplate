/**
 * @license MIT
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { addCleanUp } from "./internal.js";
import type { AttachFunc, CleanUpFunc, Effect, Hooks, Mountable } from "./types.js";
import { push, scopes } from "./util.js";

/**
 * @internal
 */
export const [enterHooks, quitHooks, _resolveHooks] = /* #__PURE__ */ scopes<Hooks>();

const resolveHooks = (): Hooks => {
  let currentHooks = _resolveHooks();
  if (!currentHooks) {
    throw new Error(
      `Invalid hook call. Hooks can only be called inside the setup function of template-based component.`
    );
  }
  return currentHooks;
};

export const createHooks = (cleanups: CleanUpFunc[]): Hooks => {
  const register = (cleanup: CleanUpFunc): void => {
    addCleanUp(cleanups, cleanup);
  };
  const useCleanUpCollector: Hooks["useCleanUpCollector"] = () => register;
  const hooks: Hooks = {
    useCleanUpCollector,
  };
  return hooks;
};

export const useCleanUpCollector: Hooks["useCleanUpCollector"] = () => resolveHooks().useCleanUpCollector();

export const useChildView =
  <E>(mountable: Mountable<E>) =>
  (attach: AttachFunc) => {
    const [cleanup, exposed] = mountable(attach);
    useCleanUp(cleanup);
    return exposed;
  };

export const useCleanUp = (cleanup: CleanUpFunc) => resolveHooks().useCleanUpCollector()(cleanup);

/**
 * @internal
 */
export const [enterEffectScope, quitEffectScope, currentEffectScope] = /* #__PURE__ */ scopes<Effect[]>();

export const useEffect = (callback: Effect) => {
  const autoRuns = currentEffectScope();
  if (!autoRuns) {
    throw new Error("Invalid hook call. Current scope is not in a functional component.");
  }
  push(autoRuns, callback);
};
