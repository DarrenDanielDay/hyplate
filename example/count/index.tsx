import { appendChild } from "hyplate/core";
import { mount } from "hyplate/jsx-runtime";
import { source, query, enableBuiltinStore } from "hyplate/store";

//#region
// Configure the binding source and types
// This function should be executed once before any binding is created.
// If you want to use other library for reactivity (such as `rxjs` and `mobx`), use the `configureBinding` API.
enableBuiltinStore();
declare module "hyplate/types" {
  // Use declaration merging to configure the reactive (subscribable) data type.
  // If you want to use `rxjs`, the code might be:
  // export interface Subscribable<T> extends Observable<T> {}
  export interface Subscribable<T> extends Query<T> {}
}
//#endregion

const App = ({ msg }: { msg: string }) => {
  const count = source(0);
  const doubleCount = query(() => count.val * 2);
  console.log("This function will only be executed once on `App` attach.");
  return (
    <div class="app">
      <link rel="stylesheet" href="./index.css"></link>
      <img src="./logo.svg" class="logo"></img>
      <div>Hello, {msg}!</div>
      <button
        onClick={() => {
          count.set(count.val + 1);
        }}
      >
        add count
      </button>
      <div>You clicked {count} times.</div>
      <div>Double of count is {doubleCount}.</div>
    </div>
  );
};

mount(<App msg="hyplate"></App>, appendChild(document.body));
