import { appendChild } from "hyplate/core";
import { source, query } from "hyplate/store";

const App = ({ msg }: { msg: string }) => {
  const count = source(0);
  const doubleCount = query(() => count.val * 2);
  console.log("This function will only execute once.");
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

(<App msg="hyplate"></App>)(appendChild(document.body));
