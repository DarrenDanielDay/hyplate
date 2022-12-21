import { appendChild, before, bindText, text } from "hyplate/core";
import { useChildView, useCleanUp, useEvent } from "hyplate/hooks";
import { source as atom, query as selector } from "hyplate/store";
import { app, counter } from "./app.template.js";
interface CounterProps {
  name: string;
}
// Define a `Counter` component with template `counter` by passing a setup function.
const Counter = counter(({ name }: CounterProps, ctx) => {
  // Define source/atom/ref data.
  const count = atom(0);
  // Define query/selector/computed data.
  const doubleCount = selector(() => count.val * 2);
  // Try to use `go to definition` here in vscode (with magic)
  //                👇
  useEvent(ctx.refs.btn)("click", () => {
    // Use `.set(newValue)` to update it.
    count.set(count.val + 1);
  });
  // Use `text` with template literal for text binding:
  const unbindText = text`${name} clicked ${count} times.`(appendChild(ctx.refs.countMsg));

  // Unsubscribe when component destroyed.
  useCleanUp(unbindText);
  // Or use `bindText` directly.
  const unbindDoubleText = bindText(
    ctx.refs.doubleMsg,
    // In this case, do not forget the `.val`!
    selector(() => `The double of count is ${doubleCount.val}`)
  );
  useCleanUp(unbindDoubleText);
  // If you want to expose some API, just return it.
  return {
    clearCount() {
      count.set(0);
    },
  };
}, "my-counter" /* Optional custom element name. It will be generated if omitted. */);

interface AppProps {
  greet: string;
}

export const App = app(({ greet }: AppProps, ctx) => {
  // Components are `just` functions, which returns a `Mountable` function.
  const counterMountable = Counter({ name: greet });
  // Calling the `Mountable` function with an `AttachFunc` function will mount the `Counter` component.
  // The following `AttachFunc` means to insert the DOM nodes right before the `reset` button.
  const attach = before(ctx.refs.reset);
  // Here we use `useChildView` to make `Counter` be a child view of `App`.
  // Child view will be automatically destroyed when its parent gets destroyed.
  // And you can get the `Counter` exposed API here.
  const counterAPI = useChildView(counterMountable)(attach);
  useEvent(ctx.refs.reset)("click", () => {
    counterAPI.clearCount();
  });
}, "my-app" /* Optional custom element name. It will be generated if omitted. */);
