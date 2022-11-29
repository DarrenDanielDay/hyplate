import { replaced, shadowed } from "../dist/template.js";
import { useCleanUp, useEvent, useRef, useAnchor, useChildView } from "../dist/hooks.js";
import { query, source } from "../dist/store.js";
import { Show } from "../dist/directive.js";
import { text, bindEvent, appendChild, select, anchorRef, bindAttr, after, seqAfter } from "../dist/core.js";

function main() {
  const t1 = anchorRef("t1");
  const t2 = anchorRef("t2");
  const app = select("div#app");
  const resetBtn = select("button#reset");
  const unmountBtn = select("button#unmount");
  const World = replaced(t2)();
  const App = replaced<"world">(t1)(({ user }: { user: string }) => {
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
    useChildView(
      <>
        <Show when={query(() => count.val % 2 === 0)}>
          <div>mod 2 = 0</div>
        </Show>
        <Show when={query(() => count.val % 3 === 1 || count.val % 3 === 2)} fallback={<div>mod 3 = 0</div>}>
          <div>
            mod 3 = 1 or 2
            <>
              <div style={query(() => (count.val % 3 === 1 ? `color: red` : `color: blue`))}>fragment</div>
              <div>supported</div>
            </>
          </div>
        </Show>
      </>
    )(seqAfter(oddDisabledBtn));
    // Return the APIs you want to expose.
    return {
      setCount(cnt: number) {
        count.set(cnt);
      },
    };
  });
  const [unmountApp, exposed] = App({ user: "Darren", children: { world: World({}) } })(appendChild(app));
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
