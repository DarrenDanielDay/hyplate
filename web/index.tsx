import { replaced, shadowed } from "../dist/template.js";
/*
import count from "./components/count/count.template.js";
*/
import { useCleanUp, useChildView } from "../dist/hooks.js";
import { computed, effect, signal } from "../dist/signals.js";
import { For, Show } from "../dist/directive.js";
import { listen as bindEvent, appendChild, seqAfter, element, $, listen } from "../dist/core.js";
import { jsxRef, mount, unmount } from "../dist/jsx-runtime.js";
import { $attr, $text } from "../dist/binding.js";
import { useBinding } from "../dist/toolkit.js";
import type { LifecycleCallbacks, Signal } from "hyplate/types.js";
import { HyplateElement, CustomElement } from "../dist/elements.js";
import { Attribute } from "../dist/defaults.js";
@CustomElement({
  tag: "hyplate-counter-demo",
  shadowRootInit: {
    slotAssignment: "manual",
  },
  observedAttributes: ["id"],
  formAssociated: true,
})
class CountComponent
  extends HyplateElement<{ msg: string; id?: string; name?: string }, "insert-here">
  implements LifecycleCallbacks
{
  @Attribute("id")
  accessor id$: Signal<string | null>;
  @Attribute("name")
  accessor name$: Signal<string | null>;
  override connectedCallback() {
    super.connectedCallback();
    console.log("connected", arguments);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log("disconnected", arguments);
  }
  adoptedCallback(): void {
    console.log("adopted", arguments);
  }
  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    console.log("attribute changed", arguments);
  }
  count = signal(0);
  inputEl = element("input");
  public override render(): JSX.Element {
    return (
      <div>
        <p>Hello, class component! id = {this.id$}</p>
        <input ref={this.inputEl} class="foo"></input>
        <slot name={this.slots["insert-here"]}></slot>
        <button onClick={() => this.count.mutate((c) => c + 1)}>
          {this.props.msg} clicked {this.count}
        </button>
        <button on:click={() => this.testForm()}>test insert form data</button>
      </div>
    );
  }
  public testForm() {
    const internals = this.internals!;
    internals.setFormValue(this.inputEl.value);
    const fd = new FormData(internals.form!);
    alert(fd.get(this.name$()!));
  }
}
function main() {
  const container = element("form");
  const anchor = (frag: DocumentFragment, selector: string) => frag.querySelector(`[\\#${selector}]`);
  appendChild(document.body)(container);
  const r = jsxRef<CountComponent>();
  mount(
    <CountComponent msg="ohhhh" ref={r} attr:id="class-count" attr:name="the-name">
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
  console.log(r.current);
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
    const count = signal(0);
    const double = computed(() => count() * 2);
    useCleanUp($text`${user} clicked ${count} times.`(appendChild(addButton)));
    useCleanUp($text`double of count: ${double}`(appendChild(doubleContainer)));
    const disabled = computed(() => count() % 2 === 1);
    useCleanUp($attr(oddDisabledBtn, "disabled", disabled));
    useBinding(addButton).event("click", () => {
      console.log("click!");
      count.set(count() + 1);
    });
    const listItem = (text: string) => ({
      text: signal(text),
    });
    const list = signal([listItem("aaa"), listItem("bbb"), listItem("ccc")]);
    useChildView(
      <>
        <Show when={computed(() => count() % 2 === 0)}>{() => <div>mod 2 = 0</div>}</Show>
        <Show when={computed(() => count() % 3)} fallback={() => <div>mod 3 = 0</div>}>
          {(mod) => {
            console.log(`mod changed: ${mod}`);
            return (
              <div>
                mod 3 = 1 or 2
                <>
                  <div style={computed(() => (count() % 3 === 1 ? `color: red` : `color: blue`))}>fragment</div>
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
                        const originalList = list();
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
                          newList.map((it) => it.text())
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
                        const originalList = list();
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
                        list.set(list().filter((it) => it !== item));
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

const count = signal(0);
const double = computed(() => count() * 2);
const increase = () => count.update((c) => c + 1);
const unsubscribe1 = effect(() => {
  console.log(`exec effect 1 ${count()} ${double()}`);
});
const unsubscribe2 = effect(() => {
  console.log(`exec effect 2 ${double()}`);
});
const unsubscribe3 = effect(() => {
  console.log(`exec effect 3 ${count()}`);
});
increase();
increase();
// logs exec effect 1/2/3 3 times
unsubscribe1();
unsubscribe2();
unsubscribe3();
