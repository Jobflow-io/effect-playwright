import { Context, Effect, Stream } from "effect";
import type { Scope } from "effect/Scope";
import type {
  BrowserType,
  Browser as CoreBrowser,
  BrowserContext as CoreBrowserContext,
  chromium,
} from "playwright-core";
import { BrowserContext } from "./browser-context";
import type { PlaywrightError } from "./errors";
import { Page } from "./page";
import type { PatchedEvents } from "./playwright-types";
import { useHelper } from "./utils";

export type LaunchOptions = Parameters<typeof chromium.launch>[0];
export type NewPageOptions = Parameters<CoreBrowser["newPage"]>[0];
export type NewContextOptions = Parameters<CoreBrowser["newContext"]>[0];

interface BrowserEvents {
  disconnected: CoreBrowser;
  context: CoreBrowserContext;
}

const eventMappings = {
  disconnected: (browser: CoreBrowser) => Browser.make(browser),
  context: (context: CoreBrowserContext) => BrowserContext.make(context),
} as const;

type BrowserWithPatchedEvents = PatchedEvents<CoreBrowser, BrowserEvents>;

/**
 * @category model
 * @since 0.1.0
 */
export interface BrowserService {
  /**
   * Opens a new page in the browser.
   *
   * @example
   * ```typescript
   * const page = yield* browser.newPage();
   * ```
   *
   * @param options - Optional options for creating the new page.
   * @returns An effect that resolves to a `Page` service.
   * @see {@link CoreBrowser.newPage}
   */
  readonly newPage: (
    options?: NewPageOptions,
  ) => Effect.Effect<typeof Page.Service, PlaywrightError>;
  /**
   * A generic utility to execute any promise-based method on the underlying Playwright `Browser`.
   * Can be used to access any Browser functionality not directly exposed by this service.
   *
   * @example
   * ```typescript
   * const contexts = yield* browser.use((b) => b.contexts());
   * ```
   *
   * @param f - A function that takes the Playwright `Browser` and returns a `Promise`.
   * @returns An effect that wraps the promise and returns its result.
   * @see {@link CoreBrowser}
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
  readonly contexts: () => Array<typeof BrowserContext.Service>;

  readonly newContext: (
    options?: NewContextOptions,
  ) => Effect.Effect<typeof BrowserContext.Service, PlaywrightError, Scope>;

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
   * Creates a stream of the given event from the browser.
   *
   * @example
   * ```ts
   * const disconnectedStream = browser.eventStream("disconnected");
   * ```
   *
   * @category custom
   * @see {@link CoreBrowser.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class Browser extends Context.Tag("effect-playwright/browser/Browser")<
  Browser,
  BrowserService
>() {
  /**
   * @category constructor
   */
  static make(browser: BrowserWithPatchedEvents): BrowserService {
    const use = useHelper(browser);

    return Browser.of({
      newPage: (options) =>
        use((browser) => browser.newPage(options).then(Page.make)),
      close: use((browser) => browser.close()),
      contexts: () => browser.contexts().map(BrowserContext.make),
      newContext: (options) =>
        Effect.acquireRelease(
          use((browser) =>
            browser.newContext(options).then(BrowserContext.make),
          ),
          (context) => context.close.pipe(Effect.ignoreLogged),
        ),
      browserType: () => browser.browserType(),
      version: () => browser.version(),
      isConnected: () => browser.isConnected(),
      bind: (title, options) => use((browser) => browser.bind(title, options)),
      unbind: use((browser) => browser.unbind()),
      eventStream: <K extends keyof BrowserEvents>(event: K) =>
        Stream.asyncPush<BrowserEvents[K]>((emit) =>
          Effect.acquireRelease(
            Effect.sync(() => {
              browser.on(event, emit.single);
              browser.once("disconnected", emit.end);
            }),
            () =>
              Effect.sync(() => {
                browser.off(event, emit.single);
                browser.off("disconnected", emit.end);
              }),
          ),
        ).pipe(
          Stream.map((e) => {
            const mapping = eventMappings[event];
            // biome-ignore lint/suspicious/noExplicitAny: Don't know how to fix this …
            return mapping(e as any) as ReturnType<(typeof eventMappings)[K]>;
          }),
        ),
      use,
    });
  }
}
