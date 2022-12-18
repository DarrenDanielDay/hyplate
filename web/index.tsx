import { replaced, shadowed } from "../dist/template.js";
import { useCleanUp, useEvent, useRef, useAnchor, useChildView } from "../dist/hooks.js";
import { query as computed, source as ref } from "../dist/store.js";
import { For, Show } from "../dist/directive.js";
import { text, bindEvent, appendChild, select, anchorRef, bindAttr, after, seqAfter } from "../dist/core.js";
import { jsxRef } from "../dist/jsx-runtime";

function main() {
  const t1 = anchorRef("t1");
  const t2 = anchorRef("t2");
  const app = select("div#app");
  const resetBtn = select("button#reset");
  const unmountBtn = select("button#unmount");
  const World = shadowed(t2)();
  const App = shadowed<"world">(t1)(({ user }: { user: string }) => {
    const count = ref(0);
    const double = computed(() => count.val * 2);
    const addButton = useRef("button.add-btn");
    const oddDisabledBtn = useAnchor("odd-disabled");
    useCleanUp(text`${user} clicked ${count} times.`(appendChild(addButton)));
    useCleanUp(text`double of count: ${double}`(appendChild(useAnchor("double"))));
    const disabled = computed(() => count.val % 2 === 1);
    useCleanUp(bindAttr(oddDisabledBtn, "disabled", disabled));
    useEvent(addButton)("click", () => {
      console.log("click!");
      count.set(count.val + 1);
    });
    const listItem = (text: string) => ({
      text: ref(text),
    });
    const list = ref([listItem("aaa"), listItem("bbb"), listItem("ccc")]);
    useChildView(
      <>
        <Show when={computed(() => count.val % 2 === 0)}>
          <div>mod 2 = 0</div>
        </Show>
        <Show when={computed(() => count.val % 3)} fallback={<div>mod 3 = 0</div>}>
          {(attach, mod) => {
            console.log(`mod changed: ${mod}`);
            return (<div>
              mod 3 = 1 or 2
              <>
                <div style={computed(() => (count.val % 3 === 1 ? `color: red` : `color: blue`))}>fragment</div>
                <div>supported</div>
              </>
            </div>)(attach);
          }}
        </Show>
        <For of={list}>
          {(item) => {
            const renameInput = jsxRef<HTMLInputElement>();
            const moveIndexInput = jsxRef<HTMLInputElement>();
            return (
              <>
                <div class="list-item">
                  <span>{item.text}</span>
                  <div class="row">
                    <button
                      onClick={() => {
                        item.text.set(renameInput.current.value);
                      }}
                    >
                      rename as:
                    </button>
                    <input ref={renameInput} type="text"></input>
                  </div>
                  <div class="row">
                    <button
                      onClick={() => {
                        const originalList = list.val;
                        const splitIndex = +moveIndexInput.current.value;
                        if (!(0 <= splitIndex && splitIndex < originalList.length)) {
                          return;
                        }
                        const newList = [
                          ...originalList.slice(0, splitIndex).filter((it) => it !== item),
                          item,
                          ...originalList.slice(splitIndex).filter((it) => it !== item),
                        ];
                        console.log(
                          `moved list:`,
                          newList.map((it) => it.text.val)
                        );
                        list.set(newList);
                      }}
                    >
                      move to index:
                    </button>
                    <input ref={moveIndexInput} type="text"></input>
                  </div>
                  <div class="row">
                    <button
                      onClick={() => {
                        const originalList = list.val;
                        const random = Math.floor(Math.random() * originalList.length);
                        console.log(`Insert ${item.text} at index ${random}`);
                        list.set([
                          ...originalList.slice(0, random),
                          {
                            text: item.text,
                          },
                          ...originalList.slice(random),
                        ]);
                      }}
                    >
                      clone and insert randomly
                    </button>
                    <button
                      onClick={() => {
                        list.set(list.val.filter((it) => it !== item));
                      }}
                    >
                      delete
                    </button>
                  </div>
                </div>
                <div>fragment part2: {item.text}</div>
              </>
            );
          }}
        </For>
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
