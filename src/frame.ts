import { Array, Context, type Effect, Option } from "effect";
import type { Frame as CoreFrame, ElementHandle } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { Locator } from "./locator";
import { Page, type PageService } from "./page";
import type { PageFunction } from "./playwright-types";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.1.2
 */
export interface FrameService {
  /**
   * Navigates the frame to the given URL.
   *
   * @see {@link CoreFrame.goto}
   * @since 0.1.3
   */
  readonly goto: (
    url: string,
    options?: Parameters<CoreFrame["goto"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Waits for the frame to navigate to the given URL.
   *
   * @see {@link CoreFrame.waitForURL}
   * @since 0.1.3
   */
  readonly waitForURL: (
    url: Parameters<CoreFrame["waitForURL"]>[0],
    options?: Parameters<CoreFrame["waitForURL"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Waits for the frame to reach the given load state.
   *
   * @see {@link CoreFrame.waitForLoadState}
   * @since 0.2.0
   */
  readonly waitForLoadState: (
    state?: Parameters<CoreFrame["waitForLoadState"]>[0],
    options?: Parameters<CoreFrame["waitForLoadState"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Evaluates a function in the context of the frame.
   *
   * @see {@link CoreFrame.evaluate}
   * @since 0.1.3
   */
  readonly evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
    options?: Parameters<CoreFrame["evaluate"]>[2],
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * Returns the frame title.
   *
   * @see {@link CoreFrame.title}
   * @since 0.1.3
   */
  readonly title: Effect.Effect<string, PlaywrightError>;
  /**
   * A generic utility to execute any promise-based method on the underlying Playwright `Frame`.
   * Can be used to access any Frame functionality not directly exposed by this service.
   *
   * @see {@link CoreFrame}
   * @since 0.1.2
   */
  readonly use: <T>(
    f: (frame: CoreFrame) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
  /**
   * Returns a locator for the given selector.
   *
   * NOTE: This method will cause a defect if `options.has` or `options.hasNot` are provided and belong to a different frame.
   *
   * @see {@link CoreFrame.locator}
   * @since 0.1.3
   */
  readonly locator: (
    selector: string,
    options?: Parameters<CoreFrame["locator"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given role.
   *
   * @see {@link CoreFrame.getByRole}
   * @since 0.1.3
   */
  readonly getByRole: (
    role: Parameters<CoreFrame["getByRole"]>[0],
    options?: Parameters<CoreFrame["getByRole"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given text.
   *
   * @see {@link CoreFrame.getByText}
   * @since 0.1.3
   */
  readonly getByText: (
    text: Parameters<CoreFrame["getByText"]>[0],
    options?: Parameters<CoreFrame["getByText"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given label.
   *
   * @see {@link CoreFrame.getByLabel}
   * @since 0.1.3
   */
  readonly getByLabel: (
    label: Parameters<CoreFrame["getByLabel"]>[0],
    options?: Parameters<CoreFrame["getByLabel"]>[1],
  ) => typeof Locator.Service;
  /**
   * Returns a locator that matches the given test id.
   *
   * @see {@link CoreFrame.getByTestId}
   * @since 0.1.3
   */
  readonly getByTestId: (
    testId: Parameters<CoreFrame["getByTestId"]>[0],
  ) => typeof Locator.Service;

  /**
   * Returns a locator that matches the given placeholder.
   *
   * @see {@link CoreFrame.getByPlaceholder}
   * @since 0.4.1
   */
  readonly getByPlaceholder: (
    text: Parameters<CoreFrame["getByPlaceholder"]>[0],
    options?: Parameters<CoreFrame["getByPlaceholder"]>[1],
  ) => typeof Locator.Service;

  /**
   * Returns a locator that matches the given alt text.
   *
   * @see {@link CoreFrame.getByAltText}
   * @since 0.4.1
   */
  readonly getByAltText: (
    text: Parameters<CoreFrame["getByAltText"]>[0],
    options?: Parameters<CoreFrame["getByAltText"]>[1],
  ) => typeof Locator.Service;

  /**
   * Returns a locator that matches the given title.
   *
   * @see {@link CoreFrame.getByTitle}
   * @since 0.4.1
   */
  readonly getByTitle: (
    text: Parameters<CoreFrame["getByTitle"]>[0],
    options?: Parameters<CoreFrame["getByTitle"]>[1],
  ) => typeof Locator.Service;

  /**
   * Returns the page that the frame belongs to.
   *
   * @see {@link CoreFrame.page}
   * @since 0.4.1
   */
  readonly page: () => PageService;

  /**
   * Returns the parent frame, if any.
   *
   * @see {@link CoreFrame.parentFrame}
   * @since 0.4.1
   */
  readonly parentFrame: () => Option.Option<FrameService>;

  /**
   * Returns an array of child frames.
   *
   * @see {@link CoreFrame.childFrames}
   * @since 0.4.1
   */
  readonly childFrames: () => ReadonlyArray<FrameService>;

  /**
   * Returns whether the frame is detached.
   *
   * @see {@link CoreFrame.isDetached}
   * @since 0.4.1
   */
  readonly isDetached: () => boolean;

  /**
   * Waits for the given timeout in milliseconds.
   *
   * @see {@link CoreFrame.waitForTimeout}
   * @since 0.4.1
   */
  readonly waitForTimeout: (
    timeout: number,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets the HTML content of the frame.
   *
   * @see {@link CoreFrame.setContent}
   * @since 0.4.1
   */
  readonly setContent: (
    html: string,
    options?: Parameters<CoreFrame["setContent"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Returns the current URL of the frame.
   *
   * @see {@link CoreFrame.url}
   * @since 0.1.3
   */
  readonly url: () => string;

  /**
   * Returns the full HTML contents of the frame, including the doctype.
   *
   * @see {@link CoreFrame.content}
   * @since 0.1.3
   */
  readonly content: Effect.Effect<string, PlaywrightError>;

  /**
   * Returns the owner iframe element for the frame.
   *
   * @see {@link CoreFrame.frameElement}
   * @since 0.5.1
   */
  readonly frameElement: Effect.Effect<ElementHandle, PlaywrightError>;

  /**
   * Returns the frame name.
   *
   * @see {@link CoreFrame.name}
   * @since 0.1.3
   */
  readonly name: () => string;

  /**
   * Clicks an element matching the given selector.
   *
   * @deprecated Use {@link FrameService.locator} to create a locator and then call `click` on it instead.
   * @see {@link CoreFrame.click}
   * @since 0.1.3
   * @category deprecated
   */
  readonly click: (
    selector: string,
    options?: Parameters<CoreFrame["click"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 * @since 0.1.2
 */
export class Frame extends Context.Tag("effect-playwright/frame/Frame")<
  Frame,
  FrameService
>() {
  /**
   * Creates a `Frame` from a Playwright `Frame` instance.
   *
   * @param frame - The Playwright `Frame` instance to wrap.
   * @since 0.1.2
   */
  static make(frame: CoreFrame): FrameService {
    const use = useHelper(frame);

    return Frame.of({
      goto: (url, options) => use((f) => f.goto(url, options)),
      waitForURL: (url, options) => use((f) => f.waitForURL(url, options)),
      waitForLoadState: (state, options) =>
        use((f) => f.waitForLoadState(state, options)),
      evaluate: <R, Arg>(
        f: PageFunction<Arg, R>,
        arg?: Arg,
        options?: Parameters<CoreFrame["evaluate"]>[2],
      ) =>
        use((frame) =>
          frame.evaluate<R, Arg>(
            f as unknown as Parameters<typeof frame.evaluate<R, Arg>>[0],
            arg as Arg,
            options,
          ),
        ),
      title: use((f) => f.title()),
      use,
      locator: (selector, options) =>
        Locator.make(frame.locator(selector, options)),
      getByRole: (role, options) =>
        Locator.make(frame.getByRole(role, options)),
      getByText: (text, options) =>
        Locator.make(frame.getByText(text, options)),
      getByLabel: (label, options) =>
        Locator.make(frame.getByLabel(label, options)),
      getByTestId: (testId) => Locator.make(frame.getByTestId(testId)),
      getByPlaceholder: (text, options) =>
        Locator.make(frame.getByPlaceholder(text, options)),
      getByAltText: (text, options) =>
        Locator.make(frame.getByAltText(text, options)),
      getByTitle: (text, options) =>
        Locator.make(frame.getByTitle(text, options)),
      page: () => Page.make(frame.page()),
      parentFrame: () =>
        Option.fromNullable(frame.parentFrame()).pipe(Option.map(Frame.make)),
      childFrames: () => Array.map(frame.childFrames(), (f) => Frame.make(f)),
      isDetached: () => frame.isDetached(),
      waitForTimeout: (timeout) => use((f) => f.waitForTimeout(timeout)),
      setContent: (html, options) => use((f) => f.setContent(html, options)),
      url: () => frame.url(),
      content: use((f) => f.content()),
      frameElement: use((f) => f.frameElement()),
      name: () => frame.name(),
      click: (selector, options) => use((f) => f.click(selector, options)),
    });
  }
}
