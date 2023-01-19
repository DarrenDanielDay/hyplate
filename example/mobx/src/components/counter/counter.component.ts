import { useBinding } from "hyplate/toolkit";
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

export const Counter = counterTemplate(({ name }: CounterProps, { refs: { btn, countMsg, doubleMsg } }) => {
  const state = new CounterState();

  useBinding(btn).event("click", () => {
    state.addCount();
  });

  useBinding(countMsg).content`${name} clicked ${computed(() => state.count)} times.`;

  useBinding(doubleMsg).text(computed(() => `The double of count is ${state.doubleCount}`));

  return {
    clearCount() {
      state.resetCount();
    },
  };
}, "my-counter");
