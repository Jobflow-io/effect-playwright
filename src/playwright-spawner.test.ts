import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { Playwright, PlaywrightSpawner } from "effect-playwright";
import { chromium } from "playwright-core";

const accessFirst = Effect.gen(function* () {
  const browser = yield* Playwright.Browser;

  assert(browser, "Expected browser");

  const contexts = browser.contexts();

  assert(contexts.length > 0, "Expected contexts");

  const first = contexts[0];
  assert(first, "Expected first context");

  const pages = first.pages();
  assert(pages.length > 0, "Expected pages");

  // append ?test=1 to the first page
  yield* pages[0].goto("about:blank?test=1");
});

const accessSecond = Effect.gen(function* () {
  const browser = yield* Playwright.Browser;

  assert(browser, "Expected browser");

  const contexts = browser.contexts();

  assert(contexts.length > 0, "Expected contexts");

  const first = contexts[0];
  assert(first, "Expected first context");

  const pages = first.pages();
  assert(pages.length > 0, "Expected pages");

  // page should have ?test=1
  const page = pages[0];
  const url = page.url();
  assert(url.includes("?test=1"), "Expected ?test=1");
});

layer(PlaywrightSpawner.layer(chromium))("PlaywrightSpawner", (it) => {
  it.effect("should launch a browser", () =>
    Effect.gen(function* () {
      const program = Effect.gen(function* () {
        const spawner: PlaywrightSpawner.PlaywrightSpawner =
          yield* PlaywrightSpawner.PlaywrightSpawner;
        const browser = yield* spawner.browser;

        yield* browser.newPage({ baseURL: "about:blank" });
      });
      const result = yield* Effect.exit(program);

      assert(result._tag === "Success", "Expected success");
    }),
  );

  it.effect("withBrowser helper should work", () =>
    Effect.gen(function* () {
      const browser = yield* Playwright.Browser;

      yield* browser.newPage({ baseURL: "about:blank" });
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("withBrowser allows shared use", () =>
    Effect.gen(function* () {
      const browser = yield* Playwright.Browser;

      yield* browser.newPage({ baseURL: "about:blank" });

      yield* accessFirst;
      yield* accessSecond;
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("withBrowser imperative use", () =>
    PlaywrightSpawner.withBrowser(
      Effect.gen(function* () {
        const browser = yield* Playwright.Browser;

        yield* browser.newPage({ baseURL: "about:blank" });
      }),
    ),
  );

  it.effect("withBrowser scope cleanup", () =>
    Effect.gen(function* () {
      let capturedBrowser: Playwright.Browser | undefined;

      yield* PlaywrightSpawner.withBrowser(
        Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          capturedBrowser = browser;

          yield* browser.newPage({ baseURL: "about:blank" });

          yield* accessFirst;
          yield* accessSecond;
        }),
      );

      assert(capturedBrowser, "Expected browser");
      const contexts = capturedBrowser.contexts();
      assert(contexts.length === 0, "Expected no contexts");

      // actually not connected anymore
      assert(capturedBrowser.isConnected() === false, "Expected not connected");
    }),
  );
});
