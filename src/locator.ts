import { Context, type Effect } from "effect";
import type { Locator } from "playwright-core";
import type { PlaywrightError } from "./errors";
import type { Unboxed } from "./playwright-types";
import { useHelper } from "./utils";

/**
 * Interface for a Playwright locator.
 * @category model
 */
export interface PlaywrightLocatorService {
  /**
   * The underlying Playwright Locator instance.
   * @internal
   */
  readonly _raw: Locator;
  /**
   * Clicks the element.
   *
   * @see {@link Locator.click}
   * @since 0.1.0
   */
  readonly click: (
    options?: Parameters<Locator["click"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Checks the element.
   *
   * @see {@link Locator.check}
   * @since 0.1.0
   */
  readonly check: (
    options?: Parameters<Locator["check"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Fills the input field.
   *
   * @see {@link Locator.fill}
   * @since 0.1.0
   */
  readonly fill: (
    value: string,
    options?: Parameters<Locator["fill"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Gets an attribute value.
   *
   * @see {@link Locator.getAttribute}
   * @since 0.1.0
   */
  readonly getAttribute: (
    name: string,
    options?: Parameters<Locator["getAttribute"]>[1],
  ) => Effect.Effect<string | null, PlaywrightError>;
  /**
   * Gets the inner text.
   *
   * @see {@link Locator.innerText}
   * @since 0.1.0
   */
  readonly innerText: (
    options?: Parameters<Locator["innerText"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the inner HTML.
   *
   * @see {@link Locator.innerHTML}
   * @since 0.1.0
   */
  readonly innerHTML: (
    options?: Parameters<Locator["innerHTML"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the input value.
   *
   * @see {@link Locator.inputValue}
   * @since 0.1.0
   */
  readonly inputValue: (
    options?: Parameters<Locator["inputValue"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the text content.
   *
   * @see {@link Locator.textContent}
   * @since 0.1.0
   */
  readonly textContent: (
    options?: Parameters<Locator["textContent"]>[0],
  ) => Effect.Effect<string | null, PlaywrightError>;
  /**
   * Counts the number of matched elements.
   *
   * @see {@link Locator.count}
   * @since 0.1.0
   */
  readonly count: Effect.Effect<number, PlaywrightError>;
  /**
   * Returns a locator that points to the first matched element.
   * @see {@link Locator.first}
   * @since 0.1.0
   */
  readonly first: () => PlaywrightLocatorService;
  /**
   * Returns a locator that points to the last matched element.
   *
   * @see {@link Locator.last}
   * @since 0.1.0
   */
  readonly last: () => PlaywrightLocatorService;
  /**
   * Returns a locator that points to the nth matched element.
   *
   * @see {@link Locator.nth}
   * @since 0.1.0
   */
  readonly nth: (index: number) => PlaywrightLocatorService;
  /**
   * Returns a locator that points to a matched element.
   *
   * @see {@link Locator.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selectorOrLocator: string | Locator,
    options?: Parameters<Locator["locator"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their ARIA role, ARIA attributes and accessible name.
   *
   * @see {@link Locator.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<Locator["getByRole"]>[0],
    options?: Parameters<Locator["getByRole"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements that contain given text.
   *
   * @see {@link Locator.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<Locator["getByText"]>[0],
    options?: Parameters<Locator["getByText"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their label text.
   *
   * @see {@link Locator.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    text: Parameters<Locator["getByLabel"]>[0],
    options?: Parameters<Locator["getByLabel"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their placeholder text.
   *
   * @see {@link Locator.getByPlaceholder}
   * @since 0.1.0
   */
  readonly getByPlaceholder: (
    text: Parameters<Locator["getByPlaceholder"]>[0],
    options?: Parameters<Locator["getByPlaceholder"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their alt text.
   *
   * @see {@link Locator.getByAltText}
   * @since 0.1.0
   */
  readonly getByAltText: (
    text: Parameters<Locator["getByAltText"]>[0],
    options?: Parameters<Locator["getByAltText"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their title attribute.
   *
   * @see {@link Locator.getByTitle}
   * @since 0.1.0
   */
  readonly getByTitle: (
    text: Parameters<Locator["getByTitle"]>[0],
    options?: Parameters<Locator["getByTitle"]>[1],
  ) => PlaywrightLocatorService;
  /**
   * Allows locating elements by their test id.
   *
   * @see {@link Locator.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<Locator["getByTestId"]>[0],
  ) => PlaywrightLocatorService;
  /**
   * Returns when element specified by locator satisfies the `state` option.
   *
   * @see {@link Locator.waitFor}
   * @since 0.1.0
   */
  readonly waitFor: (
    options?: Parameters<Locator["waitFor"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Evaluates a function on the matched element.
   *
   * @example
   * ```ts
   * import { PlaywrightBrowser } from "effect-playwright";
   * import { PlaywrightEnvironment } from "effect-playwright/experimental";
   * import { chromium } from "@playwright/test";
   * import { Effect } from "effect";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* PlaywrightBrowser;
   *   const page = yield* browser.newPage();
   *   const locator = yield* page.locator("button");
   *   const buttonContent = yield* locator.evaluate((button) => button.textContent());
   * }).pipe(PlaywrightEnvironment.provideBrowser, Effect.provide(PlaywrightEnvironment.layer(chromium)));
   * ```
   *
   * @see {@link Locator.evaluate}
   * @since 0.1.0
   */
  readonly evaluate: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
    options?: { timeout?: number },
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * A generic utility to execute any promise-based method on the underlying Playwright `Locator`.
   * Can be used to access any Locator functionality not directly exposed by this service.
   *
   * @example
   * ```typescript
   * const isVisible = yield* locator.use((l) => l.isVisible());
   * ```
   *
   * @param f - A function that takes the Playwright `Locator` and returns a `Promise`.
   * @returns An effect that wraps the promise and returns its result.
   * @see {@link Locator}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (locator: Locator) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
}

/**
 * A service that provides a `PlaywrightLocator` instance.
 *
 * @since 0.1.0
 * @category tag
 */
export class PlaywrightLocator extends Context.Tag(
  "effect-playwright/PlaywrightLocator",
)<PlaywrightLocator, PlaywrightLocatorService>() {
  /**
   * Creates a `PlaywrightLocator` from a Playwright `Locator` instance. This is mostly for internal use.
   * But you could use this if you have used `use` or similar to wrap the locator.
   *
   * @example
   * ```ts
   * const playwrightNativeLocator = yield* page.use((p) => p.locator("button"));
   * const locator = PlaywrightLocator.make(playwrightNativeLocator);
   * ```
   *
   * @param locator - The Playwright `Locator` instance to wrap.
   * @since 0.1.0
   * @category constructor
   */
  static make(locator: Locator): typeof PlaywrightLocator.Service {
    const use = useHelper(locator);

    return PlaywrightLocator.of({
      _raw: locator,
      click: (options) => use((l) => l.click(options)),
      check: (options) => use((l) => l.check(options)),
      fill: (value, options) => use((l) => l.fill(value, options)),
      getAttribute: (name, options) =>
        use((l) => l.getAttribute(name, options)),
      innerText: (options) => use((l) => l.innerText(options)),
      innerHTML: (options) => use((l) => l.innerHTML(options)),
      inputValue: (options) => use((l) => l.inputValue(options)),
      textContent: (options) => use((l) => l.textContent(options)),
      count: use((l) => l.count()),
      first: () => PlaywrightLocator.make(locator.first()),
      last: () => PlaywrightLocator.make(locator.last()),
      nth: (index: number) => PlaywrightLocator.make(locator.nth(index)),
      locator: (selectorOrLocator, options) =>
        PlaywrightLocator.make(locator.locator(selectorOrLocator, options)),
      getByRole: (role, options) =>
        PlaywrightLocator.make(locator.getByRole(role, options)),
      getByText: (text, options) =>
        PlaywrightLocator.make(locator.getByText(text, options)),
      getByLabel: (text, options) =>
        PlaywrightLocator.make(locator.getByLabel(text, options)),
      getByPlaceholder: (text, options) =>
        PlaywrightLocator.make(locator.getByPlaceholder(text, options)),
      getByAltText: (text, options) =>
        PlaywrightLocator.make(locator.getByAltText(text, options)),
      getByTitle: (text, options) =>
        PlaywrightLocator.make(locator.getByTitle(text, options)),
      getByTestId: (testId) =>
        PlaywrightLocator.make(locator.getByTestId(testId)),
      waitFor: (options) => use((l) => l.waitFor(options)),
      evaluate: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
        options?: { timeout?: number },
      ) => use((l) => l.evaluate(pageFunction, arg as Arg, options)),
      use,
    });
  }
}
