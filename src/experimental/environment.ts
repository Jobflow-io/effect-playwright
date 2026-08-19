import { Context, Effect, Layer } from "effect";
import type { Scope } from "effect/Scope";
import { Playwright } from "effect-playwright";
import type { BrowserType, LaunchOptions } from "playwright-core";
import type { PlaywrightError } from "../errors";

/**
 * Most of the time you want to use the same kind of browser and configuration every time you use Playwright.
 * `Environment` is a service that allows you to configure how browsers are launched once. You can then
 * use `Environment.browser` to start browsers scoped to the current lifetime. They will be closed when the scope is closed.
 *
 * This service will not start a browser on its own. You can use {@link withBrowser} to provide the `Browser` service to the wrapped effect.
 *
 * @since 0.1.0
 * @category tag
 */
export class Environment extends Context.Tag(
  "effect-playwright/experimental/environment/Environment",
)<
  Environment,
  {
    browser: Effect.Effect<Playwright.Browser, PlaywrightError, Scope>;
  }
>() {}

/**
 * Creates a Layer that initializes the `Environment`.
 *
 * @example
 *
 * ```ts
 * import { chromium } from "effect-playwright";
 * import { Environment } from "effect-playwright/experimental";
 *
 * const playwrightEnv = Environment.layer(chromium);
 *
 * // use the layer
 * const program = Effect.gen(function* () {
 *   const playwright = yield* Environment;
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
  Playwright.Playwright.pipe(
    Effect.map((playwright) =>
      Environment.of({
        browser: playwright.launchScoped(browser, launchOptions),
      }),
    ),
    Layer.effect(Environment),
    Layer.provide(Playwright.layer),
  );

const withBrowserUnscoped = Effect.provideServiceEffect(
  Playwright.Browser,
  Environment.pipe(Effect.flatMap((e) => e.browser)),
);

/**
 * Provides a scoped `Playwright.Browser` service, allowing you to access the browser from the context.
 *
 * You will need to provide the `Environment` layer first.
 *
 * This will start a browser and close it when the scope is closed.
 *
 * @example
 *
 * ```ts
 * import { Playwright, chromium } from "effect-playwright";
 * import { Environment } from "effect-playwright/experimental";
 *
 * const env = Environment.layer(chromium);
 *
 * const program = Effect.gen(function* () {
 *     const browser = yield* Playwright.Browser;
 *     const page = yield* browser.newPage();
 *     yield* page.goto("https://example.com");
 * }).pipe(Environment.withBrowser, Effect.provide(env));
 * ```
 *
 * @since 0.1.0
 * @category util
 */
export const withBrowser = <A, E, R>(self: Effect.Effect<A, E, R>) =>
  Effect.scoped(withBrowserUnscoped(self)); // TODO: roast check if using Effect.scope here is an anti-pattern
