import { Context, Effect, Layer, type Scope } from "effect";
import {
  type BrowserType,
  type ConnectOverCDPOptions,
  chromium,
} from "playwright-core";

import { type LaunchOptions, PlaywrightBrowser } from "./browser";
import { PlaywrightBrowserContext } from "./browser-context";
import { type PlaywrightError, wrapError } from "./errors";

type LaunchPersistentContextOptions = Parameters<
  BrowserType["launchPersistentContext"]
>[1];

/**
 * @category model
 * @since 0.1.0
 */
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
   * Launches a persistent browser context.
   *
   * Unlike {@link launchPersistentContextScoped}, this method does **not** close the
   * context automatically when scope is closed. You are responsible for closing it.
   *
   * This launches a browser with a persistent profile under `userDataDir` and returns
   * the single persistent context for that browser.
   *
   * Closing this context also closes the underlying browser process.
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { chromium } from "playwright-core";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright;
   *   const context = yield* playwright.launchPersistentContext(
   *     chromium,
   *     "./.playwright-profile",
   *   );
   *
   *   const page = yield* context.newPage;
   *   yield* page.goto("https://example.com");
   *
   *   // Closes the persistent context and browser process.
   *   yield* context.close;
   * });
   *
   * await Effect.runPromise(program);
   * ```
   *
   * If you call this non-scoped variant inside a scope, add a finalizer for cleanup:
   *
   * ```ts
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright;
   *   const context = yield* playwright.launchPersistentContext(
   *     chromium,
   *     "./.playwright-profile",
   *   );
   *
   *   yield* Effect.addFinalizer(() => context.close.pipe(Effect.ignore));
   * });
   *
   * await Effect.runPromise(program.pipe(Effect.scoped));
   * ```
   *
   * @param browserType - The browser type to launch (e.g. chromium, firefox, webkit).
   * @param userDataDir - Directory used for persistent browser profile data. Pass `""` for a temporary profile directory.
   * @param options - Optional persistent context launch options.
   * @since 0.2.4
   */
  launchPersistentContext: (
    browserType: BrowserType,
    userDataDir: string,
    options?: LaunchPersistentContextOptions,
  ) => Effect.Effect<typeof PlaywrightBrowserContext.Service, PlaywrightError>;
  /**
   * Launches a persistent browser context managed by a Scope.
   *
   * This automatically closes the persistent context (and therefore the browser process)
   * when the scope is closed.
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { chromium } from "playwright-core";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright;
   *   const context = yield* playwright.launchPersistentContextScoped(
   *     chromium,
   *     "./.playwright-profile",
   *   );
   *
   *   const page = yield* context.newPage;
   *   yield* page.goto("https://example.com");
   *   // Context/browser cleanup is automatic when scope closes.
   * }).pipe(Effect.scoped);
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser type to launch (e.g. chromium, firefox, webkit).
   * @param userDataDir - Directory used for persistent browser profile data. Pass `""` for a temporary profile directory.
   * @param options - Optional persistent context launch options.
   * @since 0.2.4
   */
  launchPersistentContextScoped: (
    browserType: BrowserType,
    userDataDir: string,
    options?: LaunchPersistentContextOptions,
  ) => Effect.Effect<
    typeof PlaywrightBrowserContext.Service,
    PlaywrightError,
    Scope.Scope
  >;
  /**
   * Connects to a browser instance via Chrome DevTools Protocol (CDP).
   *
   * Unlike {@link connectCDPScoped}, this method does **not** close the connection when the
   * scope is closed. It is the caller's responsibility to manage the connection's
   * lifecycle.
   *
   * If you want to close the connection using a scope simply add a finalizer:
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright;
   *   const browser = yield* playwright.connectCDP(cdpUrl);
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
  /**
   * Connects to a browser instance via Chrome DevTools Protocol (CDP) managed by a Scope.
   *
   * This method automatically closes the connection when the scope is closed.
   *
   * Note that closing a CDP connection does **not** close the browser instance itself,
   * only the CDP connection.
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright;
   *   const browser = yield* playwright.connectCDPScoped(cdpUrl);
   *   // Connection will be closed automatically when scope closes
   * });
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param cdpUrl - The CDP URL to connect to.
   * @param options - Optional options for connecting to the CDP URL.
   * @since 0.1.1
   */
  connectCDPScoped: (
    cdpUrl: string,
    options?: ConnectOverCDPOptions,
  ) => Effect.Effect<
    typeof PlaywrightBrowser.Service,
    PlaywrightError,
    Scope.Scope
  >;
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

    return PlaywrightBrowser.make(rawBrowser);
  });

const connectCDP: (
  cdpUrl: string,
  options?: ConnectOverCDPOptions,
) => Effect.Effect<typeof PlaywrightBrowser.Service, PlaywrightError> =
  Effect.fn(function* (cdpUrl: string, options?: ConnectOverCDPOptions) {
    const browser = yield* Effect.tryPromise({
      try: () => chromium.connectOverCDP(cdpUrl, options),
      catch: wrapError,
    });

    return PlaywrightBrowser.make(browser);
  });

const launchPersistentContext: (
  browserType: BrowserType,
  userDataDir: string,
  options?: LaunchPersistentContextOptions,
) => Effect.Effect<typeof PlaywrightBrowserContext.Service, PlaywrightError> =
  Effect.fn(function* (
    browserType: BrowserType,
    userDataDir: string,
    options?: LaunchPersistentContextOptions,
  ) {
    const rawContext = yield* Effect.tryPromise({
      try: () => browserType.launchPersistentContext(userDataDir, options),
      catch: wrapError,
    });

    return PlaywrightBrowserContext.make(rawContext);
  });

/**
 * @category tag
 * @since 0.1.0
 */
export class Playwright extends Context.Tag(
  "effect-playwright/index/Playwright",
)<Playwright, PlaywrightService>() {
  /**
   * @category layer
   */
  static readonly layer = Layer.succeed(Playwright, {
    launch,
    launchScoped: (browserType, options) =>
      Effect.acquireRelease(launch(browserType, options), (browser) =>
        browser.close.pipe(Effect.ignore),
      ),
    launchPersistentContext,
    launchPersistentContextScoped: (browserType, userDataDir, options) =>
      Effect.acquireRelease(
        launchPersistentContext(browserType, userDataDir, options),
        (context) => context.close.pipe(Effect.ignore),
      ),
    connectCDP,
    connectCDPScoped: (cdpUrl, options) =>
      Effect.acquireRelease(connectCDP(cdpUrl, options), (browser) =>
        browser.close.pipe(Effect.ignore),
      ),
  });
}
