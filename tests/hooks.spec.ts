import { replaced } from "../dist/template";
import { useEffect, useChildView, useCleanUpCollector, useCleanUp } from "../dist/hooks";
import { after, appendChild } from "../dist/core";
import { noop } from "../dist/util";
import type { FC, Rendered } from "../dist/types";
import { useDocumentClear } from "./test-util";
import { jsx, mount, unmount } from "../dist/jsx-runtime";
import { nil } from "../dist/directive";
describe("hooks.ts", () => {
  describe("basic hooks", () => {
    useDocumentClear();
    it("should emit error when calling hooks outside setup", () => {
      expect(() => {
        useCleanUpCollector();
      }).toThrow(/invalid hook call/i);
    });
    /*
    // These APIs are deleted because of the concept changed.
    it("should return elements for shadowed", () => {
      const App = shadowed(``)(() => {
        const host = useHost();
        const customElement = document.body.firstElementChild!;
        expect(host).toBe(customElement.shadowRoot);
        const parent = useParent();
        expect(parent).toBe(customElement.parentElement);
      });
      const [cleanup] = App({})(appendChild(document.body));
      cleanup();
    });
    it("should return elements for replaced", () => {
      const App = replaced(``)(() => {
        const host = useHost();
        expect(host).toBe(document.body);
        const parent = useParent();
        expect(parent).toBe(document.body);
      });
      const [cleanup] = App({})(appendChild(document.body));
      cleanup();
    });
    //*/
    it("should call registered cleanup on component unmount", () => {
      const cleanupMock = import.meta.jest.fn();
      const App = replaced(``)(() => {
        useCleanUpCollector()(cleanupMock);
      });
      const [cleanup] = App({})(appendChild(document.body));
      cleanup();
      expect(cleanupMock).toBeCalledTimes(1);
    });
    describe("useAutoRun", () => {
      useDocumentClear();
      it("should emit error if it's not used in functional component scope", () => {
        expect(() => {
          useEffect(() => {});
        }).toThrow(/invalid/i);
      });
      it("should execute effect after mounted", () => {
        expect(document.body.innerHTML).toBe("");
        const mockCleanUp = import.meta.jest.fn();
        const mockEffectCallback = import.meta.jest.fn(() => {
          expect(document.body.innerHTML).toBe("<div></div>");
          return mockCleanUp;
        });
        const Component: FC = () => {
          useEffect(mockEffectCallback);
          return jsx("div");
        };
        expect(mockEffectCallback).toBeCalledTimes(0);
        const rendered = mount(jsx(Component), document.body);
        expect(mockCleanUp).toBeCalledTimes(0);
        expect(mockEffectCallback).toBeCalledTimes(1);
        unmount(rendered);
        expect(mockCleanUp).toBeCalledTimes(1);
      });
    });
  });
  describe("advanced hooks", () => {
    useDocumentClear();

    it("should create and destroy child view", () => {
      const childViewDestroy = import.meta.jest.fn();
      const childFactory = import.meta.jest.fn((): Rendered<void> => {
        return [childViewDestroy, undefined, noop];
      });
      const App = replaced(`<div><p #p1>1</p><p #p2></p></div>`, (f) => ({
        p2: f.querySelector("[\\#p2]")!,
      }))((_, { p2 }) => {
        useChildView(childFactory)(after(p2));
      });
      const [cleanup] = App({})(appendChild(document.body));
      expect(childFactory).toBeCalledTimes(1);
      expect(childViewDestroy).toBeCalledTimes(0);
      cleanup();
      expect(childViewDestroy).toBeCalledTimes(1);
    });
    /*
    // The `useEvent` is deleted because of the concept changed.
    it("should add event listener and remove it", () => {
      const handler = import.meta.jest.fn();
      const App = replaced(`<div>
      <button></button>
      </div>`)(() => {
        const button = useRef("button")!;
        useEvent(button)('click', handler);
        return {
          button,
        };
      });
      const [cleanup, {button}] = App({})(appendChild(document.body));
      button.click();
      expect(handler).toBeCalledTimes(1);
      button.click();
      expect(handler).toBeCalledTimes(2);
      cleanup();
      button.click();
      expect(handler).toBeCalledTimes(2);
    });
    //*/
  });
});
