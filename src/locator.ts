import { Array, Context, Effect, Match, Option, Predicate } from "effect";
import type { ElementHandle, JSHandle, Locator } from "playwright-core";
import type { PlaywrightError } from "./errors";
import {
  PlaywrightFrameLocator,
  type PlaywrightFrameLocatorService,
} from "./frame-locator";
import { PlaywrightPage } from "./page";
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
   * Gets all inner texts.
   *
   * @see {@link Locator.allInnerTexts}
   * @since 0.1.0
   */
  readonly allInnerTexts: () => Effect.Effect<
    ReadonlyArray<string>,
    PlaywrightError
  >;
  /**
   * Gets all text contents.
   *
   * @see {@link Locator.allTextContents}
   * @since 0.1.0
   */
  readonly allTextContents: () => Effect.Effect<
    ReadonlyArray<string>,
    PlaywrightError
  >;
  /**
   * Returns the accessibility tree snapshot.
   *
   * @see {@link Locator.ariaSnapshot}
   * @since 0.1.0
   */
  readonly ariaSnapshot: (
    options?: Parameters<Locator["ariaSnapshot"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Returns the bounding box of the element.
   *
   * @see {@link Locator.boundingBox}
   * @since 0.1.0
   */
  readonly boundingBox: (
    options?: Parameters<Locator["boundingBox"]>[0],
  ) => Effect.Effect<
    Option.Option<{ x: number; y: number; width: number; height: number }>,
    PlaywrightError
  >;
  /**
   * Describes the locator.
   *
   * @see {@link Locator.describe}
   * @since 0.1.0
   */
  readonly describe: (description: string) => PlaywrightLocatorService;
  /**
   * Returns the description of the locator.
   *
   * @see {@link Locator.description}
   * @since 0.1.0
   */
  readonly description: () => Option.Option<string>;
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
    selectorOrLocator: string | Locator | PlaywrightLocatorService,
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
   * Returns whether the element is checked.
   *
   * @see {@link Locator.isChecked}
   * @since 0.4.1
   */
  readonly isChecked: (
    options?: Parameters<Locator["isChecked"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is disabled.
   *
   * @see {@link Locator.isDisabled}
   * @since 0.4.1
   */
  readonly isDisabled: (
    options?: Parameters<Locator["isDisabled"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is editable.
   *
   * @see {@link Locator.isEditable}
   * @since 0.4.1
   */
  readonly isEditable: (
    options?: Parameters<Locator["isEditable"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is enabled.
   *
   * @see {@link Locator.isEnabled}
   * @since 0.4.1
   */
  readonly isEnabled: (
    options?: Parameters<Locator["isEnabled"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is hidden.
   *
   * @see {@link Locator.isHidden}
   * @since 0.4.1
   */
  readonly isHidden: (
    options?: Parameters<Locator["isHidden"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is visible.
   *
   * @see {@link Locator.isVisible}
   * @since 0.4.1
   */
  readonly isVisible: (
    options?: Parameters<Locator["isVisible"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
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
   * Highlights the corresponding element(s) on the screen.
   *
   * @see {@link Locator.highlight}
   * @since 0.4.1
   */
  readonly highlight: () => Effect.Effect<void, PlaywrightError>;
  /**
   * Captures a screenshot of the element.
   *
   * @see {@link Locator.screenshot}
   * @since 0.4.1
   */
  readonly screenshot: (
    options?: Parameters<Locator["screenshot"]>[0],
  ) => Effect.Effect<Buffer, PlaywrightError>;
  /**
   * Returns the string representation of the locator.
   *
   * @see {@link Locator.toString}
   * @since 0.4.1
   */
  readonly toString: () => string;
  /**
   * Evaluates a function on all matched elements.
   *
   * @see {@link Locator.evaluateAll}
   * @since 0.3.0
   */
  readonly evaluateAll: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (elements: E[], arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * Evaluates a function on the matched element and returns the result as a handle.
   *
   * @see {@link Locator.evaluateHandle}
   * @since 0.3.0
   */
  readonly evaluateHandle: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
  ) => Effect.Effect<JSHandle<R>, PlaywrightError>;
  /**
   * Resolves given locator to the first matching DOM element.
   *
   * @see {@link Locator.elementHandle}
   * @since 0.3.0
   */
  readonly elementHandle: (
    options?: Parameters<Locator["elementHandle"]>[0],
  ) => Effect.Effect<
    Option.Option<ElementHandle<SVGElement | HTMLElement>>,
    PlaywrightError
  >;
  /**
   * Resolves given locator to all matching DOM elements.
   *
   * @see {@link Locator.elementHandles}
   * @since 0.3.0
   */
  readonly elementHandles: () => Effect.Effect<
    ReadonlyArray<ElementHandle<SVGElement | HTMLElement>>,
    PlaywrightError
  >;
  /**
   * Returns an array of locators pointing to the matched elements.
   *
   * @see {@link Locator.all}
   * @since 0.4.1
   */
  readonly all: () => Effect.Effect<
    ReadonlyArray<PlaywrightLocatorService>,
    PlaywrightError
  >;
  /**
   * Creates a locator that matches both this locator and the argument locator.
   *
   * @see {@link Locator.and}
   * @since 0.4.1
   */
  readonly and: (
    locator: PlaywrightLocatorService | Locator,
  ) => PlaywrightLocatorService;
  /**
   * Returns a FrameLocator object pointing to the same iframe as this locator.
   *
   * @see {@link Locator.contentFrame}
   * @since 0.4.1
   */
  readonly contentFrame: () => PlaywrightFrameLocatorService;
  /**
   * Narrows existing locator according to the options.
   *
   * @see {@link Locator.filter}
   * @since 0.4.1
   */
  readonly filter: (
    options?: Parameters<Locator["filter"]>[0],
  ) => PlaywrightLocatorService;
  /**
   * Creates a frame locator that will enter the iframe and allow selecting elements in that iframe.
   *
   * @see {@link Locator.frameLocator}
   * @since 0.4.1
   */
  readonly frameLocator: (selector: string) => PlaywrightFrameLocatorService;
  /**
   * Creates a locator that matches either this locator or the argument locator.
   *
   * @see {@link Locator.or}
   * @since 0.4.1
   */
  readonly or: (
    locator: PlaywrightLocatorService | Locator,
  ) => PlaywrightLocatorService;
  /**
   * A page this locator belongs to.
   *
   * @see {@link Locator.page}
   * @since 0.4.1
   */
  readonly page: () => typeof PlaywrightPage.Service;
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
    const unwrap = Match.type<Locator | PlaywrightLocatorService>().pipe(
      Match.when(Predicate.hasProperty("_raw"), (l) => l._raw),
      Match.orElse((l) => l),
    );

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
      allInnerTexts: () => use((l) => l.allInnerTexts()),
      allTextContents: () => use((l) => l.allTextContents()),
      ariaSnapshot: (options) => use((l) => l.ariaSnapshot(options)),
      boundingBox: (options) =>
        use((l) => l.boundingBox(options)).pipe(
          Effect.map(Option.fromNullable),
        ),
      describe: (description) =>
        PlaywrightLocator.make(locator.describe(description)),
      description: () => Option.fromNullable(locator.description()),
      count: use((l) => l.count()),
      first: () => PlaywrightLocator.make(locator.first()),
      last: () => PlaywrightLocator.make(locator.last()),
      nth: (index: number) => PlaywrightLocator.make(locator.nth(index)),
      all: () =>
        use((l) => l.all()).pipe(Effect.map(Array.map(PlaywrightLocator.make))),
      and: (locatorOrService) =>
        PlaywrightLocator.make(locator.and(unwrap(locatorOrService))),
      contentFrame: () => PlaywrightFrameLocator.make(locator.contentFrame()),
      filter: (options) => PlaywrightLocator.make(locator.filter(options)),
      frameLocator: (selector) =>
        PlaywrightFrameLocator.make(locator.frameLocator(selector)),
      or: (locatorOrService) =>
        PlaywrightLocator.make(locator.or(unwrap(locatorOrService))),
      page: () => PlaywrightPage.make(locator.page()),
      locator: (selectorOrLocator, options) =>
        PlaywrightLocator.make(
          typeof selectorOrLocator === "string"
            ? locator.locator(selectorOrLocator, options)
            : locator.locator(unwrap(selectorOrLocator), options),
        ),
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
      isChecked: (options) => use((l) => l.isChecked(options)),
      isDisabled: (options) => use((l) => l.isDisabled(options)),
      isEditable: (options) => use((l) => l.isEditable(options)),
      isEnabled: (options) => use((l) => l.isEnabled(options)),
      isHidden: (options) => use((l) => l.isHidden(options)),
      isVisible: (options) => use((l) => l.isVisible(options)),
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
      evaluateAll: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (elements: E[], arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
      ) => use((l) => l.evaluateAll(pageFunction, arg as Arg)),
      evaluateHandle: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
      ) => use((l) => l.evaluateHandle(pageFunction, arg as Arg)),
      elementHandle: (options) =>
        use((l) => l.elementHandle(options)).pipe(
          Effect.map(Option.fromNullable),
        ),
      elementHandles: () =>
        use(
          (l) =>
            l.elementHandles() as Promise<
              Array<ElementHandle<SVGElement | HTMLElement>>
            >,
        ),
      highlight: () => use((l) => l.highlight()),
      screenshot: (options) => use((l) => l.screenshot(options)),
      toString: () => locator.toString(),
      use,
    });
  }
}
