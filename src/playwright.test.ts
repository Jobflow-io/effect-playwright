import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { Playwright } from "effect-playwright";
import { chromium } from "playwright-core";

layer(Playwright.layer)("Playwright", (it) => {
  it.scoped("should launch a browser", () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const playwright = yield* Playwright;
        const browser = yield* playwright.launchScoped(chromium);

        yield* browser.newPage({ baseURL: "about:blank" });
      });
      const result = yield* Effect.exit(program);

      assert(result._tag === "Success", "Expected success");
    }),
  );

  it.scoped("should launch and run some commands", () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const playwright = yield* Playwright;
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

  it.scoped("should fail to launch a browser with invalid path", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright;
      const result = yield* playwright
        .launchScoped(chromium, {
          executablePath: "/invalid/path",
        })
        .pipe(Effect.flip);
      assert(
        result._tag === "PlaywrightError",
        "Expected failure with invalid path",
      );
    }),
  );

  it.scoped("should fail with timeout 1", () =>
    Effect.gen(function* () {
      const playwright = yield* Playwright;
      const result = yield* playwright
        .launchScoped(chromium, {
          timeout: 1,
          executablePath: "/bin/cat",
        })
        .pipe(Effect.flip);
      assert(
        result._tag === "PlaywrightError",
        "Expected failure with timeout 0",
      );
      assert(result.reason === "Timeout", "Expected reason to be timeout");
    }),
  );

  it.scoped(
    "should connect via CDP",
    Effect.fn(function* () {
      const playwright = yield* Playwright;

      // 1. Launch a browser that exposes CDP
      yield* playwright.launchScoped(chromium, {
        args: [
          "--remote-debugging-port=9222",
          "--remote-debugging-address=127.0.0.1",
        ],
      });

      // 2. Connect to it via CDP
      const browser = yield* playwright.connectCDP("http://127.0.0.1:9222");

      // 3. Cleanup connection (doesn't close the browser itself, but closes the CDP connection)
      yield* Effect.addFinalizer(() => browser.close.pipe(Effect.ignore));

      const page = yield* browser.newPage();
      const content = yield* page.evaluate(() => "cdp works");
      assert(content === "cdp works", "Expected content to be cdp works");
    }),
  );

  it.scoped(
    "should connect via CDP (confirm browser.close only closes CDP connection)",
    Effect.fn(function* () {
      const playwright = yield* Playwright;

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
        (yield* directBrowser.isConnected) === true,
        "Expected browser to be connected",
      );

      const page = yield* directBrowser.newPage();
      const content = yield* page.evaluate(() => "cdp works");
      assert(content === "cdp works", "Expected content to be cdp works");
    }),
  );

  it.scoped(
    "should connect via CDP and close automatically with scope",
    Effect.fn(function* () {
      const playwright = yield* Playwright;

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
        const isConnected = yield* browser.isConnected;
        assert(isConnected === true, "Expected connected true");
      }).pipe(Effect.scoped);

      // 3. After scope, connection should be closed
      // We can't easily check the CDP browser object as it's out of scope
      // but we can check if the direct browser is still connected
      assert(
        (yield* directBrowser.isConnected) === true,
        "Expected browser to still be connected",
      );

      const page = yield* directBrowser.newPage();
      const content = yield* page.evaluate(() => "cdp works after cdp closed");
      assert(
        content === "cdp works after cdp closed",
        "Expected content to be correct",
      );
    }),
  );
});
