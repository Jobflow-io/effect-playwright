/**
 * Effect service wrapper for Playwright browser contexts, including pages,
 * storage state, tracing, credentials, and event streams.
 *
 * @since 0.1.0
 */

import { Context, Effect, identity, Option, Queue, Stream } from "effect";
import type {
  ConsoleMessage,
  BrowserContext as CoreBrowserContext,
  Dialog as CoreDialog,
  Download as CoreDownload,
  Frame as CoreFrame,
  Page as CorePage,
  Request as CoreRequest,
  Response as CoreResponse,
  Worker as CoreWorker,
  WebError,
} from "playwright-core";
import { type Browser, makeBrowser } from "./browser";
import { type Clock, makeClock } from "./clock";
import { Dialog, Download, Request, Response, Worker } from "./common";
import { type Credentials, makeCredentials } from "./credentials";
import type { PlaywrightError } from "./errors";
import { makeFrame } from "./frame";
import { makePage, type Page } from "./page";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import { makeTracing, type Tracing } from "./tracing";
import { useHelper } from "./utils";

interface BrowserContextEvents {
  /** @deprecated Since Playwright 1.56.0. This event is no longer emitted. */
  backgroundpage: CorePage;
  close: CoreBrowserContext;
  console: ConsoleMessage;
  dialog: CoreDialog;
  download: CoreDownload;
  frameattached: CoreFrame;
  framedetached: CoreFrame;
  framenavigated: CoreFrame;
  page: CorePage;
  pageclose: CorePage;
  pageload: CorePage;
  request: CoreRequest;
  requestfailed: CoreRequest;
  requestfinished: CoreRequest;
  response: CoreResponse;
  serviceworker: CoreWorker;
  weberror: WebError;
}

const eventMappings = {
  backgroundpage: (page: CorePage) => makePage(page),
  close: (context: CoreBrowserContext) => makeBrowserContext(context),
  console: identity<ConsoleMessage>,
  dialog: (dialog: CoreDialog) => Dialog.make(dialog),
  download: (download: CoreDownload) => Download.make(download),
  frameattached: (frame: CoreFrame) => makeFrame(frame),
  framedetached: (frame: CoreFrame) => makeFrame(frame),
  framenavigated: (frame: CoreFrame) => makeFrame(frame),
  page: (page: CorePage) => makePage(page),
  pageclose: (page: CorePage) => makePage(page),
  pageload: (page: CorePage) => makePage(page),
  request: (request: CoreRequest) => Request.make(request),
  requestfailed: (request: CoreRequest) => Request.make(request),
  requestfinished: (request: CoreRequest) => Request.make(request),
  response: (response: CoreResponse) => Response.make(response),
  serviceworker: (worker: CoreWorker) => Worker.make(worker),
  weberror: identity<WebError>,
} as const;

type BrowserContextWithPatchedEvents = PatchedEvents<
  CoreBrowserContext,
  BrowserContextEvents
>;

/**
 * Effect-friendly operations for an isolated Playwright browser context.
 *
 * **When to use**
 *
 * Use a context to isolate cookies, permissions, storage, pages, and tracing
 * within one browser. Contexts created by `Browser.newContext` are scoped and
 * close automatically when their scope ends.
 *
 * @category models
 * @since 0.1.0
 */
