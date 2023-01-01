import { bindText, interpolation } from "hyplate/binding";
import { appendChild } from "hyplate/core";
import { useCleanUp, useEvent } from "hyplate/hooks";
import { computed, makeAutoObservable } from "mobx";

import { counterTemplate } from "./counter.template.js";

interface CounterProps {
  name: string;
}

class CounterState {
  constructor() {
    makeAutoObservable(this);
  }
  count = 0;
  get doubleCount() {
    return this.count * 2;
  }
  addCount() {
    this.count++;
  }
  resetCount() {
    this.count = 0;
  }
}

export const Counter = counterTemplate(({ name }: CounterProps, ctx) => {
  const state = new CounterState();

  useEvent(ctx.refs.btn)("click", () => {
    state.addCount();
  });

  const unbindText = interpolation`${name} clicked ${computed(() => state.count)} times.`(
    appendChild(ctx.refs.countMsg)
  );
  useCleanUp(unbindText);

  const unbindDoubleText = bindText(
    ctx.refs.doubleMsg,
    computed(() => `The double of count is ${state.doubleCount}`)
  );
  useCleanUp(unbindDoubleText);

  return {
    clearCount() {
      state.resetCount();
    },
  };
}, "my-counter");
