import { Context, Effect, identity, Option, Stream } from "effect";
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
import { Browser, type BrowserService } from "./browser";
import { Clock, type ClockService } from "./clock";
import { Dialog, Download, Request, Response, Worker } from "./common";
import { Credentials, type CredentialsService } from "./credentials";
import type { PlaywrightError } from "./errors";
import { Frame } from "./frame";
import { Page } from "./page";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import { Tracing, type TracingService } from "./tracing";
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
  backgroundpage: (page: CorePage) => Page.make(page),
  close: (context: CoreBrowserContext) => BrowserContext.make(context),
  console: identity<ConsoleMessage>,
  dialog: (dialog: CoreDialog) => Dialog.make(dialog),
  download: (download: CoreDownload) => Download.make(download),
  frameattached: (frame: CoreFrame) => Frame.make(frame),
  framedetached: (frame: CoreFrame) => Frame.make(frame),
  framenavigated: (frame: CoreFrame) => Frame.make(frame),
  page: (page: CorePage) => Page.make(page),
  pageclose: (page: CorePage) => Page.make(page),
  pageload: (page: CorePage) => Page.make(page),
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
 * @category model
 * @since 0.1.0
 */
export interface BrowserContextService {
  /**
   * Access the clock.
   */
  readonly clock: ClockService;
  /**
   * Access the virtual WebAuthn credentials manager.
   *
   * @see {@link CoreBrowserContext.credentials}
   * @since 0.5.1
   */
  readonly credentials: CredentialsService;
  /**
   * Access the tracing.
   *
   * @since 0.5.0
   */
  readonly tracing: TracingService;
  /**
   * Returns the list of all open pages in the browser context.
   *
   * @see {@link CoreBrowserContext.pages}
   * @since 0.1.0
   */
  readonly pages: () => Array<typeof Page.Service>;
  /**
   * Opens a new page in the browser context.
   *
   * @example
   * ```ts
   * const page = yield* context.newPage;
   * ```
   *
   * @see {@link CoreBrowserContext.newPage}
   * @since 0.1.0
   */
  readonly newPage: Effect.Effect<typeof Page.Service, PlaywrightError>;
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
  readonly browser: () => Option.Option<BrowserService>;

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
   * Creates a stream of the given event from the browser context.
   *
   * @example
   * ```ts
   * const pageStream = context.eventStream("page");
   * ```
   *
   * @category custom
   * @see {@link CoreBrowserContext.on}
   * @since 0.1.2
   */
  readonly eventStream: <K extends keyof typeof eventMappings>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class BrowserContext extends Context.Tag(
  "effect-playwright/browser-context/BrowserContext",
)<BrowserContext, BrowserContextService>() {
  /**
   * Creates a `BrowserContext` from a Playwright `BrowserContext` instance.
   *
   * @param context - The Playwright `BrowserContext` instance to wrap.
   * @since 0.1.0
   */
  static make(context: BrowserContextWithPatchedEvents): BrowserContextService {
    const use = useHelper(context);
    return BrowserContext.of({
      clock: Clock.make(context.clock),
      credentials: Credentials.make(context.credentials),
      tracing: Tracing.make(context.tracing),
      pages: () => context.pages().map(Page.make),
      newPage: use((c) => c.newPage().then(Page.make)),
      close: use((c) => c.close()),
      isClosed: () => context.isClosed(),
      addInitScript: <Arg>(
        script:
          | PageFunction<Arg, unknown>
          | { path?: string; content?: string },
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
        Option.fromNullable(context.browser()).pipe(Option.map(Browser.make)),
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
