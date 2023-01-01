import { before } from "hyplate/core";
import { useChildView, useEvent } from "hyplate/hooks";
import { Counter } from "../counter/counter.component.js";
import { appTemplate } from "./app.template.js";
interface AppProps {
  greet: string;
}

export const App = appTemplate(({ greet }: AppProps, ctx) => {
  const counterAPI = useChildView(<Counter name={greet}></Counter>)(before(ctx.refs.reset));
  useEvent(ctx.refs.reset)("click", () => {
    counterAPI.clearCount();
  });
});
