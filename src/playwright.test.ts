import { assert, layer } from "@effect/vitest";
import { Playwright } from "@jobflow/effect-playwright";
import { Effect } from "effect";
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
          executablePath: "sleep",
          args: ["10"],
        })
        .pipe(Effect.flip);
      assert(
        result._tag === "PlaywrightError",
        "Expected failure with timeout 0",
      );

      assert(result.reason === "Timeout", "Expected timeout");
    }),
  );
});
