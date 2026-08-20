/**
 * Service for launching and connecting Playwright browsers with explicit or
 * scope-managed lifecycles.
 *
 * @since 0.1.0
 */

import { Context, Effect, Layer, type Scope } from "effect";
import {
  type BrowserType,
  type ConnectOverCDPOptions,
  chromium,
} from "playwright-core";

import { type Browser, type LaunchOptions, makeBrowser } from "./browser";
import { type BrowserContext, makeBrowserContext } from "./browser-context";
import { type PlaywrightError, wrapError } from "./errors";

type LaunchPersistentContextOptions = Parameters<
  BrowserType["launchPersistentContext"]
>[1];

/**
 * Browser launch and connection operations with explicit ownership semantics.
 *
 * **When to use**
 *
 * Use this service when browser acquisition is part of an Effect program.
 * Prefer the `Scoped` variants unless ownership must outlive the current scope.
 *
 * @category models
 * @since 0.1.0
 */
export interface Playwright {
  /**
   * Launches a browser whose lifetime is managed by the caller.
   *
   * **When to use**
   *
   * Use when the browser must outlive the current `Scope`. Prefer
   * {@link launchScoped} for ordinary Effect workflows.
   *
   * **Gotchas**
   *
   * The returned browser is not closed automatically. Ensure `browser.close`
   * runs after success, failure, and interruption.
   *
   * **Example** (Closing a manually managed browser)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright, chromium } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const browser = yield* playwright.launch(chromium);
   *   return yield* Effect.gen(function* () {
   *     const page = yield* browser.newPage();
   *     yield* page.setContent("<h1>Effect</h1>");
   *   }).pipe(Effect.ensuring(browser.close.pipe(Effect.ignore)));
   * }).pipe(Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser engine to launch.
   * @param options - Optional browser launch options.
   * @since 0.1.0
   */
  launch: (
    browserType: BrowserType,
    options?: LaunchOptions,
  ) => Effect.Effect<Browser, PlaywrightError>;
  /**
   * Launches a browser managed by the current `Scope`.
   *
   * **When to use**
   *
   * Use this as the default browser acquisition API. The browser closes when
   * the scope ends, including after failure or interruption.
   *
   * **Example** (Launching a scoped browser)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright, chromium } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const browser = yield* playwright.launchScoped(chromium);
   *   const page = yield* browser.newPage();
   *   yield* page.setContent("<h1>Effect</h1>");
   * }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser engine to launch.
   * @param options - Optional browser launch options.
   * @since 0.1.0
   */
  launchScoped: (
    browserType: BrowserType,
    options?: LaunchOptions,
  ) => Effect.Effect<Browser, PlaywrightError, Scope.Scope>;
  /**
   * Launches a persistent browser context managed by the caller.
   *
   * **When to use**
   *
   * Use when browser state must persist in `userDataDir` and the context must
   * outlive the current `Scope`. Prefer {@link launchPersistentContextScoped}
   * otherwise.
   *
   * **Gotchas**
   *
   * Closing this context also closes its browser process. The context is not
   * closed automatically by this method.
   *
   * **Example** (Closing a persistent context)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright, chromium } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const context = yield* playwright.launchPersistentContext(
   *     chromium,
   *     "./.playwright-profile",
   *   );
   *   return yield* Effect.gen(function* () {
   *     const page = yield* context.newPage;
   *     yield* page.setContent("<h1>Effect</h1>");
   *   }).pipe(Effect.ensuring(context.close.pipe(Effect.ignore)));
   * }).pipe(Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser engine to launch.
   * @param userDataDir - Browser profile directory, or `""` for a temporary directory.
   * @param options - Optional persistent-context launch options.
   * @since 0.2.4
   */
  launchPersistentContext: (
    browserType: BrowserType,
    userDataDir: string,
    options?: LaunchPersistentContextOptions,
  ) => Effect.Effect<BrowserContext, PlaywrightError>;
  /**
   * Launches a persistent browser context managed by the current `Scope`.
   *
   * **When to use**
   *
   * Use when a scoped workflow needs a persistent browser profile. Closing the
   * scope closes both the context and its browser process.
   *
   * **Example** (Launching a scoped persistent context)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright, chromium } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const context = yield* playwright.launchPersistentContextScoped(
   *     chromium,
   *     "./.playwright-profile",
   *   );
   *   const page = yield* context.newPage;
   *   yield* page.setContent("<h1>Effect</h1>");
   * }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param browserType - The browser engine to launch.
   * @param userDataDir - Browser profile directory, or `""` for a temporary directory.
   * @param options - Optional persistent-context launch options.
   * @since 0.2.4
   */
  launchPersistentContextScoped: (
    browserType: BrowserType,
    userDataDir: string,
    options?: LaunchPersistentContextOptions,
  ) => Effect.Effect<BrowserContext, PlaywrightError, Scope.Scope>;
  /**
   * Connects to a browser over CDP and leaves connection ownership to the caller.
   *
   * **When to use**
   *
   * Use when the CDP connection must outlive the current `Scope`. Prefer
   * {@link connectCDPScoped} otherwise.
   *
   * **Gotchas**
   *
   * Closing the wrapper closes only the CDP connection, not the remote browser.
   *
   * **Example** (Closing a manually managed CDP connection)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const cdpUrl = "http://localhost:9222";
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const browser = yield* playwright.connectCDP(cdpUrl);
   *   return yield* Effect.ensuring(
   *     Effect.void,
   *     browser.close.pipe(Effect.ignore),
   *   );
   * }).pipe(Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param cdpUrl - CDP endpoint URL.
   * @param options - Optional CDP connection options.
   * @since 0.1.0
   */
  connectCDP: (
    cdpUrl: string,
    options?: ConnectOverCDPOptions,
  ) => Effect.Effect<Browser, PlaywrightError>;
  /**
   * Connects to a browser over CDP and manages the connection with `Scope`.
   *
   * **When to use**
   *
   * Use this as the default CDP connection API. Scope finalization closes the
   * connection but does not stop the remote browser process.
   *
   * **Example** (Connecting over CDP within a scope)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const cdpUrl = "http://localhost:9222";
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const browser = yield* playwright.connectCDPScoped(cdpUrl);
   *   return browser.isConnected();
   * }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
   *
   * await Effect.runPromise(program);
   * ```
   *
   * @param cdpUrl - CDP endpoint URL.
   * @param options - Optional CDP connection options.
   * @since 0.1.1
   */
  connectCDPScoped: (
    cdpUrl: string,
    options?: ConnectOverCDPOptions,
  ) => Effect.Effect<Browser, PlaywrightError, Scope.Scope>;
}

