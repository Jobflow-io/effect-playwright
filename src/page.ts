/**
 * Effect service wrapper for Playwright pages, including navigation, DOM
 * interaction, evaluation, media capture, and event streams.
 *
 * @since 0.1.0
 */

import {
  Array,
  Context,
  Effect,
  identity,
  Option,
  Runtime,
  Stream,
} from "effect";
import type {
  ConsoleMessage,
  Dialog as CoreDialog,
  Download as CoreDownload,
  FileChooser as CoreFileChooser,
  Frame as CoreFrame,
  Page as CorePage,
  Request as CoreRequest,
  Response as CoreResponse,
  Worker as CoreWorker,
  ElementHandle,
  WebSocket,
} from "playwright-core";
import { type BrowserContext, makeBrowserContext } from "./browser-context";
import { type Clock, makeClock } from "./clock";
import {
  Dialog,
  Download,
  FileChooser,
  Request,
  Response,
  Worker,
} from "./common";
import type { PlaywrightError } from "./errors";
import { type Frame, makeFrame } from "./frame";
import { type Keyboard, makeKeyboard } from "./keyboard";
import { type Locator, makeLocator } from "./locator";
import { type Mouse, makeMouse } from "./mouse";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import { makeScreencast, type Screencast } from "./screencast";
import { makeTouchscreen, type Touchscreen } from "./touchscreen";
import { useHelper } from "./utils";
import { makeWebStorage, type WebStorage } from "./web-storage";

interface CorePageEventMap {
  close: CorePage;
  console: ConsoleMessage;
  crash: CorePage;
  dialog: CoreDialog;
  domcontentloaded: CorePage;
  download: CoreDownload;
  filechooser: CoreFileChooser;
  frameattached: CoreFrame;
  framedetached: CoreFrame;
  framenavigated: CoreFrame;
  load: CorePage;
  pageerror: Error;
  popup: CorePage;
  request: CoreRequest;
  requestfailed: CoreRequest;
  requestfinished: CoreRequest;
  response: CoreResponse;
  websocket: WebSocket;
  worker: CoreWorker;
}
/**
 * Values emitted by {@link Page.eventStream} for each supported page event.
 * Native Playwright values are converted to Effect Playwright wrappers where
 * a wrapper is available.
 *
 * @category models
 * @since 0.7.0
 */
export interface PageEventMap {
  readonly close: Page;
  readonly console: ConsoleMessage;
  readonly crash: Page;
  readonly dialog: Dialog;
  readonly domcontentloaded: Page;
  readonly download: Download;
  readonly filechooser: FileChooser;
  readonly frameattached: Frame;
  readonly framedetached: Frame;
  readonly framenavigated: Frame;
  readonly load: Page;
  readonly pageerror: Error;
  readonly popup: Page;
  readonly request: Request;
  readonly requestfailed: Request;
  readonly requestfinished: Request;
  readonly response: Response;
  readonly websocket: WebSocket;
  readonly worker: Worker;
}

const eventMappings = {
  close: (page: CorePage) => makePage(page),
  console: identity<ConsoleMessage>,
  crash: (page: CorePage) => makePage(page),
  dialog: (dialog: CoreDialog) => Dialog.make(dialog),
  domcontentloaded: (page: CorePage) => makePage(page),
  download: (download: CoreDownload) => Download.make(download),
  filechooser: (fileChooser: CoreFileChooser) => FileChooser.make(fileChooser),
  frameattached: (frame: CoreFrame) => makeFrame(frame),
  framedetached: (frame: CoreFrame) => makeFrame(frame),
  framenavigated: (frame: CoreFrame) => makeFrame(frame),
  load: (page: CorePage) => makePage(page),
  pageerror: identity<Error>,
  popup: (page: CorePage) => makePage(page),
  request: (request: CoreRequest) => Request.make(request),
  requestfailed: (request: CoreRequest) => Request.make(request),
  requestfinished: (request: CoreRequest) => Request.make(request),
  response: (response: CoreResponse) => Response.make(response),
  websocket: identity<WebSocket>,
  worker: (worker: CoreWorker) => Worker.make(worker),
} as const satisfies {
  readonly [K in keyof CorePageEventMap]: (
    value: CorePageEventMap[K],
  ) => PageEventMap[K];
};

