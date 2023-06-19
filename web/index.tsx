import { replaced, shadowed } from "../dist/template.js";
/*
import count from "./components/count/count.template.js";
*/
import { useCleanUp, useChildView } from "../dist/hooks.js";
import { enableBuiltinStore, query, source } from "../dist/store.js";
import { For, Show } from "../dist/directive.js";
import { listen as bindEvent, appendChild, seqAfter, element, $ } from "../dist/core.js";
import { jsxRef, mount, unmount } from "../dist/jsx-runtime.js";
import { $attr, $text } from "../dist/binding.js";
import { useBinding } from "../dist/toolkit.js";
import { LifecycleCallbacks } from "hyplate/types.js";
import { Component, CustomElement } from "../dist/elements.js";
enableBuiltinStore();
@CustomElement({
  tag: "hyplate-counter-demo",
  shadowRootInit: {
    slotAssignment: "manual",
  },
  observedAttributes: ["id"],
})
class CountComponent extends Component<{ msg: string }, "insert-here"> implements LifecycleCallbacks {
  connectedCallback() {
    console.log("connected", arguments);
  }
  disconnectedCallback(): void {
    console.log("disconnected", arguments);
  }
  adoptedCallback(): void {
    console.log("adopted", arguments);
  }
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    console.log("attribute changed", arguments);
  }
  public override render(): JSX.Element {
    const count = source(0);
    return (
      <div>
        <p>Hello, class component!</p>
        <slot name={this.slots["insert-here"]}></slot>
        <button onClick={() => count.set(count.val + 1)}>
          {this.props.msg} clicked {count}
        </button>
      </div>
    );
  }
}
function main() {
  const container = element("div");
  const anchor = (frag: DocumentFragment, selector: string) => frag.querySelector(`[\\#${selector}]`);
  appendChild(document.body)(container);
  const r = jsxRef<CountComponent>();
  mount(
    <CountComponent msg="ohhhh" ref={r} attr:id="class-count">
      {{
        "insert-here": (
          <>
            <div>The inserted content</div>in fragment!
          </>
        ),
      }}
    </CountComponent>,
    container
  );
  console.log(r);
  const t1 = $("[\\#t1]") as HTMLTemplateElement;
  const t2 = $("[\\#t2]") as HTMLTemplateElement;
  const app = $("div#app")!;
  const resetBtn = $("button#reset")!;
  const unmountBtn = $("button#unmount")!;
  const World = replaced(t2)();
  /*
  const Count = count(({}, ctx) => {
    const counter = source(0);
    bindEvent(ctx.refs.addCountBtn)("click", () => {
      counter.set(counter.val + 1);
    });
    ctx.refs.msg.textContent = "";
    useCleanUp($text`you clicked ${counter} times.`(appendChild(ctx.refs.msg)));
  });
  */
  const App = shadowed(t1, (f) => ({
    addButton: anchor(f, "add")!,
    doubleContainer: anchor(f, "double")!,
    oddDisabledBtn: anchor(f, "odd-disabled")!,
  }))(({ user }: { user: string }, { addButton, oddDisabledBtn, doubleContainer }) => {
    const count = source(0);
    const double = query(() => count.val * 2);
    useCleanUp($text`${user} clicked ${count} times.`(appendChild(addButton)));
    useCleanUp($text`double of count: ${double}`(appendChild(doubleContainer)));
    const disabled = query(() => count.val % 2 === 1);
    useCleanUp($attr(oddDisabledBtn, "disabled", disabled));
    useBinding(addButton).event("click", () => {
      console.log("click!");
      count.set(count.val + 1);
    });
    const listItem = (text: string) => ({
      text: source(text),
    });
    const list = source([listItem("aaa"), listItem("bbb"), listItem("ccc")]);
    useChildView(
      <>
        <Show when={query(() => count.val % 2 === 0)}>{() => <div>mod 2 = 0</div>}</Show>
        <Show when={query(() => count.val % 3)} fallback={() => <div>mod 3 = 0</div>}>
          {(mod) => {
            console.log(`mod changed: ${mod}`);
            return (
              <div>
                mod 3 = 1 or 2
                <>
                  <div style={query(() => (count.val % 3 === 1 ? `color: red` : `color: blue`))}>fragment</div>
                  <div>supported</div>
                </>
              </div>
            );
          }}
        </Show>
        {/* 
        <Count>{{ "the-slot": <div>I'm the slot!</div> }}</Count> 
        */}
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
                        item.text.set(renameInput.current!.value);
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
                        const splitIndex = +moveIndexInput.current!.value;
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
        <svg version="1.1" width="300" height="200">
          <rect width="100%" height="100%" fill="red" />
          <circle cx="150" cy="100" r="80" fill="green" />
          <text x="150" y="125" font-size="60" text-anchor="middle" fill="white">
            SVG
          </text>
          <svg viewBox="0 0 20 10">
            <circle cx="5" cy="5" r="4">
              <title>I'm a circle</title>
            </circle>

            <rect x="11" y="1" width="8" height="8">
              <title>I'm a square</title>
            </rect>
          </svg>
        </svg>
        <p>
          The infinite sum
          <math display="block">
            <mrow>
              <munderover>
                <mo>∑</mo>
                <mrow>
                  <mi>n</mi>
                  <mo>=</mo>
                  <mn>1</mn>
                </mrow>
                <mrow>
                  <mo>+</mo>
                  <mn>∞</mn>
                </mrow>
              </munderover>
              <mfrac>
                <mn>1</mn>
                <msup>
                  <mi>n</mi>
                  <mn>2</mn>
                </msup>
              </mfrac>
            </mrow>
          </math>
          is equal to the real number
          <math display="inline">
            <mfrac>
              <msup>
                <mi>π</mi>
                <mn>2</mn>
              </msup>
              <mn>6</mn>
            </mfrac>
          </math>
          .
        </p>
      </>
    )(seqAfter(oddDisabledBtn));

    // Return the APIs you want to expose.
    return {
      setCount(cnt: number) {
        count.set(cnt);
      },
    };
  });
  const rendered = App({ user: "Darren", children: { world: World({}) } })(appendChild(app));
  const [, exposed] = rendered;
  const unbindRest = bindEvent(resetBtn)("click", () => {
    exposed.setCount(0);
  });
  const unbindUnmount = bindEvent(unmountBtn)("click", () => {
    console.log("unmount!");
    unmount(rendered);
    unbindUnmount();
    unbindRest();
  });
}

main();
