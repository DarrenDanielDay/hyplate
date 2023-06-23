import { attr, content, text } from "./core.js";
import { _listen } from "./internal.js";
import type {
  AttachFunc,
  AttributeInterpolation,
  AttributesMap,
  BindingPattern,
  CleanUpFunc,
  DispatchFunc,
  InputModelMap,
  InputModelOptions,
  InputModelProperties,
  InputModelProperty,
  InputModelTypes,
  ModelOptions,
  ModelableElement,
  ObjectEventHandler,
  Subscribable,
  SubscribableTester,
  SubscribeFunc,
  TextInterpolation,
  WritableSubscribable,
  WritableTester,
} from "./types.js";
import { applyAllStatic, err, isObject, noop, push, warn, __DEV__, isInstance } from "./util.js";

const defaultSubscribe: SubscribeFunc = (subscribable, subscriber) => {
  if (__DEV__) {
    warn(`No "subscribe" function configured. No subscription will be created, and any bindings won't work.`);
    warn({ subscribable, subscriber });
  }
  return noop;
};

export let subscribe: SubscribeFunc = defaultSubscribe;

const defaultIsSubscribable = (value: unknown): value is Subscribable<unknown> => {
  if (__DEV__) {
    warn(`No "isSubscribable" function configured.`);
  }
  return isObject(value);
};
export let isSubscribable: SubscribableTester = defaultIsSubscribable;

const defaultDispatch: DispatchFunc = (writable, value) => {
  if (__DEV__) {
    warn(`No "dispatch" function configured. No new value will be dispatched, this is a noop.`);
    warn({ writable, value });
  }
};
export let dispatch = defaultDispatch;

const defaultIsWritable = (value: unknown): value is WritableSubscribable<unknown> => {
  if (__DEV__) {
    warn(`No "isWritable" function configured.`);
  }
  return isObject(value);
};

export let isWritable: WritableTester = defaultIsWritable;

export const configureBinding: (
  subscribe: SubscribeFunc,
  isSubscribable: SubscribableTester,
  dispatch: DispatchFunc,
  isWritable: WritableTester
) => void = (_subscribe, _isSubscribable, _dispatch, _isWritable) => {
  subscribe = _subscribe;
  isSubscribable = _isSubscribable;
  dispatch = _dispatch;
  isWritable = _isWritable;
};

export const resetBinding = () => {
  subscribe = defaultSubscribe;
  isSubscribable = defaultIsSubscribable;
  dispatch = defaultDispatch;
  isWritable = defaultIsWritable;
};

export const $content = (node: Node, subscribable: Subscribable<TextInterpolation>) =>
  subscribe(subscribable, (text) => content(node, text));

export const $text = (fragments: TemplateStringsArray, ...bindings: BindingPattern<TextInterpolation>[]) => {
  const bindingsLength = bindings.length;
  if (__DEV__) {
    const fragmentsLength = fragments.length;
    if (fragmentsLength !== bindingsLength + 1) {
      err(
        `Invalid usage of "text". Fragments length(${fragments.length}) and bindings length(${bindings.length}) do not match.`
      );
    }
    if (bindings.some((binding) => isObject(binding) && !isSubscribable(binding))) {
      err(`Invalid usage of "text". Object text child must be a subscribable.`);
    }
  }
  return (attach: AttachFunc): CleanUpFunc => {
    const effects: CleanUpFunc[] = [];
    const buf: string[] = [];
    const flushBuf = () => {
      const textContent = buf.join("");
      if (textContent) {
        const textNode = text(textContent);
        attach(textNode);
      }
      buf.length = 0;
    };
    for (let i = 0; i < bindingsLength; i++) {
      push(buf, fragments[i]!);
      const expression = bindings[i]!;
      if (isSubscribable(expression)) {
        flushBuf();
        const dynamicText = text("");
        push(
          effects,
          subscribe(expression, (value) => (dynamicText.data = `${value}`))
        );
        attach(dynamicText);
      } else {
        push(buf, `${expression}`);
      }
    }
    push(buf, fragments.at(-1)!);
    flushBuf();
    return applyAllStatic(effects);
  };
};

export const $attr: {
  <E extends Element, P extends keyof AttributesMap<E>>(
    el: E,
    name: P,
    subscribable: Subscribable<AttributesMap<E>[P]>
  ): CleanUpFunc;
  (el: Element, name: string, subscribable: Subscribable<AttributeInterpolation>): CleanUpFunc;
} = (el: Element, name: string, subscribable: Subscribable<AttributeInterpolation>) =>
  subscribe(subscribable, (attribute) => attr(el, name, attribute));

const isInput = isInstance(HTMLInputElement);

const propMap: InputModelProperties = {
  string: "value",
  boolean: "checked",
  number: "valueAsNumber",
  date: "valueAsDate",
};

const defaultInputModelOptions: InputModelOptions & ModelOptions = {
  as: "string",
  on: "input",
};

const defaultOtherModelOptions: ModelOptions = {
  on: "change",
};
const defaultModelProperty = "value";
class ModelSubscription<T> implements ObjectEventHandler<Event> {
  #source;
  #property;
  constructor(source: WritableSubscribable<T>, property: InputModelProperty | false) {
    this.#source = source;
    this.#property = property;
  }
  handleEvent(event: Event): void {
    const target = event.target;
    if (this.#property) {
      dispatch(this.#source, (target as HTMLInputElement)[this.#property] as T);
    } else {
      dispatch(this.#source, (target as ModelableElement<T>).value);
    }
  }
}

export const $model: {
  (input: HTMLInputElement, writable: WritableSubscribable<string>, options?: Partial<ModelOptions>): CleanUpFunc;
  <T extends keyof InputModelMap>(
    input: HTMLInputElement,
    writable: WritableSubscribable<InputModelMap[T][1]>,
    options: InputModelOptions<T> & Partial<ModelOptions>
  ): CleanUpFunc;
  <T>(el: ModelableElement<T>, writable: WritableSubscribable<T>, options?: Partial<ModelOptions>): CleanUpFunc;
} = (
  el: Element,
  writable: WritableSubscribable<InputModelTypes>,
  options?: Partial<InputModelOptions & ModelOptions>
): CleanUpFunc => {
  const usingInput = isInput(el);
  const resolvedOptions = usingInput
    ? {
        ...defaultInputModelOptions,
        ...options,
      }
    : {
        ...defaultOtherModelOptions,
        ...options,
      };
  const { as, on } = resolvedOptions;
  const property = usingInput ? propMap[as!] ?? defaultModelProperty : defaultModelProperty;
  const unsubscribeChange = subscribe(writable, (latest) => {
    // @ts-expect-error dynamic property setter
    el[property] = latest;
  });
  const unsubscribeEvent = _listen(el, on, new ModelSubscription(writable, usingInput && property));
  return () => {
    unsubscribeEvent();
    unsubscribeChange();
  };
};
