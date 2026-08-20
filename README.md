# effect-playwright

[![NPM Version](https://img.shields.io/npm/v/effect-playwright)](https://www.npmjs.com/package/effect-playwright)
[![GitHub License](https://img.shields.io/github/license/Jobflow-io/effect-playwright)](https://github.com/Jobflow-io/effect-playwright/blob/main/LICENSE)
[![Effect: yes](https://img.shields.io/badge/effect-yes-blue)](https://effect.website/)
[![Documentation](https://img.shields.io/badge/view_documentation-purple)](https://jobflow-io.github.io/effect-playwright/modules/index.html)

A Playwright wrapper for the Effect ecosystem. This library provides a set of services and layers to interact with Playwright in a type-safe way using Effect.

[Playwright Test Integration](README.md#playwright-test-integration) is also supported.

## Installation

```bash
pnpm add effect-playwright
pnpm effect-playwright install chromium
```

Browser installation is not required if connecting to an existing browser via CDP or using a local browser.

## Quick Start

```ts
import { Playwright, chromium } from "effect-playwright";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const playwright = yield* Playwright.Playwright;

  // The browser is closed automatically when the scope ends.
  const browser = yield* playwright.launchScoped(chromium, {
    headless: true,
  });

  const page = yield* browser.newPage();

  yield* page.setContent("testing");
}).pipe(Effect.scoped, Effect.provide(Playwright.layer));

await Effect.runPromise(program);
```

## Managing Lifecycle

Using `launchScoped` is the recommended way to manage the browser lifecycle. It ensures that the browser is closed automatically when the effect's scope ends, preventing resource leaks.

```ts
const program = Effect.gen(function* () {
  const playwright = yield* Playwright.Playwright;
  const browser = yield* playwright.launchScoped(chromium);
  // Browser will be closed automatically after this block
}).pipe(Effect.scoped);
```

## Connecting via CDP

You can connect to an existing browser instance using the Chrome DevTools Protocol (CDP).

```ts
const program = Effect.gen(function* () {
  const playwright = yield* Playwright.Playwright;

  // Use connectCDPScoped to automatically close the CONNECTION when the scope ends
  // Note: This does NOT close the browser process itself, only the CDP connection.
  const browser = yield* playwright.connectCDPScoped("http://localhost:9222");

  const page = yield* browser.newPage();
  // ...
}).pipe(Effect.scoped);
```

If you need to manage the connection lifecycle manually, use `connectCDP`:

```ts
const program = Effect.gen(function* () {
  const playwright = yield* Playwright.Playwright;
  const browser = yield* playwright.connectCDP("http://localhost:9222");

  // ... use browser ...

  yield* browser.close;
});
```

## Playwright Spawner (Experimental)

`PlaywrightSpawner` configures how browsers are launched and spawns browsers scoped to the current lifetime.

### Usage

```ts
import { Playwright, chromium } from "effect-playwright";
import { PlaywrightSpawner } from "effect-playwright/experimental";
import { Effect } from "effect";

const liveLayer = PlaywrightSpawner.layer(chromium, {
  headless: false /** any other launch options */,
});

const program = Effect.gen(function* () {
  const browser = yield* Playwright.Browser;
  const page = yield* browser.newPage();

  yield* page.goto("https://example.com");
}).pipe(PlaywrightSpawner.withBrowser);

await Effect.runPromise(program.pipe(Effect.provide(liveLayer)));
```

### `PlaywrightSpawner.withBrowser`

The `withBrowser` utility provides the `Browser` service to your effect. It internally manages a `Scope`, which means the browser will be launched when the effect starts and closed automatically when the effect finishes (including on failure or interruption).

```ts
const program = Effect.gen(function* () {
  const browser = yield* Playwright.Browser; // Now available in context
  const page = yield* browser.newPage();

  // ...
  // Browser close is ensured
}).pipe(PlaywrightSpawner.withBrowser);
```

## Event Handling

You can listen to Playwright events using the `eventStream` method. This returns an Effect `Stream` that emits events as they occur.

> [!NOTE]
> `eventStream` emits Effect-based wrappers (for example, `Playwright.Request`, `Playwright.Response`, and `Playwright.Page`) for most events.

The stream is automatically managed and will close when the underlying resource (like the Page or Browser) is closed.

### Example: Monitoring Network Requests

Since event streams run indefinitely until the resource closes, you often need to **fork** the resulting effect so it runs in the background without blocking your main program flow.

```ts
const program = Effect.gen(function* () {
  const browser = yield* Playwright.Browser;
  const page = yield* browser.newPage();

  // Create a stream of request events
  yield* page.eventStream("request").pipe(
    Stream.runForEach((request) =>
      Effect.gen(function* () {
        yield* Effect.log(`Request: ${request.url()}`);
      }),
    ),

    // Fork to run it in the background
    Effect.fork,
  );

  yield* page.goto("https://example.com");
}).pipe(PlaywrightSpawner.withBrowser);
```

## Accessing Native Playwright

If you need to access functionality from the underlying Playwright objects that isn't directly exposed, you can use the `use` method available on most services/objects (browsers, pages, locators).

```ts
import { Playwright, chromium } from "effect-playwright";
import { Effect } from "effect";

const program = Effect.gen(function* () {
  const playwright = yield* Playwright.Playwright;
  const browser = yield* playwright.launchScoped(chromium);
  const page = yield* browser.newPage();

  // Use the native Playwright Page object
  const screenshot = yield* page.use((p) => p.screenshot());
});
```

## Error Handling

All methods return effects that can fail with a `Playwright.PlaywrightError`. This error wraps the original error from Playwright.
Note that Playwright does not support interruption, so `Effect.timeout` or similar code does not behave like you
might expect. Playwright provides its own `timeout` option for almost every method.

## CLI Wrapper

`effect-playwright` includes a lightweight command-line wrapper that forwards all commands directly to the underlying `playwright-core` CLI. You can use it to install browsers, generate code, or inspect traces:

```bash
# Install browsers
pnpm effect-playwright install chromium

# Code generation
pnpm effect-playwright codegen https://example.com

# Open inspector / trace viewer
pnpm effect-playwright show-trace trace.zip
```

## Playwright Test integration

Install the optional Playwright Test peer dependency to use Effect programs in the upstream test runner:

```bash
pnpm add -D @playwright/test effect-playwright
```

```ts
import { Effect } from "effect";
import { Playwright } from "effect-playwright";
import { expect, test } from "effect-playwright/test";

test.effect("shows the example.com headline", () =>
  Effect.gen(function* () {
    const page = yield* Playwright.Page;
    yield* page.goto("https://example.com");

    const headline = page.getByRole("heading", { name: "Example Domain" });
    expect(yield* headline.innerText()).toBe("Example Domain");
  }),
);
```

### Utilizing Effect finalizers

`test.effect` runs each Effect in a scope, so acquired resources are released when the test finishes, fails, or times out:

```ts
import { Effect } from "effect";
import { test } from "effect-playwright/test";

test.effect("cleans up after the test", () =>
  Effect.acquireRelease(Effect.log("Creating User"), () =>
    Effect.log("Cleanup: Deleting user"),
  ),
);
```

Effect scope finalizers run during test-scoped fixture teardown. On test timeout, this occurs after user `afterEach`.

### Using Effect layers

Effect layers are the preferred way to provide dependencies to Effect-based
Playwright tests. Use `layer` to acquire a layer once per Playwright worker and
share it between the tests in a block. Layer finalizers run after every test in
the block has finished. Nested layers reuse their parent services.

```ts
import { Context, Effect, Layer } from "effect";
import { expect, layer } from "effect-playwright/test";

class Greeting extends Context.Tag("Greeting")<Greeting, string>() {}

layer(Layer.succeed(Greeting, "hello"))("Greeting", (it) => {
  it.effect("uses a shared service", () =>
    Effect.gen(function* () {
      expect(yield* Greeting).toBe("hello");
    }),
  );
});
```

### Custom Playwright fixtures

Custom Playwright fixtures are supported mainly for compatibility with existing
Playwright Test suites. Prefer Effect layers.
When integration with an existing custom `TestType` is required, call
`makeMethods` after extending or merging it:

```ts
import { test as base } from "@playwright/test";
import { Effect } from "effect";
import { expect, makeMethods } from "effect-playwright/test";

const test = makeMethods(
  base.extend<{ answer: number }>({
    answer: async ({}, use) => use(42),
  }),
);

test.effect("uses a custom fixture", ({ answer }) =>
  Effect.sync(() => expect(answer).toBe(42)),
);
```
