/**
 * Effect service wrapper for Playwright browsers, including scoped context and
 * page creation, lifecycle operations, and browser event streams.
 *
 * @since 0.1.0
 */

import { Context, Effect, Queue, Stream } from "effect";
import type { Scope } from "effect/Scope";
import type {
  BrowserType,
  Browser as CoreBrowser,
  BrowserContext as CoreBrowserContext,
  chromium,
} from "playwright-core";
import { type BrowserContext, makeBrowserContext } from "./browser-context";
import type { PlaywrightError } from "./errors";
import { makePage, type Page } from "./page";
import type { PatchedEvents } from "./playwright-types";
import { useHelper } from "./utils";

/**
 * Options for launching a Playwright browser.
 *
 * @category options
 * @since 0.1.0
 */
export type LaunchOptions = Parameters<typeof chromium.launch>[0];
/**
 * Options for creating a page directly from a browser.
 *
 * @category options
 * @since 0.1.0
 */
export type NewPageOptions = Parameters<CoreBrowser["newPage"]>[0];
/**
 * Options for creating a browser context.
 *
 * @category options
 * @since 0.1.0
 */
export type NewContextOptions = Parameters<CoreBrowser["newContext"]>[0];

interface BrowserEvents {
  disconnected: CoreBrowser;
  context: CoreBrowserContext;
}

const eventMappings = {
  disconnected: (browser: CoreBrowser) => makeBrowser(browser),
  context: (context: CoreBrowserContext) => makeBrowserContext(context),
} as const;

type BrowserWithPatchedEvents = PatchedEvents<CoreBrowser, BrowserEvents>;

/**
 * Effect-friendly operations for a running Playwright browser.
 *
 * **When to use**
 *
 * Use this service to create pages or isolated browser contexts, inspect the
 * browser, consume browser events, or access an unsupported native operation.
 * Prefer `Playwright.launchScoped` or `PlaywrightSpawner.withBrowser` when this
 * service owns the browser process.
 *
 * @category models
 * @since 0.1.0
 */
export interface Browser {
  /**
   * Opens a new page in the browser.
   * @param options - Optional options for creating the new page.
   * @returns An effect that resolves to a `Page` service.
   * @see {@link CoreBrowser.newPage}
   */
  readonly newPage: (
    options?: NewPageOptions,
  ) => Effect.Effect<Page, PlaywrightError>;
  /**
   * Runs an asynchronous operation against the underlying Playwright `Browser`.
   *
   * **When to use**
   *
   * Use this escape hatch only when {@link Browser} does not expose the native
   * Playwright operation you need.
   *
   * **Gotchas**
   *
   * The callback must return a `Promise`. The browser remains owned by the
   * service that created it, so do not close it here when using scoped
   * acquisition.
   *
   * @example
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   return yield* browser.use(async (nativeBrowser) =>
   *     nativeBrowser.version(),
   *   );
   * });
   * ```
   *
   * @param f - A function that receives the native browser and returns a promise.
   * @returns An effect that maps a rejected promise to `PlaywrightError`.
   * @see {@link CoreBrowser}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (browser: CoreBrowser) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
  /**
   * An Effect that closes the browser and all of its pages.
   * @see {@link CoreBrowser.close}
   */
  readonly close: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the list of all open browser contexts.
   * @see {@link CoreBrowser.contexts}
   */
  readonly contexts: () => Array<BrowserContext>;

  /**
   * Creates an isolated browser context managed by the current `Scope`.
   *
   * **Details**
   *
   * The context is closed automatically when the scope ends, including after
   * failure or interruption.
   *
   * @see {@link CoreBrowser.newContext}
   * @since 0.1.0
   */
  readonly newContext: (
    options?: NewContextOptions,
  ) => Effect.Effect<BrowserContext, PlaywrightError, Scope>;

  /**
   * Returns the browser type (chromium, firefox or webkit) that the browser belongs to.
   * @see {@link CoreBrowser.browserType}
   */
  readonly browserType: () => BrowserType;

  /**
   * Returns the version of the browser.
   * @see {@link CoreBrowser.version}
   */
  readonly version: () => string;
  /**
   * Returns whether the browser is connected.
   * @see {@link CoreBrowser.isConnected}
   */
  readonly isConnected: () => boolean;

  /**
   * Binds the browser to a title.
   *
   * @see {@link CoreBrowser.bind}
   * @since 0.5.0
   */
  readonly bind: (
    title: string,
    options?: Parameters<CoreBrowser["bind"]>[1],
  ) => Effect.Effect<{ endpoint: string }, PlaywrightError>;

  /**
   * Unbinds the browser.
   *
   * @see {@link CoreBrowser.unbind}
   * @since 0.5.0
   */
  readonly unbind: Effect.Effect<void, PlaywrightError>;

  /**
   * Streams browser events after adapting their payloads to wrapper values.
   *
   * **Details**
   *
   * Event listeners are removed when stream consumption ends. The stream also
   * ends when the browser disconnects.
   *
   * @category event streams
   * @see {@link CoreBrowser.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * Service for the active {@link Browser}.
 *
 * @category services
 * @since 0.1.0
 */
export const Browser = Context.Service<Browser>(
  "effect-playwright/browser/Browser",
);

/**
 * Creates a `Browser` from a Playwright `Browser` instance.
 *
 * @param browser - The Playwright `Browser` instance to wrap.
 * @category constructors
 * @since 0.1.0
 */
export const makeBrowser = (browser: CoreBrowser): Browser => {
  const events = browser as BrowserWithPatchedEvents;
  const use = useHelper(browser);

  return Browser.of({
    newPage: (options) =>
      use((browser) => browser.newPage(options).then(makePage)),
    close: use((browser) => browser.close()),
    contexts: () => browser.contexts().map(makeBrowserContext),
    newContext: (options) =>
      Effect.acquireRelease(
        use((browser) => browser.newContext(options).then(makeBrowserContext)),
        (context) => context.close.pipe(Effect.ignore({ log: true })),
      ),
    browserType: () => browser.browserType(),
    version: () => browser.version(),
    isConnected: () => browser.isConnected(),
    bind: (title, options) => use((browser) => browser.bind(title, options)),
    unbind: use((browser) => browser.unbind()),
    eventStream: <K extends keyof BrowserEvents>(event: K) =>
      Stream.callback<BrowserEvents[K]>((queue) => {
        const emit = (value: BrowserEvents[K]) => {
          Queue.offerUnsafe(queue, value);
        };
        const end = () => {
          Queue.endUnsafe(queue);
        };
        return Effect.acquireRelease(
          Effect.sync(() => {
            events.on(event, emit);
            events.once("disconnected", end);
          }),
          () =>
            Effect.sync(() => {
              events.off(event, emit);
              events.off("disconnected", end);
            }),
        );
      }).pipe(
        Stream.map((value) => {
          const mapping = eventMappings[event];
          // The selected event and mapping share the same generic event key.
          return mapping(value as never) as ReturnType<
            (typeof eventMappings)[K]
          >;
        }),
      ),
    use,
  });
};
