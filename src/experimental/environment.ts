import { Context, Effect, Layer, pipe } from "effect";
import type { Scope } from "effect/Scope";
import type { BrowserType, LaunchOptions } from "playwright-core";
import { PlaywrightBrowser } from "../browser";
import type { PlaywrightError } from "../errors";
import { Playwright } from "../playwright";

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
export class PlaywrightEnvironment extends Context.Service<
  PlaywrightEnvironment,
  {
    browser: Effect.Effect<
      PlaywrightBrowser["Service"],
      PlaywrightError,
      Scope
    >;
  }
>()("effect-playwright/experimental/PlaywrightEnvironment") {}

/**
 * Creates a Layer that initializes the `PlaywrightEnvironment`.
 *
 * @example
 *
 * ```ts
 * import { chromium } from "effect-playwright";
 * import { PlaywrightEnvironment } from "effect-playwright/experimental";
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
  pipe(
    Playwright,
    Effect.map((playwright) =>
      PlaywrightEnvironment.of({
        browser: playwright.launchScoped(browser, launchOptions),
      }),
    ),
    Layer.effect(PlaywrightEnvironment),
    Layer.provide(Playwright.layer),
  );

const withBrowserUnscoped = <A, E, R>(
  self: Effect.Effect<A, E, R>,
): Effect.Effect<
  A,
  E | PlaywrightError,
  Exclude<R, PlaywrightBrowser> | Scope | PlaywrightEnvironment
> =>
  Effect.provideServiceEffect(
    PlaywrightBrowser,
    pipe(
      PlaywrightEnvironment,
      Effect.flatMap((e) => e.browser),
    ),
  )(self);

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
 * import { chromium } from "effect-playwright";
 * import { PlaywrightEnvironment } from "effect-playwright/experimental";
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
export const withBrowser = <A, E, R>(
  self: Effect.Effect<A, E, R>,
): Effect.Effect<
  A,
  E | PlaywrightError,
  Exclude<R, PlaywrightBrowser> | PlaywrightEnvironment
> => Effect.scoped(withBrowserUnscoped(self));
