import { configureBinding } from "hyplate";
import type { Subscribable } from "hyplate/types";
import { autorun, isComputed } from "mobx";
import type { IComputedValue } from "mobx/dist/internal.js";

configureBinding(
  (computed, notify) => {
    return autorun(() => {
      notify(computed.get());
    });
  },
  (x): x is Subscribable<any> => isComputed(x)
);

declare module "hyplate/types" {
  export interface Subscribable<T> extends IComputedValue<T> {}
}
