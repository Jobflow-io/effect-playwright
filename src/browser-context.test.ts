import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { chromium } from "playwright-core";
import { Browser } from "./browser";
import { PlaywrightSpawner } from "./experimental";

type TestWindow = Window & {
  magicValue?: number;
};

layer(PlaywrightSpawner.layer(chromium))("BrowserContext", (it) => {
  it.scoped("should wrap context methods", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
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

      // Test storageState & setStorageState
      const state = yield* context.storageState();
      assert.isTrue(
        state.cookies.some(
          (c) => c.name === "test-cookie" && c.value === "test-value",
        ),
      );

      yield* context.clearCookies();
      const cookiesAfterClear = yield* context.cookies(["https://example.com"]);
      assert.strictEqual(cookiesAfterClear.length, 0);

      yield* context.setStorageState(state);
      const cookiesAfterRestore = yield* context.cookies([
        "https://example.com",
      ]);
      assert.strictEqual(cookiesAfterRestore.length, 1);
      assert.strictEqual(cookiesAfterRestore[0].name, "test-cookie");

      yield* context.clearCookies();

      // Test grantPermissions/clearPermissions
      yield* context.grantPermissions(["notifications"]);
      yield* context.clearPermissions;

      // Test setters
      context.setDefaultNavigationTimeout(30000);
      context.setDefaultTimeout(30000);
      yield* context.setExtraHTTPHeaders({ "X-Test": "test" });
      yield* context.setGeolocation({ latitude: 52, longitude: 13 });
      yield* context.setOffline(false);
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.scoped("addInitScript should execute script in all new pages", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const context = yield* browser.newContext();

      yield* context.addInitScript(
        async (double: (value: number) => Promise<number>) => {
          (window as TestWindow).magicValue = await double(42);
        },
        async (value: number) => value * 2,
        { exposeFunctions: true },
      );

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
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.scoped(
    "isClosed should return the closed state of the browser context",
    () =>
      Effect.gen(function* () {
        const browser = yield* Browser;
        const context = yield* browser.newContext();

        assert.strictEqual(context.isClosed(), false);

        yield* context.close;

        assert.strictEqual(context.isClosed(), true);
      }).pipe(PlaywrightSpawner.withBrowser),
  );
  it.scoped("credentials should create, get, and delete credentials", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const context = yield* browser.newContext();

      yield* context.credentials.install;

      const created = yield* context.credentials.create("example.test");
      assert.strictEqual(created.rpId, "example.test");

      const credentials = yield* context.credentials.get({
        id: created.id,
      });
      assert.strictEqual(credentials.length, 1);
      assert.deepStrictEqual(credentials[0], created);

      yield* context.credentials.delete(created.id);

      const afterDelete = yield* context.credentials.get({
        id: created.id,
      });
      assert.strictEqual(afterDelete.length, 0);
    }).pipe(PlaywrightSpawner.withBrowser),
  );
});
