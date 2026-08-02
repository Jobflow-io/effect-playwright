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
import { BrowserContext, type BrowserContextService } from "./browser-context";
import { Clock, type ClockService } from "./clock";
import {
  Dialog,
  Download,
  FileChooser,
  Request,
  Response,
  Worker,
} from "./common";
import type { PlaywrightError } from "./errors";
import { Frame } from "./frame";
import { Keyboard, type KeyboardService } from "./keyboard";
import { Locator } from "./locator";
import { Mouse, type MouseService } from "./mouse";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import { Screencast, type ScreencastService } from "./screencast";
import { Touchscreen, type TouchscreenService } from "./touchscreen";
import { useHelper } from "./utils";
import { WebStorage, type WebStorageService } from "./web-storage";

interface PageEvents {
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

const eventMappings = {
  close: (page: CorePage) => Page.make(page),
  console: identity<ConsoleMessage>,
  crash: (page: CorePage) => Page.make(page),
  dialog: (dialog: CoreDialog) => Dialog.make(dialog),
  domcontentloaded: (page: CorePage) => Page.make(page),
  download: (download: CoreDownload) => Download.make(download),
  filechooser: (fileChooser: CoreFileChooser) => FileChooser.make(fileChooser),
  frameattached: (frame: CoreFrame) => Frame.make(frame),
  framedetached: (frame: CoreFrame) => Frame.make(frame),
  framenavigated: (frame: CoreFrame) => Frame.make(frame),
  load: (page: CorePage) => Page.make(page),
  pageerror: identity<Error>,
  popup: (page: CorePage) => Page.make(page),
  request: (request: CoreRequest) => Request.make(request),
  requestfailed: (request: CoreRequest) => Request.make(request),
  requestfinished: (request: CoreRequest) => Request.make(request),
  response: (response: CoreResponse) => Response.make(response),
  websocket: identity<WebSocket>,
  worker: (worker: CoreWorker) => Worker.make(worker),
} as const;

type PageWithPatchedEvents = PatchedEvents<CorePage, PageEvents>;

/**
 * @category model
 * @since 0.1.0
 */
export interface PageService {
  /**
   * Access the clock.
   *
   * @since 0.3.0
   */
  readonly clock: ClockService;
  /**
   * Access local storage for the page's current origin.
   *
   * @see {@link CorePage.localStorage}
   * @since 0.5.1
   */
  readonly localStorage: WebStorageService;
  /**
   * Access the keyboard.
   *
   * @since 0.3.0
   */
  readonly keyboard: KeyboardService;
  /**
   * Access the mouse.
   *
   * @since 0.3.0
   */
  readonly mouse: MouseService;
  /**
   * Access the touchscreen.
   *
   * @since 0.3.0
   */
  readonly touchscreen: TouchscreenService;
  /**
   * Access the screencast.
   *
   * @since 0.5.0
   */
  readonly screencast: ScreencastService;
  /**
   * Access session storage for the page's current origin.
   *
   * @see {@link CorePage.sessionStorage}
   * @since 0.5.1
   */
  readonly sessionStorage: WebStorageService;
  /**
   * Navigates the page to the given URL.
   *
   * @example
   * ```ts
   * yield* page.goto("https://google.com");
   * ```
   *
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
   * - {@link PageService.goBack}
   * - {@link PageService.goForward}
   * - {@link PageService.goto}
   * - {@link PageService.reload}
   * - {@link PageService.setContent}
   * - {@link PageService.waitForURL}
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
   *
   * @example
   * ```ts
   * yield* page.waitForURL("https://google.com");
   * ```
   *
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
   *
   * @example
   * ```ts
   * yield* page.waitForLoadState("domcontentloaded");
   * ```
   *
   * @see {@link CorePage.waitForLoadState}
   * @since 0.2.0
   */
  readonly waitForLoadState: (
    state?: Parameters<CorePage["waitForLoadState"]>[0],
    options?: Parameters<CorePage["waitForLoadState"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Evaluates a function in the context of the page.
   *
   * @example
   * ```ts
   * const dimensions = yield* page.evaluate(() => ({
   *   width: document.documentElement.clientWidth,
   *   height: document.documentElement.clientHeight
   * }));
   * ```
   *
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
   * import { Browser } from "effect-playwright/browser";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Browser;
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
   * import { Browser } from "effect-playwright/browser";
   *
   * // A custom Database service used in your Effect application
   * class Database extends Context.Tag("Database")<
   *   Database,
   *   { readonly insertProduct: (name: string, price: number) => Effect.Effect<void> }
   * >() {}
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Browser;
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
   * import { Browser } from "effect-playwright/browser";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Browser;
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
   *
   * @example
   * ```ts
   * const title = yield* page.title;
   * ```
   *
   * @see {@link CorePage.title}
   * @since 0.1.0
   */
  readonly title: Effect.Effect<string, PlaywrightError>;
  /**
   * Returns the full HTML contents of the page, including the doctype.
   *
   * @example
   * ```ts
   * const html = yield* page.content;
   * ```
   *
   * @see {@link CorePage.content}
   * @since 0.3.0
   */
  readonly content: Effect.Effect<string, PlaywrightError>;
  /**
   * A generic utility to execute any promise-based method on the underlying Playwright `Page`.
   * Can be used to access any Page functionality not directly exposed by this service.
   *
   * @example
   * ```ts
   * const title = yield* page.use((p) => p.title());
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
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given role.
   *
   * @see {@link CorePage.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<CorePage["getByRole"]>[0],
    options?: Parameters<CorePage["getByRole"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given text.
   *
   * @see {@link CorePage.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<CorePage["getByText"]>[0],
    options?: Parameters<CorePage["getByText"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given label.
   *
   * @see {@link CorePage.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    label: Parameters<CorePage["getByLabel"]>[0],
    options?: Parameters<CorePage["getByLabel"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given test id.
   *
   * @see {@link CorePage.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<CorePage["getByTestId"]>[0],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given alt text.
   *
   * @see {@link CorePage.getByAltText}
   * @since 0.3.0
   */
  readonly getByAltText: (
    text: Parameters<CorePage["getByAltText"]>[0],
    options?: Parameters<CorePage["getByAltText"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given placeholder.
   *
   * @see {@link CorePage.getByPlaceholder}
   * @since 0.3.0
   */
  readonly getByPlaceholder: (
    text: Parameters<CorePage["getByPlaceholder"]>[0],
    options?: Parameters<CorePage["getByPlaceholder"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given title.
   *
   * @see {@link CorePage.getByTitle}
   * @since 0.3.0
   */
  readonly getByTitle: (
    text: Parameters<CorePage["getByTitle"]>[0],
    options?: Parameters<CorePage["getByTitle"]>[1],
  ) => typeof Locator.Service;

  /**
   * Captures a screenshot of the page.
   *
   * @example
   * ```ts
   * const buffer = yield* page.screenshot({ path: "screenshot.png" });
   * ```
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
   * {@link PageService.emulateMedia} before calling `page.pdf()`.
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
   * @example
   * ```ts
   * yield* page.click("button#submit");
   * ```
   * @deprecated Use {@link PageService.locator} to create a locator and then call `click` on it instead.
   * @see {@link CorePage.click}
   * @since 0.1.0
   * @category deprecated
   */
  readonly click: (
    selector: string,
    options?: Parameters<CorePage["click"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Drags a source element to a target element and drops it.
   *
   * @example
   * ```ts
   * yield* page.dragAndDrop("#source", "#target");
   * ```
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
   * @example
   * ```ts
   * yield* page.emulateMedia({ colorScheme: "dark" });
   * yield* page.emulateMedia({ media: "print" });
   * ```
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
   * @example
   * ```ts
   * const response = yield* page.goBack();
   * ```
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
   * @example
   * ```ts
   * const response = yield* page.goForward();
   * ```
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
   * @example
   * ```ts
   * const url = page.url();
   * ```
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
   * @example
   * ```ts
   * const consoleMessages = yield* page.consoleMessages();
   * ```
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
   * @example
   * ```ts
   * const pageErrors = yield* page.pageErrors();
   * ```
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
  readonly pickLocator: Effect.Effect<typeof Locator.Service, PlaywrightError>;

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
  readonly context: () => BrowserContextService;
  /**
   * Returns the opener for popup pages and `Option.none` for others.
   *
   * If the opener has been closed already, returns `Option.none`.
   *
   * @see {@link CorePage.opener}
   * @since 0.3.0
   */
  readonly opener: Effect.Effect<Option.Option<PageService>, PlaywrightError>;
  /**
   * Returns a frame matching the specified criteria.
   *
   * @example
   * ```ts
   * const frame = Option.getOrNull(page.frame("frame-name"));
   * ```
   *
   * @see {@link CorePage.frame}
   * @since 0.3.0
   */
  readonly frame: (
    frameSelector: Parameters<CorePage["frame"]>[0],
  ) => Option.Option<typeof Frame.Service>;

  /**
   * Returns all frames attached to the page.
   *
   * @see {@link CorePage.frames}
   * @since 0.2.0
   */
  readonly frames: Effect.Effect<
    ReadonlyArray<typeof Frame.Service>,
    PlaywrightError
  >;
  /**
   * The page's main frame. Page is guaranteed to have a main frame which persists during navigations.
   *
   * @see {@link CorePage.mainFrame}
   * @since 0.3.0
   */
  readonly mainFrame: () => typeof Frame.Service;
  /**
   * Creates a stream of the given event from the page.
   *
   * @example
   * ```ts
   * const consoleStream = page.eventStream("console");
   * ```
   *
   * @category custom
   * @see {@link CorePage.on}
   * @since 0.1.0
   */
  readonly eventStream: <K extends keyof PageEvents>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class Page extends Context.Tag("effect-playwright/page/Page")<
  Page,
  PageService
>() {
  /**
   * Creates a `Page` from a Playwright `Page` instance.
   *
   * @param page - The Playwright `Page` instance to wrap.
   * @since 0.1.0
   */
  static make(page: PageWithPatchedEvents): PageService {
    const use = useHelper(page);

    return Page.of({
      clock: Clock.make(page.clock),
      localStorage: WebStorage.make(page.localStorage),
      keyboard: Keyboard.make(page.keyboard),
      mouse: Mouse.make(page.mouse),
      touchscreen: Touchscreen.make(page.touchscreen),
      screencast: Screencast.make(page.screencast),
      sessionStorage: WebStorage.make(page.sessionStorage),
      goto: (url, options) => use((p) => p.goto(url, options)),
      setContent: (html, options) => use((p) => p.setContent(html, options)),
      waitForTimeout: (timeout) => use((p) => p.waitForTimeout(timeout)),
      setDefaultNavigationTimeout: (timeout) =>
        page.setDefaultNavigationTimeout(timeout),
      setDefaultTimeout: (timeout) => page.setDefaultTimeout(timeout),
      setExtraHTTPHeaders: (headers) =>
        use((p) => p.setExtraHTTPHeaders(headers)),
      setViewportSize: (viewportSize) =>
        use((p) => p.setViewportSize(viewportSize)),
      viewportSize: () => Option.fromNullable(page.viewportSize()),
      waitForURL: (url, options) => use((p) => p.waitForURL(url, options)),
      waitForLoadState: (state, options) =>
        use((p) => p.waitForLoadState(state, options)),
      title: use((p) => p.title()),
      content: use((p) => p.content()),
      evaluate: <R, Arg>(
        f: PageFunction<Arg, R>,
        arg?: Arg,
        options?: Parameters<CorePage["evaluate"]>[2],
      ) =>
        use((p) =>
          p.evaluate<R, Arg>(
            f as unknown as Parameters<typeof p.evaluate<R, Arg>>[0],
            arg as Arg,
            options,
          ),
        ),
      addInitScript: <Arg>(
        script:
          | PageFunction<Arg, unknown>
          | { path?: string; content?: string },
        arg?: Arg,
        options?: Parameters<CorePage["addInitScript"]>[2],
      ) =>
        use((p) =>
          p.addInitScript<Arg>(
            script as unknown as Parameters<typeof p.addInitScript<Arg>>[0],
            arg,
            options,
          ),
        ).pipe(Effect.asVoid),
      addScriptTag: (options) => use((p) => p.addScriptTag(options)),
      addStyleTag: (options) => use((p) => p.addStyleTag(options)),
      exposeFunction: <A, E, R, Args extends unknown[]>(
        name: string,
        effectFn: (...args: Args) => Effect.Effect<A, E, R>,
      ) =>
        Effect.runtime<R>().pipe(
          Effect.map((r) => Runtime.runPromise(r)),
          Effect.flatMap((runPromise) =>
            use((p) =>
              p.exposeFunction(name, (...args: Args) =>
                runPromise(effectFn(...args)),
              ),
            ),
          ),
        ),
      exposeEffect: <A, E, R>(name: string, effectFn: Effect.Effect<A, E, R>) =>
        Effect.runtime<R>().pipe(
          Effect.map((r) => Runtime.runPromise(r)),
          Effect.flatMap((runPromise) =>
            use((p) => p.exposeFunction(name, () => runPromise(effectFn))),
          ),
        ),
      locator: (selector, options) =>
        Locator.make(page.locator(selector, options)),
      getByRole: (role, options) => Locator.make(page.getByRole(role, options)),
      getByText: (text, options) => Locator.make(page.getByText(text, options)),
      getByLabel: (label, options) =>
        Locator.make(page.getByLabel(label, options)),
      getByTestId: (testId) => Locator.make(page.getByTestId(testId)),
      getByAltText: (text, options) =>
        Locator.make(page.getByAltText(text, options)),
      getByPlaceholder: (text, options) =>
        Locator.make(page.getByPlaceholder(text, options)),
      getByTitle: (text, options) =>
        Locator.make(page.getByTitle(text, options)),
      url: () => page.url(),
      hideHighlight: use((p) => p.hideHighlight()),
      clearConsoleMessages: use((p) => p.clearConsoleMessages()),
      clearPageErrors: use((p) => p.clearPageErrors()),
      consoleMessages: (options) => use((p) => p.consoleMessages(options)),
      pageErrors: (options) => use((p) => p.pageErrors(options)),
      requests: use((p) => p.requests()).pipe(
        Effect.map(Array.map(Request.make)),
      ),
      pickLocator: use((p) => p.pickLocator().then(Locator.make)),
      cancelPickLocator: use((p) => p.cancelPickLocator()),
      ariaSnapshot: (options) => use((p) => p.ariaSnapshot(options)),
      context: () => BrowserContext.make(page.context()),
      opener: use((p) => p.opener()).pipe(
        Effect.map(Option.fromNullable),
        Effect.map(Option.map(Page.make)),
      ),
      workers: () => page.workers().map(Worker.make),

      frame: (frameSelector) =>
        Option.fromNullable(page.frame(frameSelector)).pipe(
          Option.map(Frame.make),
        ),
      frames: use((p) => Promise.resolve(p.frames().map(Frame.make))),
      mainFrame: () => Frame.make(page.mainFrame()),
      reload: use((p) => p.reload()),
      goBack: (options) =>
        use((p) => p.goBack(options)).pipe(
          Effect.map(Option.fromNullable),
          Effect.map(Option.map(Response.make)),
        ),
      goForward: (options) =>
        use((p) => p.goForward(options)).pipe(
          Effect.map(Option.fromNullable),
          Effect.map(Option.map(Response.make)),
        ),
      requestGC: use((p) => p.requestGC()),
      bringToFront: use((p) => p.bringToFront()),
      pause: use((p) => p.pause()),
      close: use((p) => p.close()),
      isClosed: () => page.isClosed(),
      screenshot: (options) => use((p) => p.screenshot(options)),
      pdf: (options) => use((p) => p.pdf(options)),
      dragAndDrop: (source, target, options) =>
        use((p) => p.dragAndDrop(source, target, options)),
      click: (selector, options) => use((p) => p.click(selector, options)),
      emulateMedia: (options) => use((p) => p.emulateMedia(options)),
      eventStream: <K extends keyof PageEvents>(event: K) =>
        Stream.asyncPush<PageEvents[K]>((emit) =>
          Effect.acquireRelease(
            Effect.sync(() => {
              page.on(event, emit.single);
              page.once("close", emit.end);
            }),
            () =>
              Effect.sync(() => {
                page.off(event, emit.single);
                page.off("close", emit.end);
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
