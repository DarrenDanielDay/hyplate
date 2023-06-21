import { enableBuiltinSignals } from "../dist/signals";
declare module "../dist/types.js" {
  export interface Subscribable<T> extends Signal<T> {}
}
export const setHyplateStore = () => {
  enableBuiltinSignals();
};
