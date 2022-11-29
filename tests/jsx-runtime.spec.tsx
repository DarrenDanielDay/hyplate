import { If, Show } from "../dist/directive";
import { source } from "../dist/store";
describe("jsx-runtime.ts", () => {
  describe("JSX syntax", () => {
    it("should work", () => {
      const msg = "world";
      const x = (
        <div data-x>
          <div>Hello, {msg} !</div>
          {
            <>
              <div>fragment el1</div>
              <div></div>
            </>
          }
        </div>
      );
      expect(x).toBeTruthy();
    });

    it("should work", () => {
      const condition = source(false);
      <If condition={condition}>
        {{
          then: <div>yes</div>,
          else: <div>no</div>,
        }}
      </If>;
      <Show when={condition} fallback={<div>no</div>}>
        <div>yes</div>
      </Show>;
    });
  });
});
export {};
