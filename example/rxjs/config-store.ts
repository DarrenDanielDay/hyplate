import { configureBinding } from "hyplate/binding";
import { isObservable, Observable } from "rxjs";
configureBinding((observable, subscriber) => {
  const subscription = observable.subscribe(subscriber);
  return () => {
    subscription.unsubscribe();
  };
}, isObservable);
declare module "hyplate/types" {
  export interface Subscribable<T> extends Observable<T> {}
}
