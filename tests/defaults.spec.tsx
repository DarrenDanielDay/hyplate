import { isSubscribable, resetBinding } from "../dist/binding";
import { attr } from "../dist/core";
import { Attribute, AutoRender, useAutoRun } from "../dist/defaults";
import { nil } from "../dist/directive";
import { HyplateElement, Component } from "../dist/elements";
import { mount, unmount } from "../dist/jsx-runtime";
import { effect, isSignal, signal } from "../dist/signals";
import type { AttachFunc, FC, Mountable, Rendered, Signal } from "../dist/types";
import { useDocumentClear } from "./test-util";
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
  it("should auto run and subscribe effect", () => {
    const count = signal(0);
    const fn = import.meta.jest.fn();
    @Component({
      tag: "test-auto-run",
    })
    class TestAutoRun extends HyplateElement {
      override render(): Mountable<any> {
        this.autorun(() => {
          fn(count());
        });
        return nil;
      }
    }
    document.body.appendChild(new TestAutoRun());
    expect(fn).toBeCalledWith(0);
    count.set(1);
    expect(fn).toBeCalledWith(1);
    count.set(2);
    expect(fn).toBeCalledWith(2);
  });
  describe("attribute decorator", () => {
    useDocumentClear();
    it("should return signal of attribute changes", () => {
      @Component({ tag: "test-attribute-decorator" })
      class TestAttribute extends HyplateElement<{ message: string; count: number }> {
        @Attribute("message")
        accessor msg!: Signal<string | null>;
        @Attribute("not-in-props")
        accessor notInProps!: Signal<string | null>;
        @Attribute("count", Number)
        count!: Signal<number | null>;
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
  describe("useAutoRun", () => {
    useDocumentClear();
    it("should call `useEffect`", () => {
      expect(document.body.innerHTML).toBe("");
      const mockCleanUp = import.meta.jest.fn();
      const mockEffectCallback = import.meta.jest.fn(() => {
        expect(document.body.innerHTML).toBe("<div></div>");
        return mockCleanUp;
      });
      const Component: FC = () => {
        useAutoRun(mockEffectCallback);
        return <div></div>;
      };
      expect(mockEffectCallback).toBeCalledTimes(0);
      const rendered = mount(<Component />, document.body);
      expect(mockCleanUp).toBeCalledTimes(0);
      expect(mockEffectCallback).toBeCalledTimes(1);
      unmount(rendered);
      expect(mockCleanUp).toBeCalledTimes(1);
    });
  });
  describe("AutoRender", () => {
    useDocumentClear();
    it("should auto render when deps update", () => {
      const count = signal(0);
      const rendered = mount(
        <AutoRender>
          {() => {
            return <div>{count()}</div>;
          }}
        </AutoRender>,
        document.body
      );
      expect(document.body.firstElementChild!.outerHTML).toBe("<div>0</div>");
      count.set(1);
      expect(document.body.firstElementChild!.outerHTML).toBe("<div>1</div>");
      count.set(2);
      expect(document.body.firstElementChild!.outerHTML).toBe("<div>2</div>");
      unmount(rendered);
    });
  });
});
