# effect-playwright

[![NPM Version](https://img.shields.io/npm/v/effect-playwright)](https://www.npmjs.com/package/effect-playwright)
[![GitHub License](https://img.shields.io/github/license/Jobflow-io/effect-playwright)](https://github.com/Jobflow-io/effect-playwright/blob/main/LICENSE)
[![Effect: yes](https://img.shields.io/badge/effect-yes-blue)](https://effect.website/)

A Playwright wrapper for the Effect ecosystem. This library provides a set of services and layers to interact with Playwright in a type-safe way using Effect.

> [!NOTE]
> This library is currently focused on using Playwright for **automation** and **scraping**. It does not provide a wrapper for `@playwright/test` (the test runner).

## Installation

```bash
pnpm add effect-playwright playwright-core
```

or

```bash
npm install effect-playwright playwright-core
```

You can also install `playwright` instead of `playwright-core` if you want the post-build auto install of the browsers.

## Quick Start

```ts
import { Playwright } from "effect-playwright";
import { Effect } from "effect";
import { chromium } from "playwright-core";

const program = Effect.gen(function* () {
  const playwright = yield* Playwright;
  const browser = yield* playwright.launchScoped(chromium);
  const page = yield* browser.newPage();

  yield* page.goto("https://example.com");
  const title = yield* page.title;
  console.log(`Page title: ${title}`);
}).pipe(Effect.scoped, Effect.provide(Playwright.layer));

await Effect.runPromise(program);
```

## Managing Lifecycle

Using `launchScoped` is the recommended way to manage the browser lifecycle. It ensures that the browser is closed automatically when the effect's scope ends, preventing resource leaks.

```ts
const program = Effect.gen(function* () {
  const playwright = yield* Playwright;
  const browser = yield* playwright.launchScoped(chromium);
  // Browser will be closed automatically after this block
}).pipe(Effect.scoped);
```

## PlaywrightEnvironment (Experimental)

The `PlaywrightEnvironment` simplifies setup by allowing you to configure the browser type and launch options once and reuse them across your application.

### Usage

```ts
import { PlaywrightBrowser } from "effect-playwright";
import { PlaywrightEnvironment } from "effect-playwright/experimental";
import { Effect } from "effect";
import { chromium } from "playwright-core";

const liveLayer = PlaywrightEnvironment.layer(chromium, {
  headless: true /** any other launch options */,
});

const program = Effect.gen(function* () {
  const browser = yield* PlaywrightBrowser;
  const page = yield* browser.newPage();

  yield* page.goto("https://example.com");
}).pipe(PlaywrightEnvironment.withBrowser);

await Effect.runPromise(program.pipe(Effect.provide(liveLayer)));
```

### `PlaywrightEnvironment.withBrowser`

The `withBrowser` utility provides the `PlaywrightBrowser` service to your effect. It internally manages a `Scope`, which means the browser will be launched when the effect starts and closed automatically when the effect finishes (including on failure or interruption).

```ts
const program = Effect.gen(function* () {
  const browser = yield* PlaywrightBrowser; // Now available in context
  const page = yield* browser.newPage();

  // ...
  // Browser will be closed automatically after this block
}).pipe(PlaywrightEnvironment.withBrowser);
```

## Accessing Native Playwright

If you need to access functionality from the underlying Playwright objects that isn't directly exposed, you can use the `use` method available on most services/objects (browsers, pages, locators).

```ts
import { Playwright } from "effect-playwright";
import { Effect } from "effect";
import { chromium } from "playwright-core";

const program = Effect.gen(function* () {
  const playwright = yield* Playwright;
  const browser = yield* playwright.launchScoped(chromium);
  const page = yield* browser.newPage();

  // Use the native Playwright Page object
  const screenshot = yield* page.use((p) => p.screenshot());
});
```

## Error Handling

All methods return effects that can fail with a `PlaywrightError`. This error wraps the original error from Playwright.
Note that Playwright does not support interruption, so `Effect.timeout` or similar code does not behave like you
might expect. Playwright provides its own `timeout` option for almost every method.
