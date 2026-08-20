import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { Playwright } from "effect-playwright";
import { chromium } from "playwright-core";
import type { BrowserContext } from "./browser-context";

layer(Playwright.layer)("Playwright", (it) => {
  it.scoped("should launch a browser", () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const playwright: Playwright.Playwright = yield* Playwright.Playwright;
        const launchOptions: Playwright.LaunchOptions = { headless: true };
        const browser: Playwright.Browser = yield* playwright.launchScoped(
          chromium,
          launchOptions,
        );

        const contextOptions: Playwright.NewContextOptions = {};
        const context: Playwright.BrowserContext =
          yield* browser.newContext(contextOptions);

        const pageOptions: Playwright.NewPageOptions = {};
        const page: Playwright.Page = yield* browser.newPage(pageOptions);
        const clock: Playwright.Clock = page.clock;
        const credentials: Playwright.Credentials = context.credentials;
        const frame: Playwright.Frame = page.mainFrame();
        const keyboard: Playwright.Keyboard = page.keyboard;
        const locator: Playwright.Locator = page.locator("body");
        const frameLocator: Playwright.FrameLocator =
          locator.frameLocator("iframe");
        const mouse: Playwright.Mouse = page.mouse;
        const screencast: Playwright.Screencast = page.screencast;
        const touchscreen: Playwright.Touchscreen = page.touchscreen;
        const tracing: Playwright.Tracing = context.tracing;
        const storage: Playwright.WebStorage = page.localStorage;

        yield* page.setContent("testing");

        for (const service of [
          clock,
          credentials,
          frame,
          frameLocator,
          keyboard,
          locator,
          mouse,
          screencast,
          storage,
          touchscreen,
          tracing,
        ]) {
          assert.isDefined(service);
        }

        for (const constructor of [
          Playwright.makeBrowser,
          Playwright.makeBrowserContext,
          Playwright.makeClock,
          Playwright.makeCredentials,
          Playwright.makeFrame,
          Playwright.makeFrameLocator,
          Playwright.makeKeyboard,
          Playwright.makeLocator,
          Playwright.makeMouse,
          Playwright.makePage,
          Playwright.makeScreencast,
          Playwright.makeTouchscreen,
          Playwright.makeTracing,
          Playwright.makeWebStorage,
        ]) {
          assert.strictEqual(typeof constructor, "function");
        }
      }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
      const result = yield* Effect.exit(program);

      assert(result._tag === "Success", "Expected success");
    }),
  );

  it.scoped("should launch and run some commands", () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const playwright = yield* Playwright.Playwright;
        const browser = yield* playwright.launchScoped(chromium);

        const page = yield* browser.newPage({ baseURL: "about:blank" });

        const addition = yield* page.evaluate(() => {
          return 1 + 1;
        });

        assert(addition === 2, "Expected addition to be 2");
      });
      const result = yield* Effect.exit(program);

      assert(result._tag === "Success", "Expected success");
    }),
  );

  it.scoped("should launch a persistent context", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright.Playwright;
      const context = yield* playwright.launchPersistentContext(chromium, "");
      const page = yield* context.newPage;

      yield* page.goto("data:text/html,<title>persistent-context</title>");
      const title = yield* page.title;

      assert(title === "persistent-context", "Expected title to match");
      yield* context.close;
    }),
  );

  it.scoped("should launch a persistent context and close with scope", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright.Playwright;
      let capturedContext: BrowserContext | undefined;

      yield* Effect.gen(function* () {
        const context = yield* playwright.launchPersistentContextScoped(
          chromium,
          "",
        );
        capturedContext = context;

        const page = yield* context.newPage;
        const content = yield* page.evaluate(() => "scoped-persistent");
        assert(content === "scoped-persistent", "Expected content to match");
      }).pipe(Effect.scoped);

      assert(capturedContext !== undefined, "Expected captured context");
      const error = yield* capturedContext.newPage.pipe(Effect.flip);
      assert(
        error._tag === "effect-playwright/errors/PlaywrightError",
        "Expected failure after scoped close",
      );
    }),
  );

  it.scoped("should fail to launch a browser with invalid path", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright.Playwright;
      const result: Playwright.PlaywrightError = yield* playwright
        .launchScoped(chromium, {
          executablePath: "/invalid/path",
        })
        .pipe(Effect.flip);
      assert(
        result._tag === "effect-playwright/errors/PlaywrightError",
        "Expected failure with invalid path",
      );
    }),
  );

  it.scoped("should fail with timeout 1", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright.Playwright;
      const result = yield* playwright
        .launchScoped(chromium, {
          timeout: 1,
          executablePath: "/bin/cat",
        })
        .pipe(Effect.flip);
      assert(
        result._tag === "effect-playwright/errors/PlaywrightError",
        "Expected failure with timeout 0",
      );
      assert(result.reason === "Timeout", "Expected reason to be timeout");
    }),
  );

  it.scoped(
    "should connect via CDP (confirm browser.close only closes CDP connection)",
    Effect.fn(function* () {
      const playwright = yield* Playwright.Playwright;

      // 1. Launch a browser that exposes CDP
      const directBrowser = yield* playwright.launchScoped(chromium, {
        args: [
          "--remote-debugging-port=9222",
          "--remote-debugging-address=127.0.0.1",
        ],
      });

      // 2. Connect to it via CDP
      const browser = yield* playwright.connectCDP("http://127.0.0.1:9222");

      // 3. Cleanup connection now
      yield* browser.close;

      assert(
        directBrowser.isConnected() === true,
        "Expected direct browser to be still connected",
      );

      const page = yield* directBrowser.newPage();
      const content = yield* page.evaluate(() => "eval works");
      assert(content === "eval works", "Expected content to be eval works");
    }),
  );

  it.scoped(
    "should connect via CDP and close automatically with scope",
    Effect.fn(function* () {
      const playwright = yield* Playwright.Playwright;

      // 1. Launch a browser that exposes CDP
      const directBrowser = yield* playwright.launchScoped(chromium, {
        args: [
          "--remote-debugging-port=9223",
          "--remote-debugging-address=127.0.0.1",
        ],
      });

      // 2. Connect to it via CDP using connectCDPScoped
      yield* Effect.gen(function* () {
        const browser = yield* playwright.connectCDPScoped(
          "http://127.0.0.1:9223",
        );
        const isConnected = browser.isConnected();
        assert(isConnected === true, "Expected connected true");
      }).pipe(Effect.scoped);

      // 3. After scope, connection should be closed
      // We can't easily check the CDP browser object as it's out of scope
      // but we can check if the direct browser is still connected
      assert(
        directBrowser.isConnected() === true,
        "Expected browser to still be connected",
      );

      const page = yield* directBrowser.newPage();
      const content = yield* page.evaluate(() => "eval after cdp closed");
      assert(
        content === "eval after cdp closed",
        "Expected content to be correct",
      );
    }),
  );
});
