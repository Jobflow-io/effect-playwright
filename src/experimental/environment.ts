import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import { Playwright, PlaywrightBrowser } from "effect-playwright";
import type { BrowserType, LaunchOptions } from "playwright-core";
import type { PlaywrightError } from "../errors";

/**
 * Most of the time you want to use the same kind of browser and configuration every time you use Playwright.
 * `PlaywrightEnvironment` is a service that allows you to configure how browsers are launched once. You can then
 * use `PlaywrightEnvironment.browser` to start browsers scoped to the current lifetime. They will be closed when the scope is closed.
 *
 * This service will not start a browser on its own. You can use {@link withBrowser} to provide the `PlaywrightBrowser` service to the wrapped effect.
 *
 * @since 0.1.0
 * @category tag
 */
export class PlaywrightEnvironment extends Context.Tag(
  "effect-playwright/experimental/PlaywrightEnvironment",
)<
  PlaywrightEnvironment,
  {
    browser: Effect.Effect<
      typeof PlaywrightBrowser.Service,
      PlaywrightError,
      Scope
    >;
  }
>() {}

/**
 * Creates a Layer that initializes the `PlaywrightEnvironment`.
 *
 * @example
 *
 * ```ts
 * import { PlaywrightEnvironment } from "effect-playwright/experimental";
 * import { chromium } from "playwright-core";
 *
 * const playwrightEnv = PlaywrightEnvironment.layer(chromium);
 *
 * // use the layer
 * const program = Effect.gen(function* () {
 *   const playwright = yield* PlaywrightEnvironment;
 *   const browser = yield* playwright.browser;
 *   const page = yield* browser.newPage();
 *   yield* page.goto("https://example.com");
 * }).pipe(Effect.scoped, Effect.provide(playwrightEnv));
 * ```
 *
 * @param browser - The Playwright BrowserType implementation (e.g. `chromium`, `firefox`, `webkit`).
 * @param launchOptions - Optional configuration for launching the browser (e.g. headless, args).
 *
 * @since 0.1.0
 * @category layer
 */
export const layer = (browser: BrowserType, launchOptions?: LaunchOptions) =>
  Playwright.pipe(
    Effect.map((playwright) =>
      PlaywrightEnvironment.of({
        browser: playwright.launchScoped(browser, launchOptions),
      }),
    ),
    Layer.effect(PlaywrightEnvironment),
    Layer.provide(Playwright.layer),
  );

const withBrowserUnscoped = Effect.provideServiceEffect(
  PlaywrightBrowser,
  PlaywrightEnvironment.pipe(Effect.flatMap((e) => e.browser)),
);

/**
 * Provides a scoped `PlaywrightBrowser` service, allowing you to access the browser from the context (e.g. by yielding `PlaywrightBrowser`).
 *
 * You will need to provide the `PlaywrightEnvironment` layer first.
 *
 * This will start a browser and close it when the scope is closed.
 *
 * @example
 *
 * ```ts
 * import { PlaywrightEnvironment } from "effect-playwright/experimental";
 * import { chromium } from "playwright-core";
 *
 * const env = PlaywrightEnvironment.layer(chromium);
 *
 * const program = Effect.gen(function* () {
 *     const browser = yield* PlaywrightBrowser;
 *     const page = yield* browser.newPage();
 *     yield* page.goto("https://example.com");
 * }).pipe(PlaywrightEnvironment.withBrowser, Effect.provide(env));
 * ```
 *
 * @since 0.1.0
 * @category util
 */
export const withBrowser = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.scoped(withBrowserUnscoped(self)); // TODO: roast check if using Effect.scope here is an anti-pattern
