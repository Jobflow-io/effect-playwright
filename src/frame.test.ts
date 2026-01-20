import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";
import { PlaywrightFrame } from "./frame";

layer(PlaywrightEnvironment.layer(chromium))("PlaywrightFrame", (it) => {
  it.scoped("should wrap frame methods", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Setup a page with an iframe
      yield* page.evaluate(() => {
        const iframe = document.createElement("iframe");
        iframe.name = "test-frame";
        iframe.srcdoc =
          "<html><head><title>Frame Title</title></head><body><div id='target'>Hello from Frame</div></body></html>";
        document.body.appendChild(iframe);
      });

      // Get the frame
      const frameService = yield* page.use(async (p) => {
        let frame = p.frames().find((f) => f.name() === "test-frame");
        if (!frame) {
          // Wait a bit if not found immediately (though srcdoc is sync-ish, iframe loading is async)
          await p.waitForLoadState("networkidle");
          frame = p.frames().find((f) => f.name() === "test-frame");
        }
        if (!frame) throw new Error("Frame not found");
        return PlaywrightFrame.make(frame);
      });

      // Test title
      const title = yield* frameService.title;
      assert.strictEqual(title, "Frame Title");

      // Test content
      const content = yield* frameService.content;
      assert.isTrue(content.includes("Hello from Frame"));

      // Test evaluate
      const result = yield* frameService.evaluate(() => 1 + 1);
      assert.strictEqual(result, 2);

      // Test locator
      const text = yield* frameService.locator("#target").textContent();
      assert.strictEqual(text, "Hello from Frame");

      // Test getByText
      const byText = yield* frameService.getByText("Hello from Frame").count;
      assert.strictEqual(byText, 1);

      // Test name
      const name = yield* frameService.name;
      assert.strictEqual(name, "test-frame");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