export interface BrowserContext {
  /**
   * Access the clock.
   */
  readonly clock: Clock;
  /**
   * Access the virtual WebAuthn credentials manager.
   *
   * @see {@link CoreBrowserContext.credentials}
   * @since 0.5.1
   */
  readonly credentials: Credentials;
  /**
   * Access the tracing.
   *
   * @since 0.5.0
   */
  readonly tracing: Tracing;
  /**
   * Returns the list of all open pages in the browser context.
   *
   * @see {@link CoreBrowserContext.pages}
   * @since 0.1.0
   */
  readonly pages: () => Array<Page>;
  /**
   * Opens a new page in the browser context.
   * @see {@link CoreBrowserContext.newPage}
   * @since 0.1.0
   */
  readonly newPage: Effect.Effect<Page, PlaywrightError>;
  /**
   * Closes the browser context.
   *
   * @see {@link CoreBrowserContext.close}
   * @since 0.1.0
   */
  readonly close: Effect.Effect<void, PlaywrightError>;
  /**
   * Indicates that the browser context is in the process of closing or has already been closed.
   *
   * @see {@link CoreBrowserContext.isClosed}
   * @since 0.5.1
   */
  readonly isClosed: () => boolean;
  /**
   * Adds a script which would be evaluated in one of the following scenarios:
   * - Whenever a page is created in the browser context or is navigated.
   * - Whenever a child frame is attached or navigated. In this case, the script is evaluated in the context of the newly attached frame.
   *
   * @see {@link CoreBrowserContext.addInitScript}
   * @since 0.2.0
   */
  readonly addInitScript: <Arg>(
    script: PageFunction<Arg, unknown> | { path?: string; content?: string },
    arg?: Arg,
    options?: Parameters<CoreBrowserContext["addInitScript"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the browser that the context belongs to.
   *
   * @see {@link CoreBrowserContext.browser}
   * @since 0.4.0
   */
  readonly browser: () => Option.Option<Browser>;

  /**
   * Clears the cookies from the browser context.
   *
   * @see {@link CoreBrowserContext.clearCookies}
   * @since 0.4.0
   */
  readonly clearCookies: (options?: {
    name?: string | RegExp;
    domain?: string | RegExp;
    path?: string | RegExp;
  }) => Effect.Effect<void, PlaywrightError>;

  /**
   * Clears the permissions from the browser context.
   *
   * @see {@link CoreBrowserContext.clearPermissions}
   * @since 0.4.0
   */
  readonly clearPermissions: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the cookies for the browser context.
   *
   * @see {@link CoreBrowserContext.cookies}
   * @since 0.4.0
   */
  readonly cookies: (
    urls?: string | string[],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreBrowserContext["cookies"]>>,
    PlaywrightError
  >;

  /**
   * Sets the cookies for the browser context.
   *
   * @see {@link CoreBrowserContext.addCookies}
   * @since 0.4.0
   */
  readonly addCookies: (
    cookies: Parameters<CoreBrowserContext["addCookies"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Grants permissions to the browser context.
   *
   * @see {@link CoreBrowserContext.grantPermissions}
   * @since 0.4.0
   */
  readonly grantPermissions: (
    permissions: Parameters<CoreBrowserContext["grantPermissions"]>[0],
    options?: Parameters<CoreBrowserContext["grantPermissions"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the extra HTTP headers for the browser context.
   *
   * @see {@link CoreBrowserContext.setExtraHTTPHeaders}
   * @since 0.4.0
   */
  readonly setExtraHTTPHeaders: (
    headers: Parameters<CoreBrowserContext["setExtraHTTPHeaders"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the geolocation for the browser context.
   *
   * @see {@link CoreBrowserContext.setGeolocation}
   * @since 0.4.0
   */
  readonly setGeolocation: (
    geolocation: Parameters<CoreBrowserContext["setGeolocation"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the offline state for the browser context.
   *
   * @see {@link CoreBrowserContext.setOffline}
   * @since 0.4.0
   */
  readonly setOffline: (
    offline: boolean,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the default navigation timeout for the browser context.
   *
   * @see {@link CoreBrowserContext.setDefaultNavigationTimeout}
   * @since 0.4.0
   */
  readonly setDefaultNavigationTimeout: (timeout: number) => void;

  /**
   * Sets the default timeout for the browser context.
   *
   * @see {@link CoreBrowserContext.setDefaultTimeout}
   * @since 0.4.0
   */
  readonly setDefaultTimeout: (timeout: number) => void;

  /**
   * Returns storage state for this browser context, contains current cookies, local storage snapshot and IndexedDB
   * snapshot.
   *
   * @see {@link CoreBrowserContext.storageState}
   * @since 0.5.1
   */
  readonly storageState: (
    options?: Parameters<CoreBrowserContext["storageState"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreBrowserContext["storageState"]>>,
    PlaywrightError
  >;

  /**
   * Sets the storage state for the browser context.
   *
   * @see {@link CoreBrowserContext.setStorageState}
   * @since 0.5.0
   */
  readonly setStorageState: (
    options: Parameters<CoreBrowserContext["setStorageState"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Streams browser-context events after adapting their payloads to wrapper
   * values.
   *
   * **Details**
   *
   * Event listeners are removed when stream consumption ends. The stream also
   * ends when the browser context closes.
   *
   * @category event streams
   * @see {@link CoreBrowserContext.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * Service tag for the active {@link BrowserContext}.
 *
 * @category services
 * @since 0.1.0
 */
export const BrowserContext = Context.Service<BrowserContext>(
  "effect-playwright/browser-context/BrowserContext",
);

/**
 * Creates a `BrowserContext` from a Playwright `BrowserContext` instance.
 *
 * @param context - The Playwright `BrowserContext` instance to wrap.
 * @category constructors
 * @since 0.1.0
 */
export const makeBrowserContext = (
  context: CoreBrowserContext,
): BrowserContext => {
  const events = context as BrowserContextWithPatchedEvents;
  const use = useHelper(context);
  return BrowserContext.of({
    clock: makeClock(context.clock),
    credentials: makeCredentials(context.credentials),
    tracing: makeTracing(context.tracing),
    pages: () => context.pages().map(makePage),
    newPage: use((c) => c.newPage().then(makePage)),
    close: use((c) => c.close()),
    isClosed: () => context.isClosed(),
    addInitScript: <Arg>(
      script: PageFunction<Arg, unknown> | { path?: string; content?: string },
      arg?: Arg,
      options?: Parameters<CoreBrowserContext["addInitScript"]>[2],
    ) =>
      use((c) =>
        c.addInitScript<Arg>(
          script as unknown as Parameters<typeof c.addInitScript<Arg>>[0],
          arg,
          options,
        ),
      ).pipe(Effect.asVoid),
    browser: () =>
      Option.fromNullishOr(context.browser()).pipe(Option.map(makeBrowser)),
    clearCookies: (options) => use((c) => c.clearCookies(options)),
    clearPermissions: use((c) => c.clearPermissions()),
    cookies: (urls) => use((c) => c.cookies(urls)),
    addCookies: (cookies) => use((c) => c.addCookies(cookies)),
    grantPermissions: (permissions, options) =>
      use((c) => c.grantPermissions(permissions, options)),
    setExtraHTTPHeaders: (headers) =>
      use((c) => c.setExtraHTTPHeaders(headers)),
    setGeolocation: (geolocation) => use((c) => c.setGeolocation(geolocation)),
    setOffline: (offline) => use((c) => c.setOffline(offline)),
    setDefaultNavigationTimeout: (timeout) =>
      context.setDefaultNavigationTimeout(timeout),
    setDefaultTimeout: (timeout) => context.setDefaultTimeout(timeout),
    storageState: (options) => use((c) => c.storageState(options)),
    setStorageState: (options) => use((c) => c.setStorageState(options)),
    eventStream: <K extends keyof BrowserContextEvents>(event: K) =>
      Stream.callback<BrowserContextEvents[K]>((queue) => {
        const emit = (value: BrowserContextEvents[K]) => {
          Queue.offerUnsafe(queue, value);
        };
        const end = () => {
          Queue.endUnsafe(queue);
        };
        return Effect.acquireRelease(
          Effect.sync(() => {
            events.on(event, emit);
            events.once("close", end);
          }),
          () =>
            Effect.sync(() => {
              events.off(event, emit);
              events.off("close", end);
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
  });
};
