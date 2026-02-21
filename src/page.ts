import { Context, Effect, identity, Option, Runtime, Stream } from "effect";
import type {
  ConsoleMessage,
  Dialog,
  Download,
  ElementHandle,
  FileChooser,
  Frame,
  Page,
  Request,
  Response,
  WebSocket,
  Worker,
} from "playwright-core";
import {
  PlaywrightBrowserContext,
  type PlaywrightBrowserContextService,
} from "./browser-context";
import { PlaywrightClock, type PlaywrightClockService } from "./clock";
import {
  PlaywrightDialog,
  PlaywrightDownload,
  PlaywrightFileChooser,
  PlaywrightRequest,
  PlaywrightResponse,
  PlaywrightWorker,
} from "./common";
import type { PlaywrightError } from "./errors";
import { PlaywrightFrame } from "./frame";
import { PlaywrightKeyboard, type PlaywrightKeyboardService } from "./keyboard";
import { PlaywrightLocator } from "./locator";
import { PlaywrightMouse, type PlaywrightMouseService } from "./mouse";
import type { PageFunction, PatchedEvents } from "./playwright-types";
import {
  PlaywrightTouchscreen,
  type PlaywrightTouchscreenService,
} from "./touchscreen";
import { useHelper } from "./utils";

interface PageEvents {
  close: Page;
  console: ConsoleMessage;
  crash: Page;
  dialog: Dialog;
  domcontentloaded: Page;
  download: Download;
  filechooser: FileChooser;
  frameattached: Frame;
  framedetached: Frame;
  framenavigated: Frame;
  load: Page;
  pageerror: Error;
  popup: Page;
  request: Request;
  requestfailed: Request;
  requestfinished: Request;
  response: Response;
  websocket: WebSocket;
  worker: Worker;
}

const eventMappings = {
  close: (page: Page) => PlaywrightPage.make(page),
  console: identity<ConsoleMessage>,
  crash: (page: Page) => PlaywrightPage.make(page),
  dialog: (dialog: Dialog) => PlaywrightDialog.make(dialog),
  domcontentloaded: (page: Page) => PlaywrightPage.make(page),
  download: (download: Download) => PlaywrightDownload.make(download),
  filechooser: (fileChooser: FileChooser) =>
    PlaywrightFileChooser.make(fileChooser),
  frameattached: (frame: Frame) => PlaywrightFrame.make(frame),
  framedetached: (frame: Frame) => PlaywrightFrame.make(frame),
  framenavigated: (frame: Frame) => PlaywrightFrame.make(frame),
  load: (page: Page) => PlaywrightPage.make(page),
  pageerror: identity<Error>,
  popup: (page: Page) => PlaywrightPage.make(page),
  request: (request: Request) => PlaywrightRequest.make(request),
  requestfailed: (request: Request) => PlaywrightRequest.make(request),
  requestfinished: (request: Request) => PlaywrightRequest.make(request),
  response: (response: Response) => PlaywrightResponse.make(response),
  websocket: identity<WebSocket>,
  worker: (worker: Worker) => PlaywrightWorker.make(worker),
} as const;

type PageWithPatchedEvents = PatchedEvents<Page, PageEvents>;

/**
 * @category model
 * @since 0.1.0
 */
