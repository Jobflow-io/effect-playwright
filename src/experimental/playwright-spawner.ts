import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import { Playwright } from "effect-playwright";
import type { BrowserType, LaunchOptions } from "playwright-core";
import type { PlaywrightError } from "../errors";

/**
 * A service that spawns browsers scoped to the current lifetime.
 *
 * @example
 * ```ts
 * declare const spawner: PlaywrightSpawner.PlaywrightSpawner;
 * const browser = spawner.browser;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export interface Service {
  readonly browser: Effect.Effect<Playwright.Browser, PlaywrightError, Scope>;
}
/**
 * The PlaywrightSpawner service.
 *
 * @example
 * ```ts
 * declare const spawner: PlaywrightSpawner.PlaywrightSpawner;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type PlaywrightSpawner = Service;

class PlaywrightSpawnerTag extends Context.Tag(
  "effect-playwright/experimental/playwright-spawner/PlaywrightSpawner",
)<PlaywrightSpawner, Service>() {}

/**
 * The PlaywrightSpawner service tag.
 *
 * @example
 * ```ts
 * const spawner = yield* PlaywrightSpawner.PlaywrightSpawner;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const PlaywrightSpawner = PlaywrightSpawnerTag;

/**
 * Creates a layer that provides the {@link PlaywrightSpawner} service.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { chromium } from "effect-playwright";
 * import { PlaywrightSpawner } from "effect-playwright/experimental";
 *
 * const program = Effect.gen(function* () {
 *   const spawner = yield* PlaywrightSpawner.PlaywrightSpawner;
 *   const browser = yield* spawner.browser;
 *   const page = yield* browser.newPage();
 *   yield* page.goto("https://example.com");
 * }).pipe(
 *   Effect.scoped,
 *   Effect.provide(PlaywrightSpawner.layer(chromium)),
 * );
 * ```
 *
 * @param browser - The Playwright BrowserType implementation (e.g. `chromium`, `firefox`, `webkit`).
 * @param launchOptions - Optional configuration for launching the browser (e.g. headless, args).
 *
 * @since 0.1.0
 * @category layer
 */
export const layer = (
  browser: BrowserType,
  launchOptions?: LaunchOptions,
): Layer.Layer<PlaywrightSpawner> =>
  Playwright.Playwright.pipe(
    Effect.map((playwright) =>
      PlaywrightSpawnerTag.of({
        browser: playwright.launchScoped(browser, launchOptions),
      }),
    ),
    Layer.effect(PlaywrightSpawnerTag),
    Layer.provide(Playwright.layer),
  );

const withBrowserUnscoped = Effect.provideServiceEffect(
  Playwright.Browser,
  PlaywrightSpawnerTag.pipe(Effect.flatMap((e) => e.browser)),
);

/**
 * Provides a scoped `Playwright.Browser` service, allowing you to access the browser from the context.
 *
 * You will need to provide the `PlaywrightSpawner` layer first.
 *
 * This will start a browser and close it when the scope is closed.
 *
 * @example
 *
 * ```ts
 * import { Playwright, chromium } from "effect-playwright";
 * import { PlaywrightSpawner } from "effect-playwright/experimental";
 *
 * const spawnerLayer = PlaywrightSpawner.layer(chromium);
 *
 * const program = Effect.gen(function* () {
 *     const browser = yield* Playwright.Browser;
 *     const page = yield* browser.newPage();
 *     yield* page.goto("https://example.com");
 * }).pipe(PlaywrightSpawner.withBrowser, Effect.provide(spawnerLayer));
 * ```
 *
 * @since 0.1.0
 * @category util
 */
export const withBrowser = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.scoped(withBrowserUnscoped(self)); // TODO: roast check if using Effect.scope here is an anti-pattern
