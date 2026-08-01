import { Context, Effect, identity, Option, Stream } from "effect";
import type {
  BrowserContext,
  ConsoleMessage,
  Dialog,
  Download,
  Frame,
  Page,
  Request,
  Response,
  WebError,
  Worker,
} from "playwright-core";
import { PlaywrightBrowser, type PlaywrightBrowserService } from "./browser";
import { PlaywrightClock, type PlaywrightClockService } from "./clock";
import {
  PlaywrightDialog,
  PlaywrightDownload,
  PlaywrightRequest,
  PlaywrightResponse,
  PlaywrightWorker,
} from "./common";
import {
  PlaywrightCredentials,
  type PlaywrightCredentialsService,
} from "./credentials";
import type { PlaywrightError } from "./errors";
import { PlaywrightFrame } from "./frame";
import { PlaywrightPage } from "./page";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import { PlaywrightTracing, type PlaywrightTracingService } from "./tracing";
import { useHelper } from "./utils";

interface BrowserContextEvents {
  /** @deprecated Since Playwright 1.56.0. This event is no longer emitted. */
  backgroundpage: Page;
  close: BrowserContext;
  console: ConsoleMessage;
  dialog: Dialog;
  download: Download;
  frameattached: Frame;
  framedetached: Frame;
  framenavigated: Frame;
  page: Page;
  pageclose: Page;
  pageload: Page;
  request: Request;
  requestfailed: Request;
  requestfinished: Request;
  response: Response;
  serviceworker: Worker;
  weberror: WebError;
}

const eventMappings = {
  backgroundpage: (page: Page) => PlaywrightPage.make(page),
  close: (context: BrowserContext) => PlaywrightBrowserContext.make(context),
  console: identity<ConsoleMessage>,
  dialog: (dialog: Dialog) => PlaywrightDialog.make(dialog),
  download: (download: Download) => PlaywrightDownload.make(download),
  frameattached: (frame: Frame) => PlaywrightFrame.make(frame),
  framedetached: (frame: Frame) => PlaywrightFrame.make(frame),
  framenavigated: (frame: Frame) => PlaywrightFrame.make(frame),
  page: (page: Page) => PlaywrightPage.make(page),
  pageclose: (page: Page) => PlaywrightPage.make(page),
  pageload: (page: Page) => PlaywrightPage.make(page),
  request: (request: Request) => PlaywrightRequest.make(request),
  requestfailed: (request: Request) => PlaywrightRequest.make(request),
  requestfinished: (request: Request) => PlaywrightRequest.make(request),
  response: (response: Response) => PlaywrightResponse.make(response),
  serviceworker: (worker: Worker) => PlaywrightWorker.make(worker),
  weberror: identity<WebError>,
} as const;

type BrowserContextWithPatchedEvents = PatchedEvents<
  BrowserContext,
  BrowserContextEvents
>;

/**
 * @category model
 * @since 0.1.0
 */
