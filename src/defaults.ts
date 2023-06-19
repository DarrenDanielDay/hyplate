// import type {} from "typed-query-selector";
import { enableBuiltinStore } from "./store.js";
enableBuiltinStore();
declare module "./types.js" {
  export interface Subscribable<T> extends Query<T> {}
}