export interface PlaywrightPageService {
  /**
   * Access the clock.
   *
   * @since 0.3.0
   */
  readonly clock: PlaywrightClockService;
  /**
   * Access the keyboard.
   *
   * @since 0.3.0
   */
  readonly keyboard: PlaywrightKeyboardService;
  /**
   * Access the mouse.
   *
   * @since 0.3.0
   */
  readonly mouse: PlaywrightMouseService;
  /**
   * Access the touchscreen.
   *
   * @since 0.3.0
   */
  readonly touchscreen: PlaywrightTouchscreenService;
  /**
   * Navigates the page to the given URL.
   *
   * @example
   * ```ts
   * yield* page.goto("https://google.com");
   * ```
   *
   * @see {@link Page.goto}
   * @since 0.1.0
   */
  readonly goto: (
    url: string,
    options?: Parameters<Page["goto"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Waits for the page to navigate to the given URL.
   *
   * @example
   * ```ts
   * yield* page.waitForURL("https://google.com");
   * ```
   *
   * @see {@link Page.waitForURL}
   * @since 0.1.0
   */
  readonly waitForURL: (
    url: Parameters<Page["waitForURL"]>[0],
    options?: Parameters<Page["waitForURL"]>[1],
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
   * @see {@link Page.waitForLoadState}
   * @since 0.2.0
   */
  readonly waitForLoadState: (
    state?: Parameters<Page["waitForLoadState"]>[0],
    options?: Parameters<Page["waitForLoadState"]>[1],
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
   * @see {@link Page.evaluate}
   * @since 0.1.0
   */
  readonly evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * Adds a script which would be evaluated in one of the following scenarios:
   * - Whenever the page is navigated.
   * - Whenever the child frame is attached or navigated. In this case, the script is evaluated in the context of the newly attached frame.
   *
   * @see {@link Page.addInitScript}
   * @since 0.3.0
   */
  readonly addInitScript: (
    script: Parameters<Page["addInitScript"]>[0],
    arg?: Parameters<Page["addInitScript"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Adds a `<script>` tag into the page with the desired url or content.
   *
   * @see {@link Page.addScriptTag}
   * @since 0.3.0
   */
  readonly addScriptTag: (
    options: Parameters<Page["addScriptTag"]>[0],
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
   * import { PlaywrightBrowser } from "effect-playwright/browser";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* PlaywrightBrowser;
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
   * import { PlaywrightBrowser } from "effect-playwright/browser";
   *
   * // A custom Database service used in your Effect application
   * class Database extends Context.Tag("Database")<
   *   Database,
   *   { readonly insertProduct: (name: string, price: number) => Effect.Effect<void> }
   * >() {}
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* PlaywrightBrowser;
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
   * @see {@link Page.exposeFunction}
   * @since 0.3.0
   */
  readonly exposeFunction: <A, E, R, Args extends unknown[]>(
    name: Parameters<Page["exposeFunction"]>[0],
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
   * import { PlaywrightBrowser } from "effect-playwright/browser";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* PlaywrightBrowser;
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
   * @see {@link Page.exposeFunction}
   * @since 0.3.0
   */
  readonly exposeEffect: <A, E, R>(
    name: Parameters<Page["exposeFunction"]>[0],
    playwrightFunction: Effect.Effect<A, E, R>,
  ) => Effect.Effect<void, PlaywrightError, R>;
  /**
   * Adds a `<link rel="stylesheet">` tag into the page with the desired url or a `<style type="text/css">` tag with the content.
   *
   * @see {@link Page.addStyleTag}
   * @since 0.3.0
   */
  readonly addStyleTag: (
    options: Parameters<Page["addStyleTag"]>[0],
  ) => Effect.Effect<ElementHandle, PlaywrightError>;
  /**
   * Returns the page title.
   *
   * @example
   * ```ts
   * const title = yield* page.title;
   * ```
   *
   * @see {@link Page.title}
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
   * @see {@link Page.content}
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
   * @see {@link Page}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (page: Page) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
  /**
   * Returns a locator for the given selector.
   *
   * NOTE: This method will cause a defect if `options.has` or `options.hasNot` are provided and belong to a different frame.
   *
   * @see {@link Page.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selector: string,
    options?: Parameters<Page["locator"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given role.
   *
   * @see {@link Page.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<Page["getByRole"]>[0],
    options?: Parameters<Page["getByRole"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given text.
   *
   * @see {@link Page.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<Page["getByText"]>[0],
    options?: Parameters<Page["getByText"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given label.
   *
   * @see {@link Page.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    label: Parameters<Page["getByLabel"]>[0],
    options?: Parameters<Page["getByLabel"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given test id.
   *
   * @see {@link Page.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<Page["getByTestId"]>[0],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given alt text.
   *
   * @see {@link Page.getByAltText}
   * @since 0.3.0
   */
  readonly getByAltText: (
    text: Parameters<Page["getByAltText"]>[0],
    options?: Parameters<Page["getByAltText"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given placeholder.
   *
   * @see {@link Page.getByPlaceholder}
   * @since 0.3.0
   */
  readonly getByPlaceholder: (
    text: Parameters<Page["getByPlaceholder"]>[0],
    options?: Parameters<Page["getByPlaceholder"]>[1],
  ) => typeof PlaywrightLocator.Service;
  /**
   * Returns a locator that matches the given title.
   *
   * @see {@link Page.getByTitle}
   * @since 0.3.0
   */
  readonly getByTitle: (
    text: Parameters<Page["getByTitle"]>[0],
    options?: Parameters<Page["getByTitle"]>[1],
  ) => typeof PlaywrightLocator.Service;

  /**
   * Captures a screenshot of the page.
   *
   * @example
   * ```ts
   * const buffer = yield* page.screenshot({ path: "screenshot.png" });
   * ```
   *
   * @see {@link Page.screenshot}
   * @since 0.3.0
   */
  readonly screenshot: (
    options?: Parameters<Page["screenshot"]>[0],
  ) => Effect.Effect<Buffer, PlaywrightError>;

  /**
   * Clicks an element matching the given selector.
   *
   * @example
   * ```ts
   * yield* page.click("button#submit");
   * ```
   * @deprecated Use {@link PlaywrightPageService.locator} to create a locator and then call `click` on it instead.
   * @see {@link Page.click}
   * @since 0.1.0
   * @category deprecated
   */
  readonly click: (
    selector: string,
    options?: Parameters<Page["click"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Drags a source element to a target element and drops it.
   *
   * @example
   * ```ts
   * yield* page.dragAndDrop("#source", "#target");
   * ```
   *
   * @see {@link Page.dragAndDrop}
   * @since 0.3.0
   */
  readonly dragAndDrop: (
    source: Parameters<Page["dragAndDrop"]>[0],
    target: Parameters<Page["dragAndDrop"]>[1],
    options?: Parameters<Page["dragAndDrop"]>[2],
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
   * @see {@link Page.emulateMedia}
   * @since 0.3.0
   */
  readonly emulateMedia: (
    options?: Parameters<Page["emulateMedia"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Reloads the page.
   *
   * @see {@link Page.reload}
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
   * @see {@link Page.goBack}
   * @since 0.3.0
   */
  readonly goBack: (
    options?: Parameters<Page["goBack"]>[0],
  ) => Effect.Effect<Option.Option<PlaywrightResponse>, PlaywrightError>;
  /**
   * Navigate to the next page in history.
   *
   * @example
   * ```ts
   * const response = yield* page.goForward();
   * ```
   *
   * @see {@link Page.goForward}
   * @since 0.3.0
   */
  readonly goForward: (
    options?: Parameters<Page["goForward"]>[0],
  ) => Effect.Effect<Option.Option<PlaywrightResponse>, PlaywrightError>;
  /**
   * Brings page to front (activates tab).
   *
   * @see {@link Page.bringToFront}
   * @since 0.3.0
   */
  readonly bringToFront: Effect.Effect<void, PlaywrightError>;
  /**
   * Closes the page.
   *
   * @see {@link Page.close}
   * @since 0.1.0
   */
  readonly close: Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the current URL of the page.
   *
   * @example
   * ```ts
   * const url = page.url();
   * ```
   *
   * @see {@link Page.url}
   * @since 0.1.0
   */
  readonly url: () => string;

  /**
   * Returns all messages that have been logged to the console.
   *
   * @example
   * ```ts
   * const consoleMessages = yield* page.consoleMessages;
   * ```
   *
   * @see {@link Page.consoleMessages}
   * @since 0.3.0
   */
  readonly consoleMessages: Effect.Effect<
    ReadonlyArray<ConsoleMessage>,
    PlaywrightError
  >;

  /**
   * Get the browser context that the page belongs to.
   *
   * @see {@link Page.context}
   * @since 0.3.0
   */
  readonly context: () => PlaywrightBrowserContextService;

  /**
   * Returns a frame matching the specified criteria.
   *
   * @example
   * ```ts
   * const frame = Option.getOrNull(page.frame("frame-name"));
   * ```
   *
   * @see {@link Page.frame}
   * @since 0.3.0
   */
  readonly frame: (
    frameSelector: Parameters<Page["frame"]>[0],
  ) => Option.Option<typeof PlaywrightFrame.Service>;

  /**
   * Returns all frames attached to the page.
   *
   * @see {@link Page.frames}
   * @since 0.2.0
   */
  readonly frames: Effect.Effect<
    ReadonlyArray<typeof PlaywrightFrame.Service>,
    PlaywrightError
  >;

  /**
   * Creates a stream of the given event from the page.
   *
   * @example
   * ```ts
   * const consoleStream = page.eventStream("console");
   * ```
   *
   * @category custom
   * @see {@link Page.on}
   * @since 0.1.0
   */
  readonly eventStream: <K extends keyof PageEvents>(
    event: K,
  ) => Stream.Stream<ReturnType<(typeof eventMappings)[K]>>;
}

/**
 * @category tag
 */
export class PlaywrightPage extends Context.Tag(
  "effect-playwright/PlaywrightPage",
)<PlaywrightPage, PlaywrightPageService>() {
  /**
   * Creates a `PlaywrightPage` from a Playwright `Page` instance.
   *
   * @param page - The Playwright `Page` instance to wrap.
   * @since 0.1.0
   */
  static make(page: PageWithPatchedEvents): PlaywrightPageService {
    const use = useHelper(page);

    return PlaywrightPage.of({
      clock: PlaywrightClock.make(page.clock),
      keyboard: PlaywrightKeyboard.make(page.keyboard),
      mouse: PlaywrightMouse.make(page.mouse),
      touchscreen: PlaywrightTouchscreen.make(page.touchscreen),
      goto: (url, options) => use((p) => p.goto(url, options)),
      waitForURL: (url, options) => use((p) => p.waitForURL(url, options)),
      waitForLoadState: (state, options) =>
        use((p) => p.waitForLoadState(state, options)),
      title: use((p) => p.title()),
      content: use((p) => p.content()),
      evaluate: <R, Arg>(f: PageFunction<Arg, R>, arg?: Arg) =>
        use((p) => p.evaluate<R, Arg>(f, arg as Arg)),
      addInitScript: (script, arg) => use((p) => p.addInitScript(script, arg)),
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
        PlaywrightLocator.make(page.locator(selector, options)),
      getByRole: (role, options) =>
        PlaywrightLocator.make(page.getByRole(role, options)),
      getByText: (text, options) =>
        PlaywrightLocator.make(page.getByText(text, options)),
      getByLabel: (label, options) =>
        PlaywrightLocator.make(page.getByLabel(label, options)),
      getByTestId: (testId) => PlaywrightLocator.make(page.getByTestId(testId)),
      getByAltText: (text, options) =>
        PlaywrightLocator.make(page.getByAltText(text, options)),
      getByPlaceholder: (text, options) =>
        PlaywrightLocator.make(page.getByPlaceholder(text, options)),
      getByTitle: (text, options) =>
        PlaywrightLocator.make(page.getByTitle(text, options)),
      url: () => page.url(),
      context: () => PlaywrightBrowserContext.make(page.context()),
      consoleMessages: use((p) => p.consoleMessages()),
      frame: (frameSelector) =>
        Option.fromNullable(page.frame(frameSelector)).pipe(
          Option.map(PlaywrightFrame.make),
        ),
      frames: use((p) => Promise.resolve(p.frames().map(PlaywrightFrame.make))),
      reload: use((p) => p.reload()),
      goBack: (options) =>
        use((p) => p.goBack(options)).pipe(
          Effect.map(Option.fromNullable),
          Effect.map(Option.map(PlaywrightResponse.make)),
        ),
      goForward: (options) =>
        use((p) => p.goForward(options)).pipe(
          Effect.map(Option.fromNullable),
          Effect.map(Option.map(PlaywrightResponse.make)),
        ),
      bringToFront: use((p) => p.bringToFront()),
      close: use((p) => p.close()),
      screenshot: (options) => use((p) => p.screenshot(options)),
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
