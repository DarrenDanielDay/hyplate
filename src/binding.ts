import { attr, remove, text } from "./core.js";
import type {
  AttachFunc,
  AttributeInterpolation,
  AttributesMap,
  BindingPattern,
  CleanUpFunc,
  Subscribable,
  SubscribableTester,
  SubscribeFunc,
  TextInterpolation,
} from "./types.js";
import { applyAll, err, isObject, noop, push, warn, __DEV__ } from "./util.js";

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

export const configureBinding: (subscribe: SubscribeFunc, isSubscribable: SubscribableTester) => void = (
  sub,
  canSub
) => {
  subscribe = sub;
  isSubscribable = canSub;
};

export const resetBinding = () => {
  subscribe = defaultSubscribe;
  isSubscribable = defaultIsSubscribable;
};

export const bindText = (node: Node, subscribable: Subscribable<TextInterpolation>) =>
  subscribe(subscribable, (content) => text(node, content));

export const interpolation = (
  fragments: TemplateStringsArray,
  ...bindings: (BindingPattern<TextInterpolation>)[]
) => {
  const fragmentsLength = fragments.length;
  const bindingsLength = bindings.length;
  if (__DEV__) {
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
        const textNode = new Text(textContent);
        push(effects, () => remove(textNode));
        attach(textNode);
      }
      buf.length = 0;
    };
    for (let i = 0; i < bindingsLength; i++) {
      push(buf, fragments[i]!);
      const expression = bindings[i]!;
      if (isSubscribable(expression)) {
        flushBuf();
        const dynamicText = new Text();
        push(effects, bindText(dynamicText, expression));
        push(effects, () => remove(dynamicText));
        attach(dynamicText);
      } else {
        push(buf, `${expression}`);
      }
    }
    push(buf, fragments.at(-1)!);
    flushBuf();
    return applyAll(effects);
  };
};

export const bindAttr: {
  <E extends Element, P extends keyof AttributesMap<E>>(
    el: E,
    name: P,
    subscribable: Subscribable<AttributesMap<E>[P]>
  ): CleanUpFunc;
  (el: Element, name: string, subscribable: Subscribable<AttributeInterpolation>): CleanUpFunc;
} = (el: Element, name: string, subscribable: Subscribable<AttributeInterpolation>) =>
  subscribe(subscribable, (attribute) => attr(el, name, attribute));
