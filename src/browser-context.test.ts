import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

type TestWindow = Window & {
  magicValue?: number;
};

layer(PlaywrightEnvironment.layer(chromium))(
  "PlaywrightBrowserContext",
  (it) => {
    it.scoped("addInitScript should execute script in all new pages", () =>
      Effect.gen(function* () {
        const browser = yield* PlaywrightBrowser;
        const context = yield* browser.newContext();

        yield* context.addInitScript(() => {
          (window as TestWindow).magicValue = 84;
        });

        const page1 = yield* context.newPage;
        yield* page1.goto("about:blank");
        const magicValue1 = yield* page1.evaluate(
          () => (window as TestWindow).magicValue,
        );
        assert.strictEqual(magicValue1, 84);

        const page2 = yield* context.newPage;
        yield* page2.goto("about:blank");
        const magicValue2 = yield* page2.evaluate(
          () => (window as TestWindow).magicValue,
        );
        assert.strictEqual(magicValue2, 84);
      }).pipe(PlaywrightEnvironment.withBrowser),
    );
  },
);
