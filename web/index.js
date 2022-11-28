import { replaced, shadowed } from "../dist/template.js";
import { useCleanUp, useEvent, useRef, useAnchor } from "../dist/hooks.js";
import { query, source } from "../dist/store.js";
import { text, clone, bindEvent, appendChild, select, anchorRef, bindAttr } from "../dist/core.js";

function main() {
  const t1 = anchorRef("t1");
  const t2 = anchorRef("t2");
  const app = select("div#app");
  const resetBtn = select("button#reset");
  const unmountBtn = select("button#unmount");
  const World = replaced(t2)();
  const App = shadowed(t1)(
    /**
     * Define component inputs.
     * @param {{user: string}} options
     */
    ({ user }) => {
      const count = source(0);
      const double = query(() => count.val * 2);
      const addButton = useRef("button.add-btn");
      const oddDisabledBtn = useAnchor("odd-disabled");
      useCleanUp(text`${user} clicked ${count} times.`(appendChild(addButton)));
      useCleanUp(text`double of count: ${double}`(appendChild(useAnchor("double"))));
      const disabled = query(() => count.val % 2 === 1);
      useCleanUp(bindAttr(oddDisabledBtn, "disabled", disabled));
      useEvent(addButton)("click", () => {
        console.log("click!");
        count.set(count.val + 1);
      });
      // Return the APIs you want to expose.
      return {
        /**
         * @param {number} cnt
         */
        setCount(cnt) {
          count.set(cnt);
        },
      };
    }
  );
  const [unmountApp, exposed] = App({ user: "Darren" }, { world: World({}) })(appendChild(app));
  const unbindRest = bindEvent(resetBtn)("click", () => {
    exposed.setCount(0);
  });
  const unbindUnmount = bindEvent(unmountBtn)("click", () => {
    console.log("unmount!");
    unmountApp();
    unbindUnmount();
    unbindRest();
  });
}

main();
