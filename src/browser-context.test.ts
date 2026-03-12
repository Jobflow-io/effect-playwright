import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

type TestWindow = Window & {
  magicValue?: number;
};

layer(PlaywrightEnvironment.layer(chromium))(
  "PlaywrightBrowserContext",
  (it) => {
    it.scoped("should wrap context methods", () =>
      Effect.gen(function* () {
        const browser = yield* PlaywrightBrowser;
        const context = yield* browser.newContext();

        // Test browser()
        const contextBrowser = context.browser();
        assert.isTrue(Option.isSome(contextBrowser));

        // Test cookies/addCookies/clearCookies
        yield* context.addCookies([
          {
            name: "test-cookie",
            value: "test-value",
            url: "https://example.com",
          },
        ]);
        const cookies = yield* context.cookies(["https://example.com"]);
        assert.strictEqual(cookies.length, 1);
        assert.strictEqual(cookies[0].name, "test-cookie");

        yield* context.clearCookies();
        const cookiesAfterClear = yield* context.cookies([
          "https://example.com",
        ]);
        assert.strictEqual(cookiesAfterClear.length, 0);

        // Test grantPermissions/clearPermissions
        yield* context.grantPermissions(["notifications"]);
        yield* context.clearPermissions;

        // Test setters
        context.setDefaultNavigationTimeout(30000);
        context.setDefaultTimeout(30000);
        yield* context.setExtraHTTPHeaders({ "X-Test": "test" });
        yield* context.setGeolocation({ latitude: 52, longitude: 13 });
        yield* context.setOffline(false);
      }).pipe(PlaywrightEnvironment.withBrowser),
    );

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
