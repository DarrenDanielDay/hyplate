import { If } from "hyplate";
import { appendChild } from "hyplate/core";
import { source, query } from "hyplate/store";

const App = () => {
  const show = source(false);
  const message = query(() => (show.val ? "hide" : "show"));
  console.log("This function will only be executed once on `App` attach.");
  return (
    <div class="app">
      <link rel="stylesheet" href="./index.css"></link>
      <img src="./logo.svg" class="logo"></img>
      <div>Hello, hyplate!</div>
      <button
        onClick={() => {
          show.set(!show.val);
        }}
      >
        {message}
      </button>
      <If condition={show}>
        {{
          then: <div>I'm there!</div>,
          else: <div>The content is hidden.</div>,
        }}
      </If>
    </div>
  );
};

(<App />)(appendChild(document.body));
