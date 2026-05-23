import { Context, Effect, Queue, Stream } from "effect";
import type { Scope } from "effect/Scope";
import type {
  Browser,
  BrowserContext,
  BrowserType,
  chromium,
} from "playwright-core";
import { PlaywrightBrowserContext } from "./browser-context";
import type { PlaywrightError } from "./errors";
import { PlaywrightPage } from "./page";
import type { PatchedEvents } from "./playwright-types";
import { useHelper } from "./utils";

export type LaunchOptions = Parameters<typeof chromium.launch>[0];
export type NewPageOptions = Parameters<Browser["newPage"]>[0];
export type NewContextOptions = Parameters<Browser["newContext"]>[0];

interface BrowserEvents {
  disconnected: Browser;
  context: BrowserContext;
}

const eventMappings = {
  disconnected: (browser: Browser) => PlaywrightBrowser.make(browser),
  context: (context: BrowserContext) => PlaywrightBrowserContext.make(context),
} as const;

type BrowserWithPatchedEvents = PatchedEvents<Browser, BrowserEvents>;

/**
 * @category model
 * @since 0.1.0
 */
export interface PlaywrightBrowserService {
  /**
   * Opens a new page in the browser.
   *
   * @example
   * ```typescript
   * const page = yield* browser.newPage();
   * ```
   *
   * @param options - Optional options for creating the new page.
   * @returns An effect that resolves to a `PlaywrightPage` service.
   * @see {@link Browser.newPage}
   */
  readonly newPage: (
    options?: NewPageOptions,
  ) => Effect.Effect<PlaywrightPage["Service"], PlaywrightError>;
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
   * @see {@link Browser}
   */
  readonly use: <T>(
    f: (browser: Browser) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
  /**
   * An Effect that closes the browser and all of its pages.
   * @see {@link Browser.close}
   */
  readonly close: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the list of all open browser contexts.
   * @see {@link Browser.contexts}
   */
  readonly contexts: () => Array<PlaywrightBrowserContext["Service"]>;

  readonly newContext: (
    options?: NewContextOptions,
  ) => Effect.Effect<
    PlaywrightBrowserContext["Service"],
    PlaywrightError,
    Scope
  >;

  /**
   * Returns the browser type (chromium, firefox or webkit) that the browser belongs to.
   * @see {@link Browser.browserType}
   */
  readonly browserType: () => BrowserType;

  /**
   * Returns the version of the browser.
   * @see {@link Browser.version}
   */
  readonly version: () => string;
  /**
   * Returns whether the browser is connected.
   * @see {@link Browser.isConnected}
   */
  readonly isConnected: () => boolean;

  /**
   * Binds the browser to a title.
   *
   * @see {@link Browser.bind}
   * @since 0.5.0
   */
  readonly bind: (
    title: string,
    options?: Parameters<Browser["bind"]>[1],
  ) => Effect.Effect<{ endpoint: string }, PlaywrightError>;

  /**
   * Unbinds the browser.
   *
   * @see {@link Browser.unbind}
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
   * @see {@link Browser.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class PlaywrightBrowser extends Context.Service<
  PlaywrightBrowser,
  PlaywrightBrowserService
>()("effect-playwright/PlaywrightBrowser") {
  /**
   * @category constructor
   */
  static make(browser: BrowserWithPatchedEvents): PlaywrightBrowserService {
    const use = useHelper(browser);

    return PlaywrightBrowser.of({
      newPage: (options) =>
        use((browser) => browser.newPage(options).then(PlaywrightPage.make)),
      close: use((browser) => browser.close()),
      contexts: () => browser.contexts().map(PlaywrightBrowserContext.make),
      newContext: (options) =>
        Effect.acquireRelease(
          use((browser) =>
            browser.newContext(options).then(PlaywrightBrowserContext.make),
          ),
          (context) => context.close.pipe(Effect.ignore),
        ),
      browserType: () => browser.browserType(),
      version: () => browser.version(),
      isConnected: () => browser.isConnected(),
      bind: (title, options) => use((browser) => browser.bind(title, options)),
      unbind: use((browser) => browser.unbind()),
      eventStream: <K extends keyof typeof eventMappings>(event: K) =>
        Stream.callback<BrowserEvents[K]>((queue) => {
          const handler = (value: BrowserEvents[K]) =>
            Queue.offerUnsafe(queue, value);
          const closeHandler = () => Queue.endUnsafe(queue);
          return Effect.acquireRelease(
            Effect.sync(() => {
              browser.on(event, handler);
              browser.once("disconnected", closeHandler);
            }),
            () =>
              Effect.sync(() => {
                browser.off(event, handler);
                browser.off("disconnected", closeHandler);
              }),
          );
        }).pipe(
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
