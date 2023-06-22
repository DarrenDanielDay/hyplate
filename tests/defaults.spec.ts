import { isSubscribable, resetBinding } from "../dist/binding";
import { attr } from "../dist/core";
import { Attribute } from "../dist/defaults";
import { nil } from "../dist/directive";
import { HyplateElement, Component } from "../dist/elements";
import { effect, isSignal, signal } from "../dist/signals";
import type { AttachFunc, Mountable, Rendered, Signal } from "../dist/types";
describe("defaults.ts", () => {
  afterAll(() => {
    resetBinding();
  });
  it("should enable builtin signal", () => {
    expect(isSignal).toBe(isSubscribable);
  });
  it("should auto mount and unmount", () => {
    const mounted = import.meta.jest.fn();
    const unmounted = import.meta.jest.fn();
    @Component({
      tag: "test-auto-mount",
    })
    class TestAutoMount extends HyplateElement {
      override render(): Mountable<any> {
        return nil;
      }
      override mount(attach?: AttachFunc | undefined): Rendered<this> {
        const rendered = super.mount(attach);
        mounted();
        return rendered;
      }
      override unmount(): void {
        super.unmount();
        unmounted();
      }
    }
    const instance = new TestAutoMount();
    document.body.appendChild(instance);
    document.body.removeChild(instance);
    expect(mounted).toBeCalledTimes(1);
    expect(unmounted).toBeCalledTimes(1);
  });
  describe("attribute decorator", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });
    afterEach(() => {
      document.body.innerHTML = "";
    });
    it("should return signal of attribute changes", () => {
      @Component({ tag: "test-attribute-decorator" })
      class TestAttribute extends HyplateElement<{ message: string; count: number }> {
        @Attribute("message")
        accessor msg!: Signal<string | null>;
        @Attribute("not-in-props")
        accessor notInProps!: Signal<string | null>;
        @Attribute("count", Number)
        accessor count!: Signal<number | null>;
        // @ts-expect-error typescript should emit error here
        @Attribute("countt", Number)
        accessor countt!: Signal<number | null>;
        render(): Mountable<any> {
          return nil;
        }
      }
      const instance = new TestAttribute();
      let times = 0;
      const fn = import.meta.jest.fn(() => {
        const msg = instance.msg();
        const count = instance.count();
        switch (times) {
          case 0:
            expect(msg).toBeNull();
            expect(count).toBeNull();
            break;
          case 1:
            expect(msg).toBe("hello world");
            expect(count).toBeNull();
            break;
          case 2:
            expect(msg).toBe("hello world");
            expect(count).toBe(0);
            break;
        }
        times++;
      });
      const cleanup = effect(fn);
      expect(fn).toBeCalledTimes(1);
      attr(instance, "message", "hello world");
      expect(fn).toBeCalledTimes(2);
      attr(instance, "count", "0");
      expect(fn).toBeCalledTimes(3);
      expect(() => {
        instance.msg = signal("");
      }).toThrow(/read-only/i);
      cleanup();
    });
  });
});
