import { test as base } from "@playwright/test";
import { Context, Data, Effect, Layer } from "effect";
import {
  PlaywrightBrowser,
  PlaywrightBrowserContext,
  PlaywrightPage,
} from "effect-playwright";
import { expect, layer, makeMethods, test } from "effect-playwright/test";

class ExpectedTestError extends Data.TaggedError("ExpectedTestError") {}

class SharedValue extends Context.Tag("SharedValue")<
  SharedValue,
  { readonly acquisition: number }
>() {}

class NestedValue extends Context.Tag("NestedValue")<NestedValue, number>() {}

class AnonymousValue extends Context.Tag("AnonymousValue")<
  AnonymousValue,
  string
>() {}

class CustomLayerValue extends Context.Tag("CustomLayerValue")<
  CustomLayerValue,
  string
>() {}

let sharedLayerAcquisitions = 0;
let sharedLayerReleases = 0;
let anonymousLayerAcquisitions = 0;
let anonymousLayerReleases = 0;

const sharedLayer = Layer.scoped(
  SharedValue,
  Effect.acquireRelease(
    Effect.sync(() => ({ acquisition: ++sharedLayerAcquisitions })),
    () =>
      Effect.sync(() => {
        sharedLayerReleases += 1;
      }),
  ),
);

const nestedLayer = Layer.effect(
  NestedValue,
  Effect.map(SharedValue, ({ acquisition }) => acquisition + 1),
);

const anonymousLayer = Layer.scoped(
  AnonymousValue,
  Effect.acquireRelease(
    Effect.sync(() => {
      anonymousLayerAcquisitions += 1;
      return "anonymous";
    }),
    () =>
      Effect.sync(() => {
        anonymousLayerReleases += 1;
      }),
  ),
);

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

layer(sharedLayer)("shared Effect layer", (it) => {
  it.effect("provides the layer service", () =>
    Effect.gen(function* () {
      const value = yield* SharedValue;
      expect(value.acquisition).toBe(1);
    }),
  );

  it.scoped("reuses one layer acquisition", () =>
    Effect.gen(function* () {
      const value = yield* SharedValue;
      expect(value.acquisition).toBe(1);
      expect(sharedLayerAcquisitions).toBe(1);
    }),
  );

  it("preserves plain test source locations", ({ page }, testInfo) => {
    expect(page).toBeDefined();
    expect(testInfo.file).toMatch(/src[\\/]test\.spec\.ts$/);
  });

  it.layer(nestedLayer)("nested Effect layer", (nestedIt) => {
    nestedIt.effect("provides parent and nested services", () =>
      Effect.gen(function* () {
        expect((yield* SharedValue).acquisition).toBe(1);
        expect(yield* NestedValue).toBe(2);
      }),
    );
  });
});

test("releases a shared Effect layer", () => {
  expect(sharedLayerAcquisitions).toBe(1);
  expect(sharedLayerReleases).toBe(1);
});

layer(anonymousLayer)((it) => {
  it.effect("supports an anonymous layer block", () =>
    Effect.gen(function* () {
      expect(yield* AnonymousValue).toBe("anonymous");
    }),
  );
});

test("releases an anonymous Effect layer", () => {
  expect(anonymousLayerAcquisitions).toBe(1);
  expect(anonymousLayerReleases).toBe(1);
});

const customTest = makeMethods(
  base.extend<{ value: string }>({
    // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring.
    value: async ({}, use) => use("custom fixture"),
  }),
);

customTest.effect("uses a custom fixture", ({ value }) =>
  Effect.sync(() => expect(value).toBe("custom fixture")),
);

customTest.layer(Layer.succeed(CustomLayerValue, "custom layer"))(
  "custom test layer",
  (it) => {
    it.effect("combines custom fixtures and layer services", ({ value }) =>
      Effect.gen(function* () {
        expect(value).toBe("custom fixture");
        expect(yield* CustomLayerValue).toBe("custom layer");
      }),
    );
  },
);

test.effect("supports test details", { tag: "@effect" }, () => Effect.void);

test("exposes every Effect modifier", async () => {
  expect(typeof test.effect.only).toBe("function");
  expect(typeof test.effect.skip).toBe("function");
  expect(typeof test.effect.fixme).toBe("function");
  expect(typeof test.effect.fail).toBe("function");
  expect(typeof test.effect.fail.only).toBe("function");
  expect(typeof test.layer).toBe("function");
});

test.effect.skip("supports skipped Effect tests", () => Effect.void);
test.effect.fixme("supports Effect fixme tests", () => Effect.void);
test.effect.fail(
  "supports expected Effect failures",
  () => new ExpectedTestError(),
);
