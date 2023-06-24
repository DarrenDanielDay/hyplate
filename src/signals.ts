/**
 * @license hyplate
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { applyAll, compare, __DEV__, isInstance, isFunction, noop } from "./util.js";
import type {
  CleanUpFunc,
  Comparator,
  ObjectEventHandler,
  Signal,
  WritableSignal,
  Subscriber,
  WritableSignalMembers,
  SignalMembers,
  SignalGetter,
  DispatchFunc,
  Effect,
} from "./types.js";
import { scopes } from "./util.js";
import { configureBinding } from "./binding.js";
import { $$HyplateSignal, _listen } from "./internal.js";

const CE = CustomEvent;
const ET = EventTarget;
export const SIGNAL_DATA_EVENT = "hyplate-signal-data";

export const isSignal = (obj: unknown): obj is Signal<unknown> =>
  // @ts-expect-error unknown key access
  !!obj?.[$$HyplateSignal];

export const isWritableSignal = (obj: unknown): obj is WritableSignal<unknown> =>
  isSignal(obj) && obj.proto === WritableSignalImpl.prototype;

const createSignal = <T, M extends SignalMembers<T>>(members: M): M & SignalGetter<T> => {
  // @ts-expect-error mutated type
  const get: Partial<M & SignalGetter<T>> = members.get.bind(members);
  const proto = Object.getPrototypeOf(members);
  const descriptors = Object.getOwnPropertyDescriptors(proto);
  for (const method in descriptors) {
    if (method !== "constructor") {
      const { value } = descriptors[method];
      if (isFunction(value)) {
        // @ts-expect-error mutated type
        get[method] = value.bind(members);
      }
    }
  }
  Object.assign(get, members);
  get.proto = proto;
  // @ts-expect-error mutated type
  return get;
};

let defaultComparator: Comparator = compare;
/**
 * Set the default comparator when creating signals.
 * The default comparator is default to {@link Object.is}.
 */
export const setComparator = (comparator: Comparator | undefined | null) => {
  defaultComparator = comparator ?? compare;
};

export const enableBuiltinSignals = () => {
  configureBinding(watch, isSignal, write as DispatchFunc, isWritableSignal);
};

const [enterScope, quitScope, currentScope] = /* #__PURE__ */ scopes<Set<SignalMembers<any>>>();

const useDepScope = (): [Set<Signal<unknown>>, CleanUpFunc] => {
  const deps = new Set<Signal<unknown>>();
  enterScope(deps);
  return [deps, quitScope];
};