export interface PlaywrightBrowserContextService {
  /**
   * Access the clock.
   */
  readonly clock: PlaywrightClockService;
  /**
   * Access the virtual WebAuthn credentials manager.
   *
   * @see {@link BrowserContext.credentials}
   * @since 0.5.1
   */
  readonly credentials: PlaywrightCredentialsService;
  /**
   * Access the tracing.
   *
   * @since 0.5.0
   */
  readonly tracing: PlaywrightTracingService;
  /**
   * Returns the list of all open pages in the browser context.
   *
   * @see {@link BrowserContext.pages}
   * @since 0.1.0
   */
  readonly pages: () => Array<typeof PlaywrightPage.Service>;
  /**
   * Opens a new page in the browser context.
   *
   * @example
   * ```ts
   * const page = yield* context.newPage;
   * ```
   *
   * @see {@link BrowserContext.newPage}
   * @since 0.1.0
   */
  readonly newPage: Effect.Effect<
    typeof PlaywrightPage.Service,
    PlaywrightError
  >;
  /**
   * Closes the browser context.
   *
   * @see {@link BrowserContext.close}
   * @since 0.1.0
   */
  readonly close: Effect.Effect<void, PlaywrightError>;
  /**
   * Indicates that the browser context is in the process of closing or has already been closed.
   *
   * @see {@link BrowserContext.isClosed}
   * @since 0.5.1
   */
  readonly isClosed: () => boolean;
  /**
   * Adds a script which would be evaluated in one of the following scenarios:
   * - Whenever a page is created in the browser context or is navigated.
   * - Whenever a child frame is attached or navigated. In this case, the script is evaluated in the context of the newly attached frame.
   *
   * @see {@link BrowserContext.addInitScript}
   * @since 0.2.0
   */
  readonly addInitScript: <Arg>(
    script: PageFunction<Arg, unknown> | { path?: string; content?: string },
    arg?: Arg,
    options?: Parameters<BrowserContext["addInitScript"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the browser that the context belongs to.
   *
   * @see {@link BrowserContext.browser}
   * @since 0.4.0
   */
  readonly browser: () => Option.Option<PlaywrightBrowserService>;

  /**
   * Clears the cookies from the browser context.
   *
   * @see {@link BrowserContext.clearCookies}
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
   * @see {@link BrowserContext.clearPermissions}
   * @since 0.4.0
   */
  readonly clearPermissions: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the cookies for the browser context.
   *
   * @see {@link BrowserContext.cookies}
   * @since 0.4.0
   */
  readonly cookies: (
    urls?: string | string[],
  ) => Effect.Effect<
    Awaited<ReturnType<BrowserContext["cookies"]>>,
    PlaywrightError
  >;

  /**
   * Sets the cookies for the browser context.
   *
   * @see {@link BrowserContext.addCookies}
   * @since 0.4.0
   */
  readonly addCookies: (
    cookies: Parameters<BrowserContext["addCookies"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Grants permissions to the browser context.
   *
   * @see {@link BrowserContext.grantPermissions}
   * @since 0.4.0
   */
  readonly grantPermissions: (
    permissions: Parameters<BrowserContext["grantPermissions"]>[0],
    options?: Parameters<BrowserContext["grantPermissions"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the extra HTTP headers for the browser context.
   *
   * @see {@link BrowserContext.setExtraHTTPHeaders}
   * @since 0.4.0
   */
  readonly setExtraHTTPHeaders: (
    headers: Parameters<BrowserContext["setExtraHTTPHeaders"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the geolocation for the browser context.
   *
   * @see {@link BrowserContext.setGeolocation}
   * @since 0.4.0
   */
  readonly setGeolocation: (
    geolocation: Parameters<BrowserContext["setGeolocation"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the offline state for the browser context.
   *
   * @see {@link BrowserContext.setOffline}
   * @since 0.4.0
   */
  readonly setOffline: (
    offline: boolean,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the default navigation timeout for the browser context.
   *
   * @see {@link BrowserContext.setDefaultNavigationTimeout}
   * @since 0.4.0
   */
  readonly setDefaultNavigationTimeout: (timeout: number) => void;

  /**
   * Sets the default timeout for the browser context.
   *
   * @see {@link BrowserContext.setDefaultTimeout}
   * @since 0.4.0
   */
  readonly setDefaultTimeout: (timeout: number) => void;

  /**
   * Returns storage state for this browser context, contains current cookies, local storage snapshot and IndexedDB
   * snapshot.
   *
   * @see {@link BrowserContext.storageState}
   * @since 0.5.1
   */
  readonly storageState: (
    options?: Parameters<BrowserContext["storageState"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<BrowserContext["storageState"]>>,
    PlaywrightError
  >;

  /**
   * Sets the storage state for the browser context.
   *
   * @see {@link BrowserContext.setStorageState}
   * @since 0.5.0
   */
  readonly setStorageState: (
    options: Parameters<BrowserContext["setStorageState"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Creates a stream of the given event from the browser context.
   *
   * @example
   * ```ts
   * const pageStream = context.eventStream("page");
   * ```
   *
   * @category custom
   * @see {@link BrowserContext.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class PlaywrightBrowserContext extends Context.Tag(
  "effect-playwright/PlaywrightBrowserContext",
)<PlaywrightBrowserContext, PlaywrightBrowserContextService>() {
  /**
   * Creates a `PlaywrightBrowserContext` from a Playwright `BrowserContext` instance.
   *
   * @param context - The Playwright `BrowserContext` instance to wrap.
   * @since 0.1.0
   */
  static make(
    context: BrowserContextWithPatchedEvents,
  ): PlaywrightBrowserContextService {
    const use = useHelper(context);
    return PlaywrightBrowserContext.of({
      clock: PlaywrightClock.make(context.clock),
      credentials: PlaywrightCredentials.make(context.credentials),
      tracing: PlaywrightTracing.make(context.tracing),
      pages: () => context.pages().map(PlaywrightPage.make),
      newPage: use((c) => c.newPage().then(PlaywrightPage.make)),
      close: use((c) => c.close()),
      isClosed: () => context.isClosed(),
      addInitScript: <Arg>(
        script:
          | PageFunction<Arg, unknown>
          | { path?: string; content?: string },
        arg?: Arg,
        options?: Parameters<BrowserContext["addInitScript"]>[2],
      ) =>
        use((c) =>
          c.addInitScript<Arg>(
            script as unknown as Parameters<typeof c.addInitScript<Arg>>[0],
            arg,
            options,
          ),
        ).pipe(Effect.asVoid),
      browser: () =>
        Option.fromNullable(context.browser()).pipe(
          Option.map(PlaywrightBrowser.make),
        ),
      clearCookies: (options) => use((c) => c.clearCookies(options)),
      clearPermissions: use((c) => c.clearPermissions()),
      cookies: (urls) => use((c) => c.cookies(urls)),
      addCookies: (cookies) => use((c) => c.addCookies(cookies)),
      grantPermissions: (permissions, options) =>
        use((c) => c.grantPermissions(permissions, options)),
      setExtraHTTPHeaders: (headers) =>
        use((c) => c.setExtraHTTPHeaders(headers)),
      setGeolocation: (geolocation) =>
        use((c) => c.setGeolocation(geolocation)),
      setOffline: (offline) => use((c) => c.setOffline(offline)),
      setDefaultNavigationTimeout: (timeout) =>
        context.setDefaultNavigationTimeout(timeout),
      setDefaultTimeout: (timeout) => context.setDefaultTimeout(timeout),
      storageState: (options) => use((c) => c.storageState(options)),
      setStorageState: (options) => use((c) => c.setStorageState(options)),
      eventStream: <K extends keyof BrowserContextEvents>(event: K) =>
        Stream.asyncPush<BrowserContextEvents[K]>((emit) =>
          Effect.acquireRelease(
            Effect.sync(() => {
              context.on(event, emit.single);
              context.once("close", emit.end);
            }),
            () =>
              Effect.sync(() => {
                context.off(event, emit.single);
                context.off("close", emit.end);
              }),
          ),
        ).pipe(
          Stream.map((e) => {
            const mapping = eventMappings[event];
            // biome-ignore lint/suspicious/noExplicitAny: Don't know how to fix this …
            return mapping(e as any) as ReturnType<(typeof eventMappings)[K]>;
          }),
        ),
    });
  }
}
