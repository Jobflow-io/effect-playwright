# @jobflow/effect-playwright

[![GitHub License](https://img.shields.io/github/license/Jobflow-io/effect-playwright)](https://github.com/Jobflow-io/effect-playwright/blob/main/LICENSE)
[![Effect: yes](https://img.shields.io/badge/effect-yes-blue)](https://effect.website/)

A Playwright wrapper for the Effect ecosystem. This library provides a set of services and layers to interact with Playwright in a type-safe and functional way using Effect.

## Installation

```bash
pnpm add @jobflow/effect-playwright playwright-core
```

or

```bash
npm install @jobflow/effect-playwright playwright-core
```

## Quick Start

```ts
import { Playwright } from "@jobflow/effect-playwright";
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
import { PlaywrightBrowser } from "@jobflow/effect-playwright";
import { PlaywrightEnvironment } from "@jobflow/effect-playwright/experimental";
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

## Accessing Native Playwright

If you need to access functionality from the underlying Playwright objects that isn't directly exposed, you can use the `use` method available on most services (`PlaywrightBrowser`, `PlaywrightPage`, `PlaywrightLocator`).

```ts
import { Playwright } from "@jobflow/effect-playwright";
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
