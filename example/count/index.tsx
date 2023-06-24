import { computed, mount, signal, useAutoRun } from "hyplate";
import type { FC } from "hyplate/types";

const App: FC<{ msg: string }> = ({ msg }) => {
  const count = signal(0);
  const doubleCount = computed(() => count() * 2);
  console.log("This function will only be executed once on `App` attach.");
  const addCount = () => {
    count.update((count) => count + 1);
  };
  useAutoRun(() => {
    console.log(`Executed automatically when "count" updated. Current count = ${count()}`);
  });
  return (
    <div class="app">
      <link rel="stylesheet" href="./index.css"></link>
      <img src="./logo.svg" class="logo"></img>
      <div>Hello, {msg}!</div>
      <button onClick={addCount}>add count</button>
      <div>Count = {count}</div>
      <div>Double of count is {doubleCount}.</div>
      <div>Two-way binding to input:</div>
      <div>
        <input type="number" h-model:number={count}></input>
      </div>
    </div>
  );
};

mount(<App msg="hyplate"></App>, document.body);