const launch: (
  browserType: BrowserType,
  options?: LaunchOptions,
) => Effect.Effect<Browser, PlaywrightError> = Effect.fn(function* (
  browserType: BrowserType,
  options?: LaunchOptions,
) {
  const rawBrowser = yield* Effect.tryPromise({
    try: () => browserType.launch(options),
    catch: wrapError,
  });

  return makeBrowser(rawBrowser);
});

const connectCDP: (
  cdpUrl: string,
  options?: ConnectOverCDPOptions,
) => Effect.Effect<Browser, PlaywrightError> = Effect.fn(function* (
  cdpUrl: string,
  options?: ConnectOverCDPOptions,
) {
  const browser = yield* Effect.tryPromise({
    try: () => chromium.connectOverCDP(cdpUrl, options),
    catch: wrapError,
  });

  return makeBrowser(browser);
});

const launchPersistentContext: (
  browserType: BrowserType,
  userDataDir: string,
  options?: LaunchPersistentContextOptions,
) => Effect.Effect<BrowserContext, PlaywrightError> = Effect.fn(function* (
  browserType: BrowserType,
  userDataDir: string,
  options?: LaunchPersistentContextOptions,
) {
  const rawContext = yield* Effect.tryPromise({
    try: () => browserType.launchPersistentContext(userDataDir, options),
    catch: wrapError,
  });

  return makeBrowserContext(rawContext);
});

/**
 * @category services
 * @since 0.1.0
 */
export const Playwright = Context.Service<Playwright>(
  "effect-playwright/playwright/Playwright",
);

/**
 * The layer that provides the {@link Playwright} service.
 *
 * @category layers
 * @since 0.1.0
 */
export const layer = Layer.succeed(Playwright, {
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