export class WritableSignalImpl<T extends unknown> implements WritableSignalMembers<T> {
  [$$HyplateSignal] = true;
  /**
   * The underlying value of writable signal.
   */
  #current: T;
  #comparator: Comparator;
  target = new ET();
  constructor(initValue: T, comparator: Comparator) {
    this.#current = initValue;
    this.#comparator = comparator;
  }
  get() {
    currentScope()?.add(this);
    return this.#current;
  }
  subscribe(subscriber: Subscriber<T>): CleanUpFunc {
    return _listen(this.target, SIGNAL_DATA_EVENT, subscription(subscriber));
  }
  set(newVal: T): void {
    const comparator = this.#comparator;
    if (comparator(this.#current, newVal)) {
      return;
    }
    this.#current = newVal;
    this.#dispatch();
  }
  mutate(mutation: (oldValue: T) => void): void {
    const value = this.#current;
    mutation(value);
    this.#dispatch();
  }
  update(reducer: (previous: T) => T): void {
    this.set(reducer(this.#current));
  }
  #dispatch() {
    dispatch(this, this.#current);
  }
}

/**
 * Create a {@link WritableSignal} with initial value.
 * @param init initial value
 * @param comparator optional comparator, default to configured default comparator of {@link setComparator}.
 * @returns a {@link WritableSignal}
 */
export const signal = <T extends unknown>(init: T, comparator: Comparator = defaultComparator): WritableSignal<T> => {
  return createSignal(new WritableSignalImpl(init, comparator));
};

/**
 * Execute subscriber with current signal value immediately, and then subscribe its changes and execute subscriber.
 * @param signal signal
 * @param subscriber callback
 * @returns unsubscribe function
 */
export const watch = <T extends unknown>(signal: Signal<T>, subscriber: Subscriber<T>): CleanUpFunc => {
  const unsubscribe = signal.subscribe(subscriber);
  subscriber(signal.get());
  return unsubscribe;
};

/**
 * Write value to a writable signal.
 * Just a convert of method call `signal.set(value)` to function call `write(signal, value)`.
 * @param signal writable signal
 * @param value new value
 */
export const write = <T extends unknown>(signal: WritableSignal<T>, value: T) => signal.set(value);

/**
 * Run `callback` immediately, subscribe to the signals used in `callback`.
 * Then re-run callback when new value of the signals comes.
 * If the `callback` returns a clean-up callback, it will be executed before the re-run and after the unsubscription.
 * @param callback callback with side effects, returns clean up callback or nothing
 * @returns unsubscribe function
 */
export const effect = (callback: Effect): CleanUpFunc => {
  let teardowns: CleanUpFunc[] = [];
  let userEffectCleanup: void | CleanUpFunc;
  const run = () => {
    applyAll(teardowns);
    userEffectCleanup?.();
    const [newDeps, cleanupDepScope] = useDepScope();
    userEffectCleanup = callback();
    cleanupDepScope();
    teardowns = [...newDeps].map((dep) => dep.subscribe(run));
  };
  run();
  return teardowns.length
    ? () => {
        applyAll(teardowns);
        userEffectCleanup?.();
      }
    : // @ts-expect-error cannot detect assign in callback
      userEffectCleanup ?? noop;
};

const dispatch = <T extends unknown>(signal: SignalMembers<T>, newVal: T) => {
  signal.target.dispatchEvent(
    new CE(SIGNAL_DATA_EVENT, {
      detail: newVal,
    })
  );
};

const isCustomEvent = isInstance(CE);

/**
 * Use class & object handler instead of function handlers
 * to reuse some event handling logic, prevent extra closures and save memory.
 */
class Subscription<T> implements ObjectEventHandler<Event> {
  #subscriber: Subscriber<T>;
  constructor(subscriber: Subscriber<T>) {
    this.#subscriber = subscriber;
  }
  handleEvent(event: Event): void {
    if (isCustomEvent(event) && event.type === SIGNAL_DATA_EVENT) {
      // @ts-expect-error skip generic type check
      (0, this.#subscriber)(event.detail);
    }
  }
}

const subscription = <T>(subscriber: Subscriber<T>): ObjectEventHandler<CustomEvent<T>> => new Subscription(subscriber);

export class ComputedSignalImpl<T extends unknown> implements SignalMembers<T> {
  [$$HyplateSignal] = true;
  /**
   * The user provided evaluator.
   * Should have no side effect, and we will invoke it only when necessary.
   */
  #evaluate: () => T;
  #comparator: Comparator;
  /**
   * Cached cpmputed value.
   */
  #current: T | null = null;
  /**
   * Whether the cached value is outdated.
   * `true` means we must invoke `evaluate` to get newest computed value.
   */
  #dirty = true;
  /**
   * Subscriptions of dependencies.
   */
  #subscriptions: CleanUpFunc[] = [];
  /**
   * Count of listeners.
   */
  #tracks = 0;
  target = new ET();
  constructor(evaluate: () => T, comparator: Comparator) {
    this.#evaluate = evaluate;
    this.#comparator = comparator;
  }
  get() {
    currentScope()?.add(this);
    if (!this.#dirty) {
      return this.#current!;
    }
    this.#dirty = false;
    applyAll(this.#subscriptions);
    const [newDeps, cleanupDepScope] = useDepScope();
    const selector = this.#evaluate;
    const newValue = (this.#current = selector());
    cleanupDepScope();
    this.#subscriptions = [...newDeps].map((dep) => dep.subscribe(this.#dispatch));
    return newValue;
  }
  subscribe(subscriber: Subscriber<T>): CleanUpFunc {
    this.#tracks++;
    const unsubscribe = _listen(this.target, SIGNAL_DATA_EVENT, subscription(subscriber));
    return () => {
      unsubscribe();
      this.#tracks--;
      if (!this.#tracks) {
        this.#reset();
      }
    };
  }
  /**
   * Dispatch changes lazily.
   * Using function property rather than method to save memory.
   */
  #dispatch = () => {
    this.#dirty = true;
    const last = this.#current;
    const latest = this.get();
    const comparator = this.#comparator;
    if (comparator(last, latest)) {
      return;
    }
    dispatch(this, latest);
  };
  /**
   * Reset the computed signal to initial state.
   */
  #reset() {
    applyAll(this.#subscriptions);
    // The selector must be evaluated.
    this.#dirty = true;
    this.#subscriptions = [];
    // Free the computed value.
    this.#current = null;
  }
}

/**
 * Create a readonly {@link Signal} with an evaluator function.
 * You can use other signals inside the evaluator function.
 * @param evaluate evaluator function
 * @param comparator optional comparator, default to configured default comparator of {@link setComparator}.
 * @returns a computed {@link Signal}
 */
export const computed = <T extends unknown>(
  evaluate: () => T,
  comparator: Comparator = defaultComparator
): Signal<T> => {
  return createSignal(new ComputedSignalImpl(evaluate, comparator));
};
