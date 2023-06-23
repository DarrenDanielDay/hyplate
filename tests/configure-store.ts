import { resetBinding } from "../dist/binding";
import { enableBuiltinSignals } from "../dist/signals";
declare module "../dist/types.js" {
  export interface Subscribable<T> extends Signal<T> {}
}
export const useSignals = () => {
  beforeAll(() => {
    enableBuiltinSignals();
  });
  afterAll(() => {
    resetBinding();
  });
};