type PageWithPatchedEvents = PatchedEvents<CorePage, CorePageEventMap>;

/**
 * Effect-friendly operations for a Playwright page.
 *
 * **When to use**
 *
 * Use this service for navigation, DOM interaction, evaluation, page state,
 * and page event streams. Operations that can fail return `Effect`; safe
 * synchronous observations remain plain functions, and nullable Playwright
 * results are represented with `Option`.
 *
 * @category models
 * @since 0.1.0
 */
export interface Page {
  /**
   * Access the clock.
   *
   * @since 0.3.0
   */
  readonly clock: Clock;
  /**
   * Access local storage for the page's current origin.
   *
   * @see {@link CorePage.localStorage}
   * @since 0.5.1
   */
  readonly localStorage: WebStorage;
  /**
   * Access the keyboard.
   *
   * @since 0.3.0
   */
  readonly keyboard: Keyboard;
  /**
   * Access the mouse.
   *
   * @since 0.3.0
   */
  readonly mouse: Mouse;
  /**
   * Access the touchscreen.
   *
   * @since 0.3.0
   */
  readonly touchscreen: Touchscreen;
  /**
   * Access the screencast.
   *
   * @since 0.5.0
   */
  readonly screencast: Screencast;
  /**
   * Access session storage for the page's current origin.
   *
   * @see {@link CorePage.sessionStorage}
   * @since 0.5.1
   */
  readonly sessionStorage: WebStorage;
  /**
   * Navigates the page to the given URL.
   * @see {@link CorePage.goto}
   * @since 0.1.0
   */
  readonly goto: (
    url: string,
    options?: Parameters<CorePage["goto"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * This method internally calls [document.write()](https://developer.mozilla.org/en-US/docs/Web/API/Document/write),
   * inheriting all its specific characteristics and behaviors.
   *
   * @see {@link CorePage.setContent}
   * @since 0.3.0
   */
  readonly setContent: (
    html: string,
    options?: Parameters<CorePage["setContent"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Waits for the given timeout in milliseconds.
   *
   * @see {@link CorePage.waitForTimeout}
   * @since 0.4.0
   */
  readonly waitForTimeout: (
    timeout: number,
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * This setting will change the default maximum navigation time for the following methods:
   * - {@link Page.goBack}
   * - {@link Page.goForward}
   * - {@link Page.goto}
   * - {@link Page.reload}
   * - {@link Page.setContent}
   * - {@link Page.waitForURL}
   *
   * @see {@link CorePage.setDefaultNavigationTimeout}
   * @since 0.3.0
   */
  readonly setDefaultNavigationTimeout: (
    timeout: Parameters<CorePage["setDefaultNavigationTimeout"]>[0],
  ) => void;
  /**
   * This setting will change the default maximum time for all the methods accepting `timeout` option.
   *
   * @see {@link CorePage.setDefaultTimeout}
   * @since 0.3.0
   */
  readonly setDefaultTimeout: (
    timeout: Parameters<CorePage["setDefaultTimeout"]>[0],
  ) => void;
  /**
   * The extra HTTP headers will be sent with every request the page initiates.
   *
   * @see {@link CorePage.setExtraHTTPHeaders}
   * @since 0.3.0
   */
  readonly setExtraHTTPHeaders: (
    headers: Parameters<CorePage["setExtraHTTPHeaders"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Sets the viewport size for the page.
   *
   * @see {@link CorePage.setViewportSize}
   * @since 0.3.0
   */
  readonly setViewportSize: (
    viewportSize: Parameters<CorePage["setViewportSize"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Returns the viewport size.
   *
   * @see {@link CorePage.viewportSize}
   * @since 0.3.0
   */
  readonly viewportSize: () => Option.Option<{ width: number; height: number }>;
  /**
   * Waits for the page to navigate to the given URL.
   * @see {@link CorePage.waitForURL}
   * @since 0.1.0
   */
  readonly waitForURL: (
    url: Parameters<CorePage["waitForURL"]>[0],
    options?: Parameters<CorePage["waitForURL"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Waits for the page to reach the given load state.
   *
   * NOTE: Most of the time, this method is not needed because Playwright auto-waits before every action.
   * @see {@link CorePage.waitForLoadState}
   * @since 0.2.0
   */
  readonly waitForLoadState: (
    state?: Parameters<CorePage["waitForLoadState"]>[0],
    options?: Parameters<CorePage["waitForLoadState"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Evaluates a function in the context of the page.
   * **Example** (Evaluating browser-side code)
   *
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const dimensions = Effect.gen(function* () {
   *   const page = yield* Playwright.Page;
   *   return yield* page.evaluate(() => ({
   *     width: document.documentElement.clientWidth,
   *     height: document.documentElement.clientHeight,
   *   }));
   * });
   * ```
   * @see {@link CorePage.evaluate}
   * @since 0.1.0
   */
  readonly evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
    options?: Parameters<CorePage["evaluate"]>[2],
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * Adds a script which would be evaluated in one of the following scenarios:
   * - Whenever the page is navigated.
   * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the newly attached frame.
   *
   * @see {@link CorePage.addInitScript}
   * @since 0.3.0
   */
  readonly addInitScript: <Arg>(
    script: PageFunction<Arg, unknown> | { path?: string; content?: string },
    arg?: Arg,
    options?: Parameters<CorePage["addInitScript"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Adds a `<script>` tag into the page with the desired url or content.
   *
   * @see {@link CorePage.addScriptTag}
   * @since 0.3.0
   */
  readonly addScriptTag: (
    options: Parameters<CorePage["addScriptTag"]>[0],
  ) => Effect.Effect<ElementHandle, PlaywrightError>;
  /**
   * Adds a function called `name` on the `window` object of every frame in this page.
   *
   * The provided function must return an `Effect` which will be executed using the
   * current runtime when the function is called from the browser context.
   *
   * If you don't require your function to have args you can use {@link exposeEffect} instead.
   *
   * @example
   * ```ts
   * import { Console, Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   const page = yield* browser.newPage();
   *
   *   // Expose an Effect-based function to the browser
   *   yield* page.exposeFunction("logMessage", (message: string) =>
   *     Console.log(`Message from browser: ${message}`),
   *   );
   *
   *   yield* page.evaluate(() => {
   *     // Call the exposed function from the browser context
   *     // @ts-expect-error
   *     return window.logMessage("Hello from the other side!");
   *   });
   * });
   * ```
   *
   * @example
   * ```ts
   * import { Context, Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * // A custom Database service used in your Effect application
   * class Database extends Context.Tag("Database")<
   *   Database,
   *   { readonly insertProduct: (name: string, price: number) => Effect.Effect<void> }
   * >() {}
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   const page = yield* browser.newPage();
   *
   *   // Expose a function that seamlessly accesses Effect Context using Effect.fn
   *   yield* page.exposeFunction(
   *     "saveProduct",
   *     Effect.fn(function* (name: string, price: number) {
   *       const db = yield* Database;
   *       yield* db.insertProduct(name, price);
   *     }),
   *   );
   *
   *   yield* page.evaluate(async () => {
   *     // Extract data from the page and save it
   *     const items = document.querySelectorAll(".product");
   *     for (const item of items) {
   *       const name = item.querySelector(".name")?.textContent || "Unknown";
   *       const price = Number(item.querySelector(".price")?.textContent || 0);
   *
   *       // Call the Effect function directly from the browser
   *       // @ts-expect-error
   *       await window.saveProduct(name, price);
   *     }
   *   });
   * });
   * ```
   *
   *
   * @see {@link CorePage.exposeFunction}
   * @since 0.3.0
   */
  readonly exposeFunction: <A, E, R, Args extends unknown[]>(
    name: Parameters<CorePage["exposeFunction"]>[0],
    playwrightFunction: (...args: Args) => Effect.Effect<A, E, R>,
  ) => Effect.Effect<void, PlaywrightError, R>;

  /**
   * Identical to {@link exposeFunction} but meant to be used with a static `Effect`.
   * This is useful when the exposed function does not need any arguments and just
   * runs a pre-defined effect in the application context.
   *
   * @example
   * ```ts
   * import { Console, Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   const page = yield* browser.newPage();
   *
   *   yield* page.exposeEffect("ping", Console.log("pong"));
   *
   *   yield* page.evaluate(async () => {
   *     // @ts-expect-error
   *     await window.ping();
   *   });
   * });
   * ```
   *
   * @see {@link CorePage.exposeFunction}
   * @since 0.3.0
   */
  readonly exposeEffect: <A, E, R>(
    name: Parameters<CorePage["exposeFunction"]>[0],
    playwrightFunction: Effect.Effect<A, E, R>,
  ) => Effect.Effect<void, PlaywrightError, R>;
  /**
   * Adds a `<link rel="stylesheet">` tag into the page with the desired url or a `<style type="text/css">` tag with the content.
   *
   * @see {@link CorePage.addStyleTag}
   * @since 0.3.0
   */
  readonly addStyleTag: (
    options: Parameters<CorePage["addStyleTag"]>[0],
  ) => Effect.Effect<ElementHandle, PlaywrightError>;
  /**
   * Returns the page title.
   * @see {@link CorePage.title}
   * @since 0.1.0
   */
  readonly title: Effect.Effect<string, PlaywrightError>;
  /**
   * Returns the full HTML contents of the page, including the doctype.
   * @see {@link CorePage.content}
   * @since 0.3.0
   */
  readonly content: Effect.Effect<string, PlaywrightError>;
  /**
   * Runs an asynchronous operation against the underlying Playwright `Page`.
   *
   * **When to use**
   *
   * Use this escape hatch only when {@link Page} does not expose the native
   * Playwright operation you need.
   *
   * **Gotchas**
   *
   * The callback must return a `Promise`. The native page has the same lifetime
   * as this wrapper; closing it also closes the wrapped page.
   *
   * @example
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const program = Effect.gen(function* () {
   *   const page = yield* Playwright.Page;
   *   return yield* page.use((nativePage) => nativePage.title());
   * });
   * ```
   *
   * @see {@link CorePage}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (page: CorePage) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
  /**
   * Returns a locator for the given selector.
   *
   * NOTE: This method will cause a defect if `options.has` or `options.hasNot` are provided and belong to a different frame.
   *
   * @see {@link CorePage.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selector: string,
    options?: Parameters<CorePage["locator"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given role.
   *
   * @see {@link CorePage.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<CorePage["getByRole"]>[0],
    options?: Parameters<CorePage["getByRole"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given text.
   *
   * @see {@link CorePage.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<CorePage["getByText"]>[0],
    options?: Parameters<CorePage["getByText"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given label.
   *
   * @see {@link CorePage.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    label: Parameters<CorePage["getByLabel"]>[0],
    options?: Parameters<CorePage["getByLabel"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given test id.
   *
   * @see {@link CorePage.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<CorePage["getByTestId"]>[0],
  ) => Locator;
  /**
   * Returns a locator that matches the given alt text.
   *
   * @see {@link CorePage.getByAltText}
   * @since 0.3.0
   */
  readonly getByAltText: (
    text: Parameters<CorePage["getByAltText"]>[0],
    options?: Parameters<CorePage["getByAltText"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given placeholder.
   *
   * @see {@link CorePage.getByPlaceholder}
   * @since 0.3.0
   */
  readonly getByPlaceholder: (
    text: Parameters<CorePage["getByPlaceholder"]>[0],
    options?: Parameters<CorePage["getByPlaceholder"]>[1],
  ) => Locator;
  /**
   * Returns a locator that matches the given title.
   *
   * @see {@link CorePage.getByTitle}
   * @since 0.3.0
   */
  readonly getByTitle: (
    text: Parameters<CorePage["getByTitle"]>[0],
    options?: Parameters<CorePage["getByTitle"]>[1],
  ) => Locator;

  /**
   * Captures a screenshot of the page.
   *
   * @see {@link CorePage.screenshot}
   * @since 0.3.0
   */
  readonly screenshot: (
    options?: Parameters<CorePage["screenshot"]>[0],
  ) => Effect.Effect<Buffer, PlaywrightError>;

  /**
   * Returns the PDF buffer.
   *
   * `page.pdf()` generates a pdf of the page with `print` css media. To generate a pdf with `screen` media, call
   * {@link Page.emulateMedia} before calling `page.pdf()`.
   *
   * @see {@link CorePage.pdf}
   * @since 0.3.0
   */
  readonly pdf: (
    options?: Parameters<CorePage["pdf"]>[0],
  ) => Effect.Effect<Buffer, PlaywrightError>;

  /**
   * Clicks an element matching the given selector.
   *
   * @deprecated Use {@link Page.locator} to create a locator and then call `click` on it instead.
   * @see {@link CorePage.click}
   * @since 0.1.0
   */
  readonly click: (
    selector: string,
    options?: Parameters<CorePage["click"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Drags a source element to a target element and drops it.
   *
   * @see {@link CorePage.dragAndDrop}
   * @since 0.3.0
   */
  readonly dragAndDrop: (
    source: Parameters<CorePage["dragAndDrop"]>[0],
    target: Parameters<CorePage["dragAndDrop"]>[1],
    options?: Parameters<CorePage["dragAndDrop"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * This method changes the CSS media type through the media argument,
   * and/or the 'prefers-colors-scheme' media feature, using the colorScheme argument.
   *
   * @see {@link CorePage.emulateMedia}
   * @since 0.3.0
   */
  readonly emulateMedia: (
    options?: Parameters<CorePage["emulateMedia"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Reloads the page.
   *
   * @see {@link CorePage.reload}
   * @since 0.1.0
   */
  readonly reload: Effect.Effect<void, PlaywrightError>;
  /**
   * Navigate to the previous page in history.
   *
   * @see {@link CorePage.goBack}
   * @since 0.3.0
   */
  readonly goBack: (
    options?: Parameters<CorePage["goBack"]>[0],
  ) => Effect.Effect<Option.Option<Response>, PlaywrightError>;
  /**
   * Navigate to the next page in history.
   *
   * @see {@link CorePage.goForward}
   * @since 0.3.0
   */
  readonly goForward: (
    options?: Parameters<CorePage["goForward"]>[0],
  ) => Effect.Effect<Option.Option<Response>, PlaywrightError>;
  /**
   * Request the page to perform garbage collection. Note that there is no guarantee that all unreachable objects will
   * be collected.
   *
   * @see {@link CorePage.requestGC}
   * @since 0.3.0
   */
  readonly requestGC: Effect.Effect<void, PlaywrightError>;
  /**
   * Brings page to front (activates tab).
   *
   * @see {@link CorePage.bringToFront}
   * @since 0.3.0
   */
  readonly bringToFront: Effect.Effect<void, PlaywrightError>;
  /**
   * Pauses the script execution.
   *
   * @see {@link CorePage.pause}
   * @since 0.3.0
   */
  readonly pause: Effect.Effect<void, PlaywrightError>;
  /**
   * Closes the page.
   *
   * @see {@link CorePage.close}
   * @since 0.1.0
   */
  readonly close: Effect.Effect<void, PlaywrightError>;
  /**
   * Indicates that the page has been closed.
   *
   * @see {@link CorePage.isClosed}
   * @since 0.3.0
   */
  readonly isClosed: () => boolean;

  /**
   * Returns the current URL of the page.
   *
   * @see {@link CorePage.url}
   * @since 0.1.0
   */
  readonly url: () => string;

  /**
   * Clears all highlights.
   *
   * @see {@link CorePage.hideHighlight}
   * @since 0.5.0
   */
  readonly hideHighlight: Effect.Effect<void, PlaywrightError>;

  /**
   * Clears stored console messages.
   *
   * @see {@link CorePage.clearConsoleMessages}
   * @since 0.5.0
   */
  readonly clearConsoleMessages: Effect.Effect<void, PlaywrightError>;

  /**
   * Clears stored page errors.
   *
   * @see {@link CorePage.clearPageErrors}
   * @since 0.5.0
   */
  readonly clearPageErrors: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns all messages that have been logged to the console.
   *
   * @see {@link CorePage.consoleMessages}
   * @since 0.3.0
   */
  readonly consoleMessages: (
    options?: Parameters<CorePage["consoleMessages"]>[0],
  ) => Effect.Effect<ReadonlyArray<ConsoleMessage>, PlaywrightError>;

  /**
   * Returns all errors that have been thrown in the page.
   *
   * @see {@link CorePage.pageErrors}
   * @since 0.3.0
   */
  readonly pageErrors: (
    options?: Parameters<CorePage["pageErrors"]>[0],
  ) => Effect.Effect<ReadonlyArray<Error>, PlaywrightError>;

  /**
   * Returns the most recent network requests from the page.
   *
   * @see {@link CorePage.requests}
   * @since 0.5.0
   */
  readonly requests: Effect.Effect<ReadonlyArray<Request>, PlaywrightError>;

  /**
   * Enters an interactive mode where hovering over elements highlights them and shows the corresponding locator.
   *
   * @see {@link CorePage.pickLocator}
   * @since 0.5.0
   */
  readonly pickLocator: Effect.Effect<Locator, PlaywrightError>;

  /**
   * Cancels the locator picking mode.
   *
   * @see {@link CorePage.cancelPickLocator}
   * @since 0.5.0
   */
  readonly cancelPickLocator: Effect.Effect<void, PlaywrightError>;

  /**
   * Captures the aria snapshot of the page.
   *
   * @see {@link CorePage.ariaSnapshot}
   * @since 0.5.0
   */
  readonly ariaSnapshot: (
    options?: Parameters<CorePage["ariaSnapshot"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;

  /**
   * Returns all workers.
   *
   * @see {@link CorePage.workers}
   * @since 0.3.0
   */
  readonly workers: () => ReadonlyArray<Worker>;

  /**
   * Get the browser context that the page belongs to.
   *
   * @see {@link CorePage.context}
   * @since 0.3.0
   */
  readonly context: () => BrowserContext;
  /**
   * Returns the opener for popup pages and `Option.none` for others.
   *
   * If the opener has been closed already, returns `Option.none`.
   *
   * @see {@link CorePage.opener}
   * @since 0.3.0
   */
  readonly opener: Effect.Effect<Option.Option<Page>, PlaywrightError>;
  /**
   * Returns a frame matching the specified criteria.
   *
   * @see {@link CorePage.frame}
   * @since 0.3.0
   */
  readonly frame: (
    frameSelector: Parameters<CorePage["frame"]>[0],
  ) => Option.Option<Frame>;

  /**
   * Returns all frames attached to the page.
   *
   * @see {@link CorePage.frames}
   * @since 0.2.0
   */
  readonly frames: Effect.Effect<ReadonlyArray<Frame>, PlaywrightError>;
  /**
   * The page's main frame. Page is guaranteed to have a main frame which persists during navigations.
   *
   * @see {@link CorePage.mainFrame}
   * @since 0.3.0
   */
  readonly mainFrame: () => Frame;
  /**
   * Streams page events after adapting supported payloads to wrapper values.
   *
   * **Details**
   *
   * Event listeners are removed when stream consumption ends. The stream also
   * ends when the page closes.
   *
   * **Example** (Reading the first console event)
   *
   * ```ts
   * import { Effect, Stream } from "effect";
   * import { Playwright } from "effect-playwright";
   *
   * const firstConsoleMessage = Effect.gen(function* () {
   *   const page = yield* Playwright.Page;
   *   return yield* page.eventStream("console").pipe(Stream.runHead);
   * });
   * ```
   *
   * @category event streams
   * @see {@link CorePage.on}
   * @since 0.1.0
   */
  readonly eventStream: <K extends keyof PageEventMap>(
    event: K,
  ) => Stream.Stream<PageEventMap[K]>;
}

/**
 * Service tag for the active {@link Page}.
 *
 * @category services
 * @since 0.1.0
 */
export const Page = Context.GenericTag<Page>("effect-playwright/page/Page");

/**
 * Creates a `Page` from a Playwright `Page` instance.
 *
 * @param page - The Playwright `Page` instance to wrap.
 * @category constructors
 * @since 0.1.0
 */
export const makePage = (page: CorePage): Page => {
  const events = page as PageWithPatchedEvents;
  const use = useHelper(page);

  return Page.of({
    clock: makeClock(page.clock),
    localStorage: makeWebStorage(page.localStorage),
    keyboard: makeKeyboard(page.keyboard),
    mouse: makeMouse(page.mouse),
    touchscreen: makeTouchscreen(page.touchscreen),
    screencast: makeScreencast(page.screencast),
    sessionStorage: makeWebStorage(page.sessionStorage),
    goto: (url, options) => use((page) => page.goto(url, options)),
    setContent: (html, options) =>
      use((page) => page.setContent(html, options)),
    waitForTimeout: (timeout) => use((page) => page.waitForTimeout(timeout)),
    setDefaultNavigationTimeout: (timeout) =>
      page.setDefaultNavigationTimeout(timeout),
    setDefaultTimeout: (timeout) => page.setDefaultTimeout(timeout),
    setExtraHTTPHeaders: (headers) =>
      use((page) => page.setExtraHTTPHeaders(headers)),
    setViewportSize: (viewportSize) =>
      use((page) => page.setViewportSize(viewportSize)),
    viewportSize: () => Option.fromNullable(page.viewportSize()),
    waitForURL: (url, options) => use((page) => page.waitForURL(url, options)),
    waitForLoadState: (state, options) =>
      use((page) => page.waitForLoadState(state, options)),
    title: use((page) => page.title()),
    content: use((page) => page.content()),
    evaluate: <R, Arg>(
      fn: PageFunction<Arg, R>,
      arg?: Arg,
      options?: Parameters<CorePage["evaluate"]>[2],
    ) =>
      use((page) =>
        page.evaluate<R, Arg>(
          fn as unknown as Parameters<typeof page.evaluate<R, Arg>>[0],
          arg as Arg,
          options,
        ),
      ),
    addInitScript: <Arg>(
      script: PageFunction<Arg, unknown> | { path?: string; content?: string },
      arg?: Arg,
      options?: Parameters<CorePage["addInitScript"]>[2],
    ) =>
      use((page) =>
        page.addInitScript<Arg>(
          script as unknown as Parameters<typeof page.addInitScript<Arg>>[0],
          arg,
          options,
        ),
      ).pipe(Effect.asVoid),
    addScriptTag: (options) => use((page) => page.addScriptTag(options)),
    addStyleTag: (options) => use((page) => page.addStyleTag(options)),
    exposeFunction: <A, E, R, Args extends unknown[]>(
      name: string,
      effectFn: (...args: Args) => Effect.Effect<A, E, R>,
    ) =>
      Effect.runtime<R>().pipe(
        Effect.map((runtime) => Runtime.runPromise(runtime)),
        Effect.flatMap((runPromise) =>
          use((page) =>
            page.exposeFunction(name, (...args: Args) =>
              runPromise(effectFn(...args)),
            ),
          ),
        ),
      ),
    exposeEffect: <A, E, R>(name: string, effectFn: Effect.Effect<A, E, R>) =>
      Effect.runtime<R>().pipe(
        Effect.map((runtime) => Runtime.runPromise(runtime)),
        Effect.flatMap((runPromise) =>
          use((page) => page.exposeFunction(name, () => runPromise(effectFn))),
        ),
      ),
    locator: (selector, options) =>
      makeLocator(page.locator(selector, options)),
    getByRole: (role, options) => makeLocator(page.getByRole(role, options)),
    getByText: (text, options) => makeLocator(page.getByText(text, options)),
    getByLabel: (label, options) =>
      makeLocator(page.getByLabel(label, options)),
    getByTestId: (testId) => makeLocator(page.getByTestId(testId)),
    getByAltText: (text, options) =>
      makeLocator(page.getByAltText(text, options)),
    getByPlaceholder: (text, options) =>
      makeLocator(page.getByPlaceholder(text, options)),
    getByTitle: (text, options) => makeLocator(page.getByTitle(text, options)),
    url: () => page.url(),
    hideHighlight: use((page) => page.hideHighlight()),
    clearConsoleMessages: use((page) => page.clearConsoleMessages()),
    clearPageErrors: use((page) => page.clearPageErrors()),
    consoleMessages: (options) => use((page) => page.consoleMessages(options)),
    pageErrors: (options) => use((page) => page.pageErrors(options)),
    requests: use((page) => page.requests()).pipe(
      Effect.map(Array.map(Request.make)),
    ),
    pickLocator: use((page) => page.pickLocator().then(makeLocator)),
    cancelPickLocator: use((page) => page.cancelPickLocator()),
    ariaSnapshot: (options) => use((page) => page.ariaSnapshot(options)),
    context: () => makeBrowserContext(page.context()),
    opener: use((page) => page.opener()).pipe(
      Effect.map(Option.fromNullable),
      Effect.map(Option.map(makePage)),
    ),
    workers: () => page.workers().map(Worker.make),
    frame: (frameSelector) =>
      Option.fromNullable(page.frame(frameSelector)).pipe(
        Option.map(makeFrame),
      ),
    frames: use((page) => Promise.resolve(page.frames().map(makeFrame))),
    mainFrame: () => makeFrame(page.mainFrame()),
    reload: use((page) => page.reload()),
    goBack: (options) =>
      use((page) => page.goBack(options)).pipe(
        Effect.map(Option.fromNullable),
        Effect.map(Option.map(Response.make)),
      ),
    goForward: (options) =>
      use((page) => page.goForward(options)).pipe(
        Effect.map(Option.fromNullable),
        Effect.map(Option.map(Response.make)),
      ),
    requestGC: use((page) => page.requestGC()),
    bringToFront: use((page) => page.bringToFront()),
    pause: use((page) => page.pause()),
    close: use((page) => page.close()),
    isClosed: () => page.isClosed(),
    screenshot: (options) => use((page) => page.screenshot(options)),
    pdf: (options) => use((page) => page.pdf(options)),
    dragAndDrop: (source, target, options) =>
      use((page) => page.dragAndDrop(source, target, options)),
    click: (selector, options) => use((page) => page.click(selector, options)),
    emulateMedia: (options) => use((page) => page.emulateMedia(options)),
    eventStream: <K extends keyof PageEventMap>(event: K) =>
      Stream.asyncPush<CorePageEventMap[K]>((emit) =>
        Effect.acquireRelease(
          Effect.sync(() => {
            events.on(event, emit.single);
            events.once("close", emit.end);
          }),
          () =>
            Effect.sync(() => {
              events.off(event, emit.single);
              events.off("close", emit.end);
            }),
        ),
      ).pipe(
        Stream.map((value) => {
          const mapping = eventMappings[event];
          // The selected event and mapping share the same generic event key.
          return mapping(value as never) as PageEventMap[K];
        }),
      ),
    use,
  });
};
