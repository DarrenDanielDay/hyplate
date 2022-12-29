import { enableBuiltinStore } from "../dist/store";
declare module "../dist/types.js" {
  export interface Subscribable<T> extends Query<T> {}
}
export const setHyplateStore = () => {
  enableBuiltinStore();
};
