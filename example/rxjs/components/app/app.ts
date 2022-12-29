import { bindText, interpolation } from "hyplate/binding";
import { appendChild, before } from "hyplate/core";
import { useChildView, useCleanUp, useEvent } from "hyplate/hooks";
import { BehaviorSubject, map } from "rxjs";
import { app, counter } from "./app.template.js";
interface CounterProps {
  name: string;
}
const Counter = counter(({ name }: CounterProps, ctx) => {
  const count = new BehaviorSubject(0);
  const doubleCount = count.pipe(map((c) => c * 2));
  
  useEvent(ctx.refs.btn)("click", () => {
    count.next(count.value + 1);
  });

  const unbindText = interpolation`${name} clicked ${count} times.`(appendChild(ctx.refs.countMsg));
  useCleanUp(unbindText);

  const unbindDoubleText = bindText(
    ctx.refs.doubleMsg,
    doubleCount.pipe(map((val) => `The double of count is ${val}`))
  );
  useCleanUp(unbindDoubleText);

  return {
    clearCount() {
      count.next(0);
    },
  };
}, "my-counter");

interface AppProps {
  greet: string;
}

export const App = app(({ greet }: AppProps, ctx) => {
  const counterMountable = Counter({ name: greet });
  const attach = before(ctx.refs.reset);
  const counterAPI = useChildView(counterMountable)(attach);
  useEvent(ctx.refs.reset)("click", () => {
    counterAPI.clearCount();
  });
}, "my-app");
