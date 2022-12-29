import { enableBuiltinStore } from "hyplate/store";
import { appendChild } from "hyplate/core";
import { App } from "./components/app/app.js";
enableBuiltinStore();
// If you prefer JSX, you can use JSX syntax instead of `App({greet: "You"})`.
const appMountable = <App greet="You"></App>;
const attach = appendChild<HTMLElement>(document.body);
const [unmountApp] = appMountable(attach);

// Everything happens synchronously. The DOM elements of `App` are created and inserted.
// So you can even add more you want here...
// Here we add a button to unmount `App`.
const fragmentMountable = (
  // JSX Fragment is also supported.
  <>
    {/* You can even write style element in JSX. */}
    <style>@import url("/css/layout.css");</style>
    <div class="centered">
      <p>The following content is outside of App.</p>
      <button
        title="button outside App"
        onClick={() => {
          unmountApp();
          // You can even unmout itself! 🤣
          unmountFragment();
        }}
      >
        unmount App
      </button>
    </div>
    <div class="centered">
      <p>Edit source files and reload page to see changes.</p>
      <p>
        For <code>conditional rendering / list rendering</code>, see JSX example.
      </p>
    </div>
  </>
);
const [unmountFragment] = fragmentMountable(attach);
