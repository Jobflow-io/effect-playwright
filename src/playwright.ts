import { Context, Effect, Layer, type Scope } from "effect";
import {
  type BrowserType,
  type ConnectOverCDPOptions,
  chromium,
} from "playwright-core";

import { type LaunchOptions, PlaywrightBrowser } from "./browser";
import { type PlaywrightError, wrapError } from "./errors";

export interface PlaywrightService {
  /**
   * Launches a new browser instance.
   *
   * It is the caller's responsibility to manage the browser's lifecycle and close
   * it when no longer needed. For automatic scope-based management, use
   * {@link launchScoped} instead.
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { chromium } from "playwright-core";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.launch(chromium);
   *   // ... use browser ...
   *   yield* browser.close;
   * });
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser type to launch (e.g. chromium, firefox, webkit).
   * @param options - Optional launch options.
   * @since 0.1.0
   */
  launch: (
    browserType: BrowserType,
    options?: LaunchOptions,
  ) => Effect.Effect<typeof PlaywrightBrowser.Service, PlaywrightError>;
  /**
   * Launches a new browser instance managed by a Scope.
   *
   * This method automatically closes the browser when the scope is closed.
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { chromium } from "playwright-core";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.launchScoped(chromium);
   *   // Browser will be closed automatically when scope closes
   * });
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser type to launch (e.g. chromium, firefox, webkit).
   * @param options - Optional launch options.
   * @since 0.1.0
   */
  launchScoped: (
    browserType: BrowserType,
    options?: LaunchOptions,
  ) => Effect.Effect<
    typeof PlaywrightBrowser.Service,
    PlaywrightError,
    Scope.Scope
  >;
  /**
   * Connects to a browser instance via Chrome DevTools Protocol (CDP).
   *
   * Unlike {@link launchScoped}, this method does **not** close the browser when the
   * scope is closed. It is the caller's responsibility to manage the browser's
   * lifecycle.
   *
   * If you want to close the browser using a scope simply add a finalizer:
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.connectCDP(cdpUrl);
   *   yield* Effect.addFinalizer(() => browser.close.pipe(Effect.ignore));
   * });
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param cdpUrl - The CDP URL to connect to.
   * @param options - Optional options for connecting to the CDP URL.
   * @since 0.1.0
   */
  connectCDP: (
    cdpUrl: string,
    options?: ConnectOverCDPOptions,
  ) => Effect.Effect<typeof PlaywrightBrowser.Service, PlaywrightError>;
}

const launch: (
  browserType: BrowserType,
  options?: LaunchOptions,
) => Effect.Effect<typeof PlaywrightBrowser.Service, PlaywrightError> =
  Effect.fn(function* (browserType: BrowserType, options?: LaunchOptions) {
    const rawBrowser = yield* Effect.tryPromise({
      try: () => browserType.launch(options),
      catch: wrapError,
    });

    const browser = PlaywrightBrowser.make(rawBrowser);

    return browser;
  });

export class Playwright extends Context.Tag(
  "effect-playwright/index/Playwright",
)<Playwright, PlaywrightService>() {
  /**
   * @category layer
   */
  static readonly layer = Layer.succeed(Playwright, {
    launch,
    launchScoped: Effect.fn(function* (
      browserType: BrowserType,
      options?: LaunchOptions,
    ) {
      const browser = yield* launch(browserType, options);

      // cleanup
      yield* Effect.addFinalizer(() => browser.close.pipe(Effect.ignore));
      return browser;
    }),
    connectCDP: Effect.fn(function* (
      cdpUrl: string,
      options?: ConnectOverCDPOptions,
    ) {
      const browser = yield* Effect.tryPromise({
        try: () => chromium.connectOverCDP(cdpUrl, options),
        catch: wrapError,
      });

      return PlaywrightBrowser.make(browser);
    }),
  });
}
