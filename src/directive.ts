import { warn } from "./util.js";
import { subscribe } from "./store.js";
import type { AttachFunc, CleanUpFunc, FunctionalComponent, JSXChildNode, Mountable, Props, Query } from "./types.js";
import { noop } from "./util.js";
import { withComments } from "./internal.js";
import { before } from "./core.js";

const createIfDirective = (
  condition: Query<boolean>,
  trueResult: Mountable<any>,
  falseResult?: Mountable<any>
): Mountable<void> => {
  return (attach) => {
    const [clearCommentRange, [begin, end, clear]] = withComments("if/show directive");
    attach(begin);
    attach(end);
    const attachContent: AttachFunc = (node) => before(end)(node);
    let firstRendered = false;
    let lastValue = condition.val;
    let lastAttached: CleanUpFunc | null = null;
    const unsubscribe = subscribe(condition, (show) => {
      if (firstRendered && lastValue === show) {
        return;
      }
      if (!firstRendered) {
        firstRendered = true;
      }
      lastValue = show;
      lastAttached?.();
      clear();
      if (show) {
        [lastAttached] = trueResult(attachContent);
      } else {
        [lastAttached] = falseResult?.(attachContent) ?? [null];
      }
    });
    return [
      () => {
        unsubscribe();
        lastAttached?.();
        clearCommentRange();
      },
      undefined,
    ];
  };
};
const nil: Mountable<void> = () => [noop, void 0];

export const If: FunctionalComponent<
  { condition: Query<boolean> },
  { then: Mountable<any>; else?: Mountable<any> }
> = ({ condition, children }) => {
  if (!children) {
    return warn("Invalid usage of 'If'. Must provide children.", nil);
  }
  return createIfDirective(condition, children.then, children.else);
};

export const Show: FunctionalComponent<{ when: Query<boolean>; fallback?: Mountable<any> }, Mountable<any>> = ({
  when,
  children,
  fallback,
}) => {
  if (!children) {
    return warn("Invalid usage of 'Show'. Must provide children.", nil);
  }
  return createIfDirective(when, children, fallback);
};
export const For = <T extends unknown>({}: Props<{ of: Iterable<T> }, JSXChildNode>) => {};
