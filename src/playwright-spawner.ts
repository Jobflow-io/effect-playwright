/**
 * Service for provisioning a scoped Playwright browser.
 *
 * @since 0.7.0
 */

import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import type { BrowserType, LaunchOptions } from "playwright-core";
import type { PlaywrightError } from "./errors";
import * as Playwright from "./playwright-api";

/**
 * Deferred acquisition of a browser scoped to the caller's lifetime.
 *
 * **When to use**
 *
 * Use through {@link withBrowser} for the common case, or access `browser`
 * directly when composing a custom scoped layer.
 *
 * @category models
 * @since 0.7.0
 */
export interface PlaywrightSpawner {
  readonly browser: Effect.Effect<Playwright.Browser, PlaywrightError, Scope>;
}

/**
 * Service for the active {@link PlaywrightSpawner}.
 *
 * @category services
 * @since 0.7.0
 */
export const PlaywrightSpawner = Context.Service<PlaywrightSpawner>(
  "effect-playwright/playwright-spawner/PlaywrightSpawner",
);

/**
 * Creates a layer that configures scoped browser acquisition.
 *
 * **Details**
 *
 * Providing this layer does not launch a browser eagerly. A browser is launched
 * when the `browser` effect is evaluated inside a scope. The layer also provides
 * the underlying `Playwright.Playwright` service.
 *
 * **Example** (Acquiring the browser directly)
 *
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightSpawner, chromium } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const spawner = yield* PlaywrightSpawner.PlaywrightSpawner;
 *   const browser = yield* spawner.browser;
 *   const page = yield* browser.newPage();
 *   yield* page.setContent("<h1>Effect</h1>");
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(PlaywrightSpawner.layer(chromium)),
 * );
 * ```
 *
 * @param browser - Browser engine to launch.
 * @param launchOptions - Optional browser launch options.
 * @category layers
 * @since 0.1.0
 */
export const layer = (
  browser: BrowserType,
  launchOptions?: LaunchOptions,
): Layer.Layer<PlaywrightSpawner> =>
  Playwright.Playwright.pipe(
    Effect.map((playwright) =>
      PlaywrightSpawner.of({
        browser: playwright.launchScoped(browser, launchOptions),
      }),
    ),
    Layer.effect(PlaywrightSpawner),
    Layer.provide(Playwright.layer),
  );

const withBrowserUnscoped = Effect.provideServiceEffect(
  Playwright.Browser,
  PlaywrightSpawner.pipe(Effect.flatMap((e) => e.browser)),
);

/**
 * Provides a scoped `Playwright.Browser` to an Effect.
 *
 * **When to use**
 *
 * Use this as the concise alternative to accessing {@link PlaywrightSpawner}
 * and its `browser` effect directly.
 *
 * **Details**
 *
 * A fresh browser is launched when the returned effect starts and is closed
 * when that effect succeeds, fails, or is interrupted. The
 * {@link PlaywrightSpawner} layer must already be provided.
 *
 * **Example** (Providing a browser for one program)
 *
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright, PlaywrightSpawner, chromium } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const browser = yield* Playwright.Browser;
 *   const page = yield* browser.newPage();
 *   yield* page.setContent("<h1>Effect</h1>");
 * }).pipe(
 *   PlaywrightSpawner.withBrowser,
 *   Effect.provide(PlaywrightSpawner.layer(chromium)),
 * );
 * ```
 *
 * @category utilities
 * @since 0.1.0
 */
export const withBrowser = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.scoped(withBrowserUnscoped(self)); // TODO: roast check if using Effect.scope here is an anti-pattern
