import { test as base } from "@playwright/test";
import { Data, Effect } from "effect";
import {
  PlaywrightBrowser,
  PlaywrightBrowserContext,
  PlaywrightPage,
} from "effect-playwright";
import { expect, makeMethods, test } from "effect-playwright/test";

class ExpectedTestError extends Data.TaggedError("ExpectedTestError") {}

test("runs an ordinary Promise-style test", async ({ page }) => {
  await page.goto("data:text/html,<title>Promise</title>");
  await expect(page).toHaveTitle("Promise");
});

test.effect("uses the Playwright services", () =>
  Effect.gen(function* () {
    const page = yield* PlaywrightPage;
    const context = yield* PlaywrightBrowserContext;
    const browser = yield* PlaywrightBrowser;

    yield* page.goto("data:text/html,<title>Effect Playwright</title>");
    expect(yield* page.title).toBe("Effect Playwright");
    expect(context.pages()).toHaveLength(1);
    expect(browser.contexts()).toHaveLength(1);
  }),
);

const customTest = makeMethods(
  base.extend<{ value: string }>({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring.
    value: async ({}, use) => use("custom fixture"),
  }),
);

customTest.effect("uses a custom fixture", ({ value }) =>
  Effect.sync(() => expect(value).toBe("custom fixture")),
);

test.effect("supports test details", { tag: "@effect" }, () => Effect.void);

test("exposes every Effect modifier", async () => {
  expect(typeof test.effect.only).toBe("function");
  expect(typeof test.effect.skip).toBe("function");
  expect(typeof test.effect.fixme).toBe("function");
  expect(typeof test.effect.fail).toBe("function");
  expect(typeof test.effect.fail.only).toBe("function");
});

test.effect.skip("supports skipped Effect tests", () => Effect.void);
test.effect.fixme("supports Effect fixme tests", () => Effect.void);
test.effect.fail(
  "supports expected Effect failures",
  () => new ExpectedTestError(),
);
