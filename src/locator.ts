import { Array, Context, Effect, Match, Option, Predicate } from "effect";
import type {
  Locator as CoreLocator,
  ElementHandle,
  JSHandle,
} from "playwright-core";
import type { PlaywrightError } from "./errors";
import { FrameLocator, type FrameLocatorService } from "./frame-locator";
import { Page } from "./page";
import type { Unboxed } from "./playwright-types";
import { useHelper } from "./utils";

/**
 * Interface for a Playwright locator.
 * @category model
 */
export interface LocatorService {
  /**
   * The underlying Playwright Locator instance.
   * @internal
   */
  readonly _raw: CoreLocator;
  /**
   * Clicks the element.
   *
   * @see {@link CoreLocator.click}
   * @since 0.1.0
   */
  readonly click: (
    options?: Parameters<CoreLocator["click"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Checks the element.
   *
   * @see {@link CoreLocator.check}
   * @since 0.1.0
   */
  readonly check: (
    options?: Parameters<CoreLocator["check"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Fills the input field.
   *
   * @see {@link CoreLocator.fill}
   * @since 0.1.0
   */
  readonly fill: (
    value: string,
    options?: Parameters<CoreLocator["fill"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Gets an attribute value.
   *
   * @see {@link CoreLocator.getAttribute}
   * @since 0.1.0
   */
  readonly getAttribute: (
    name: string,
    options?: Parameters<CoreLocator["getAttribute"]>[1],
  ) => Effect.Effect<string | null, PlaywrightError>;
  /**
   * Gets the inner text.
   *
   * @see {@link CoreLocator.innerText}
   * @since 0.1.0
   */
  readonly innerText: (
    options?: Parameters<CoreLocator["innerText"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the inner HTML.
   *
   * @see {@link CoreLocator.innerHTML}
   * @since 0.1.0
   */
  readonly innerHTML: (
    options?: Parameters<CoreLocator["innerHTML"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the input value.
   *
   * @see {@link CoreLocator.inputValue}
   * @since 0.1.0
   */
  readonly inputValue: (
    options?: Parameters<CoreLocator["inputValue"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Gets the text content.
   *
   * @see {@link CoreLocator.textContent}
   * @since 0.1.0
   */
  readonly textContent: (
    options?: Parameters<CoreLocator["textContent"]>[0],
  ) => Effect.Effect<string | null, PlaywrightError>;
  /**
   * Gets all inner texts.
   *
   * @see {@link CoreLocator.allInnerTexts}
   * @since 0.1.0
   */
  readonly allInnerTexts: () => Effect.Effect<
    ReadonlyArray<string>,
    PlaywrightError
  >;
  /**
   * Gets all text contents.
   *
   * @see {@link CoreLocator.allTextContents}
   * @since 0.1.0
   */
  readonly allTextContents: () => Effect.Effect<
    ReadonlyArray<string>,
    PlaywrightError
  >;
  /**
   * Returns the accessibility tree snapshot.
   *
   * @see {@link CoreLocator.ariaSnapshot}
   * @since 0.1.0
   */
  readonly ariaSnapshot: (
    options?: Parameters<CoreLocator["ariaSnapshot"]>[0],
  ) => Effect.Effect<string, PlaywrightError>;
  /**
   * Returns the bounding box of the element.
   *
   * @see {@link CoreLocator.boundingBox}
   * @since 0.1.0
   */
  readonly boundingBox: (
    options?: Parameters<CoreLocator["boundingBox"]>[0],
  ) => Effect.Effect<
    Option.Option<{ x: number; y: number; width: number; height: number }>,
    PlaywrightError
  >;
  /**
   * Describes the locator.
   *
   * @see {@link CoreLocator.describe}
   * @since 0.1.0
   */
  readonly describe: (description: string) => LocatorService;
  /**
   * Returns the description of the locator.
   *
   * @see {@link CoreLocator.description}
   * @since 0.1.0
   */
  readonly description: () => Option.Option<string>;
  /**
   * Counts the number of matched elements.
   *
   * @see {@link CoreLocator.count}
   * @since 0.1.0
   */
  readonly count: Effect.Effect<number, PlaywrightError>;
  /**
   * Returns a locator that points to the first matched element.
   * @see {@link CoreLocator.first}
   * @since 0.1.0
   */
  readonly first: () => LocatorService;
  /**
   * Returns a locator that points to the last matched element.
   *
   * @see {@link CoreLocator.last}
   * @since 0.1.0
   */
  readonly last: () => LocatorService;
  /**
   * Returns a locator that points to the nth matched element.
   *
   * @see {@link CoreLocator.nth}
   * @since 0.1.0
   */
  readonly nth: (index: number) => LocatorService;
  /**
   * Returns a locator that points to a matched element.
   *
   * @see {@link CoreLocator.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selectorOrLocator: string | CoreLocator | LocatorService,
    options?: Parameters<CoreLocator["locator"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their ARIA role, ARIA attributes and accessible name.
   *
   * @see {@link CoreLocator.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<CoreLocator["getByRole"]>[0],
    options?: Parameters<CoreLocator["getByRole"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements that contain given text.
   *
   * @see {@link CoreLocator.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<CoreLocator["getByText"]>[0],
    options?: Parameters<CoreLocator["getByText"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their label text.
   *
   * @see {@link CoreLocator.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    text: Parameters<CoreLocator["getByLabel"]>[0],
    options?: Parameters<CoreLocator["getByLabel"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their placeholder text.
   *
   * @see {@link CoreLocator.getByPlaceholder}
   * @since 0.1.0
   */
  readonly getByPlaceholder: (
    text: Parameters<CoreLocator["getByPlaceholder"]>[0],
    options?: Parameters<CoreLocator["getByPlaceholder"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their alt text.
   *
   * @see {@link CoreLocator.getByAltText}
   * @since 0.1.0
   */
  readonly getByAltText: (
    text: Parameters<CoreLocator["getByAltText"]>[0],
    options?: Parameters<CoreLocator["getByAltText"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their title attribute.
   *
   * @see {@link CoreLocator.getByTitle}
   * @since 0.1.0
   */
  readonly getByTitle: (
    text: Parameters<CoreLocator["getByTitle"]>[0],
    options?: Parameters<CoreLocator["getByTitle"]>[1],
  ) => LocatorService;
  /**
   * Allows locating elements by their test id.
   *
   * @see {@link CoreLocator.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<CoreLocator["getByTestId"]>[0],
  ) => LocatorService;
  /**
   * Returns whether the element is checked.
   *
   * @see {@link CoreLocator.isChecked}
   * @since 0.4.1
   */
  readonly isChecked: (
    options?: Parameters<CoreLocator["isChecked"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is disabled.
   *
   * @see {@link CoreLocator.isDisabled}
   * @since 0.4.1
   */
  readonly isDisabled: (
    options?: Parameters<CoreLocator["isDisabled"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is editable.
   *
   * @see {@link CoreLocator.isEditable}
   * @since 0.4.1
   */
  readonly isEditable: (
    options?: Parameters<CoreLocator["isEditable"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is enabled.
   *
   * @see {@link CoreLocator.isEnabled}
   * @since 0.4.1
   */
  readonly isEnabled: (
    options?: Parameters<CoreLocator["isEnabled"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is hidden.
   *
   * @see {@link CoreLocator.isHidden}
   * @since 0.4.1
   */
  readonly isHidden: (
    options?: Parameters<CoreLocator["isHidden"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns whether the element is visible.
   *
   * @see {@link CoreLocator.isVisible}
   * @since 0.4.1
   */
  readonly isVisible: (
    options?: Parameters<CoreLocator["isVisible"]>[0],
  ) => Effect.Effect<boolean, PlaywrightError>;
  /**
   * Returns when element specified by locator satisfies the `state` option.
   *
   * @see {@link CoreLocator.waitFor}
   * @since 0.1.0
   */
  readonly waitFor: (
    options?: Parameters<CoreLocator["waitFor"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Returns when the matched element satisfies the provided predicate.
   *
   * @example
   * ```ts
   * import { chromium } from "@playwright/test";
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { PlaywrightSpawner } from "effect-playwright/experimental";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   const page = yield* browser.newPage();
   *   yield* page.setContent('<div id="status">Ready</div>');
   *   yield* page.locator("#status").waitForFunction(
   *     (element, expected) => element.textContent === expected,
   *     "Ready",
   *   );
   * }).pipe(
   *   PlaywrightSpawner.withBrowser,
   *   Effect.provide(PlaywrightSpawner.layer(chromium)),
   * );
   * ```
   *
   * @see {@link CoreLocator.waitForFunction}
   * @since 0.5.1
   */
  readonly waitForFunction: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
    options?: Parameters<CoreLocator["waitForFunction"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Evaluates a function on the matched element.
   *
   * @example
   * ```ts
   * import { Playwright } from "effect-playwright";
   * import { PlaywrightSpawner } from "effect-playwright/experimental";
   * import { chromium } from "@playwright/test";
   * import { Effect } from "effect";
   *
   * const program = Effect.gen(function* () {
   *   const browser = yield* Playwright.Browser;
   *   const page = yield* browser.newPage();
   *   const locator = yield* page.locator("button");
   *   const buttonContent = yield* locator.evaluate((button) => button.textContent());
   * }).pipe(PlaywrightSpawner.withBrowser, Effect.provide(PlaywrightSpawner.layer(chromium)));
   * ```
   *
   * @see {@link CoreLocator.evaluate}
   * @since 0.1.0
   */
  readonly evaluate: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
    options?: Parameters<CoreLocator["evaluate"]>[2],
  ) => Effect.Effect<R, PlaywrightError>;
  /**
   * Highlights the corresponding element(s) on the screen.
   *
   * @see {@link CoreLocator.highlight}
   * @since 0.4.1
   */
  readonly highlight: (
    options?: Parameters<CoreLocator["highlight"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Hides the element highlight previously added by highlight.
   *
   * @see {@link CoreLocator.hideHighlight}
   * @since 0.5.0
   */
  readonly hideHighlight: Effect.Effect<void, PlaywrightError>;
  /**
   * Drops the locator.
   *
   * @see {@link CoreLocator.drop}
   * @since 0.5.0
   */
  readonly drop: (
    data: Parameters<CoreLocator["drop"]>[0],
    options?: Parameters<CoreLocator["drop"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Normalizes the locator.
   *
   * @see {@link CoreLocator.normalize}
   * @since 0.5.0
   */
  readonly normalize: () => Effect.Effect<LocatorService, PlaywrightError>;
  /**
   * Captures a screenshot of the element.
   *
   * @see {@link CoreLocator.screenshot}
   * @since 0.4.1
   */
  readonly screenshot: (
    options?: Parameters<CoreLocator["screenshot"]>[0],
  ) => Effect.Effect<Buffer, PlaywrightError>;
  /**
   * Returns the string representation of the locator.
   *
   * @see {@link CoreLocator.toString}
   * @since 0.4.1
   */
  readonly toString: () => string;
  /**
   * Evaluates a function on all matched elements.
   *
   * @see {@link CoreLocator.evaluateAll}
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
   * @see {@link CoreLocator.evaluateHandle}
   * @since 0.3.0
   */
  readonly evaluateHandle: <
    R,
    Arg = void,
    E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
  >(
    pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
    arg?: Arg,
    options?: Parameters<CoreLocator["evaluateHandle"]>[2],
  ) => Effect.Effect<JSHandle<R>, PlaywrightError>;
  /**
   * Resolves given locator to the first matching DOM element.
   *
   * @see {@link CoreLocator.elementHandle}
   * @since 0.3.0
   */
  readonly elementHandle: (
    options?: Parameters<CoreLocator["elementHandle"]>[0],
  ) => Effect.Effect<
    Option.Option<ElementHandle<SVGElement | HTMLElement>>,
    PlaywrightError
  >;
  /**
   * Resolves given locator to all matching DOM elements.
   *
   * @see {@link CoreLocator.elementHandles}
   * @since 0.3.0
   */
  readonly elementHandles: () => Effect.Effect<
    ReadonlyArray<ElementHandle<SVGElement | HTMLElement>>,
    PlaywrightError
  >;
  /**
   * Returns an array of locators pointing to the matched elements.
   *
   * @see {@link CoreLocator.all}
   * @since 0.4.1
   */
  readonly all: () => Effect.Effect<
    ReadonlyArray<LocatorService>,
    PlaywrightError
  >;
  /**
   * Creates a locator that matches both this locator and the argument locator.
   *
   * @see {@link CoreLocator.and}
   * @since 0.4.1
   */
  readonly and: (locator: LocatorService | CoreLocator) => LocatorService;
  /**
   * Returns a FrameLocator object pointing to the same iframe as this locator.
   *
   * @see {@link CoreLocator.contentFrame}
   * @since 0.4.1
   */
  readonly contentFrame: () => FrameLocatorService;
  /**
   * Narrows existing locator according to the options.
   *
   * @see {@link CoreLocator.filter}
   * @since 0.4.1
   */
  readonly filter: (
    options?: Parameters<CoreLocator["filter"]>[0],
  ) => LocatorService;
  /**
   * Creates a frame locator that will enter the iframe and allow selecting elements in that iframe.
   *
   * @see {@link CoreLocator.frameLocator}
   * @since 0.4.1
   */
  readonly frameLocator: (selector: string) => FrameLocatorService;
  /**
   * Creates a locator that matches either this locator or the argument locator.
   *
   * @see {@link CoreLocator.or}
   * @since 0.4.1
   */
  readonly or: (locator: LocatorService | CoreLocator) => LocatorService;
  /**
   * A page this locator belongs to.
   *
   * @see {@link CoreLocator.page}
   * @since 0.4.1
   */
  readonly page: () => typeof Page.Service;
  /**
   * Removes keyboard focus from the current element.
   *
   * @see {@link CoreLocator.blur}
   * @since 0.4.2
   */
  readonly blur: (
    options?: Parameters<CoreLocator["blur"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Clear the input field.
   *
   * @see {@link CoreLocator.clear}
   * @since 0.4.2
   */
  readonly clear: (
    options?: Parameters<CoreLocator["clear"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Double-clicks the element.
   *
   * @see {@link CoreLocator.dblclick}
   * @since 0.4.2
   */
  readonly dblclick: (
    options?: Parameters<CoreLocator["dblclick"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches an event.
   *
   * @see {@link CoreLocator.dispatchEvent}
   * @since 0.4.2
   */
  readonly dispatchEvent: (
    type: Parameters<CoreLocator["dispatchEvent"]>[0],
    eventInit?: Parameters<CoreLocator["dispatchEvent"]>[1],
    options?: Parameters<CoreLocator["dispatchEvent"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Drags the locator to another target locator.
   *
   * @see {@link CoreLocator.dragTo}
   * @since 0.4.2
   */
  readonly dragTo: (
    target: LocatorService | CoreLocator,
    options?: Parameters<CoreLocator["dragTo"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Focuses the element.
   *
   * @see {@link CoreLocator.focus}
   * @since 0.4.2
   */
  readonly focus: (
    options?: Parameters<CoreLocator["focus"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Hovers over the element.
   *
   * @see {@link CoreLocator.hover}
   * @since 0.4.2
   */
  readonly hover: (
    options?: Parameters<CoreLocator["hover"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Focuses the element, and then uses `keyboard.down` and `keyboard.up`.
   *
   * @see {@link CoreLocator.press}
   * @since 0.4.2
   */
  readonly press: (
    key: Parameters<CoreLocator["press"]>[0],
    options?: Parameters<CoreLocator["press"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Focuses the element, and then sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.
   *
   * @see {@link CoreLocator.pressSequentially}
   * @since 0.4.2
   */
  readonly pressSequentially: (
    text: Parameters<CoreLocator["pressSequentially"]>[0],
    options?: Parameters<CoreLocator["pressSequentially"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Scrolls the element into view if needed.
   *
   * @see {@link CoreLocator.scrollIntoViewIfNeeded}
   * @since 0.4.2
   */
  readonly scrollIntoViewIfNeeded: (
    options?: Parameters<CoreLocator["scrollIntoViewIfNeeded"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Selects an option in a `<select>` element.
   *
   * @see {@link CoreLocator.selectOption}
   * @since 0.4.2
   */
  readonly selectOption: (
    values: Parameters<CoreLocator["selectOption"]>[0],
    options?: Parameters<CoreLocator["selectOption"]>[1],
  ) => Effect.Effect<ReadonlyArray<string>, PlaywrightError>;
  /**
   * Selects text.
   *
   * @see {@link CoreLocator.selectText}
   * @since 0.4.2
   */
  readonly selectText: (
    options?: Parameters<CoreLocator["selectText"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Checks the element if not already checked.
   *
   * @see {@link CoreLocator.setChecked}
   * @since 0.4.2
   */
  readonly setChecked: (
    checked: Parameters<CoreLocator["setChecked"]>[0],
    options?: Parameters<CoreLocator["setChecked"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Sets the value of the file input.
   *
   * @see {@link CoreLocator.setInputFiles}
   * @since 0.4.2
   */
  readonly setInputFiles: (
    files: Parameters<CoreLocator["setInputFiles"]>[0],
    options?: Parameters<CoreLocator["setInputFiles"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Taps the element.
   *
   * @see {@link CoreLocator.tap}
   * @since 0.4.2
   */
  readonly tap: (
    options?: Parameters<CoreLocator["tap"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Unchecks the element.
   *
   * @see {@link CoreLocator.uncheck}
   * @since 0.4.2
   */
  readonly uncheck: (
    options?: Parameters<CoreLocator["uncheck"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
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
   * @see {@link CoreLocator}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (locator: CoreLocator) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
}

/**
 * A service that provides a `Locator` instance.
 *
 * @since 0.1.0
 * @category tag
 */
export class Locator extends Context.Tag("effect-playwright/locator/Locator")<
  Locator,
  LocatorService
>() {
  /**
   * Creates a `Locator` from a Playwright `Locator` instance. This is mostly for internal use.
   * But you could use this if you have used `use` or similar to wrap the locator.
   *
   * @example
   * ```ts
   * const playwrightNativeLocator = yield* page.use((p) => p.locator("button"));
   * const locator = Locator.make(playwrightNativeLocator);
   * ```
   *
   * @param locator - The Playwright `Locator` instance to wrap.
   * @since 0.1.0
   * @category constructor
   */
  static make(locator: CoreLocator): typeof Locator.Service {
    const use = useHelper(locator);
    const unwrap = Match.type<CoreLocator | LocatorService>().pipe(
      Match.when(Predicate.hasProperty("_raw"), (l) => l._raw),
      Match.orElse((l) => l),
    );

    return Locator.of({
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
      describe: (description) => Locator.make(locator.describe(description)),
      description: () => Option.fromNullable(locator.description()),
      count: use((l) => l.count()),
      first: () => Locator.make(locator.first()),
      last: () => Locator.make(locator.last()),
      nth: (index: number) => Locator.make(locator.nth(index)),
      all: () => use((l) => l.all()).pipe(Effect.map(Array.map(Locator.make))),
      and: (locatorOrService) =>
        Locator.make(locator.and(unwrap(locatorOrService))),
      contentFrame: () => FrameLocator.make(locator.contentFrame()),
      filter: (options) => Locator.make(locator.filter(options)),
      frameLocator: (selector) =>
        FrameLocator.make(locator.frameLocator(selector)),
      or: (locatorOrService) =>
        Locator.make(locator.or(unwrap(locatorOrService))),
      page: () => Page.make(locator.page()),
      locator: (selectorOrLocator, options) =>
        Locator.make(
          typeof selectorOrLocator === "string"
            ? locator.locator(selectorOrLocator, options)
            : locator.locator(unwrap(selectorOrLocator), options),
        ),
      getByRole: (role, options) =>
        Locator.make(locator.getByRole(role, options)),
      getByText: (text, options) =>
        Locator.make(locator.getByText(text, options)),
      getByLabel: (text, options) =>
        Locator.make(locator.getByLabel(text, options)),
      getByPlaceholder: (text, options) =>
        Locator.make(locator.getByPlaceholder(text, options)),
      getByAltText: (text, options) =>
        Locator.make(locator.getByAltText(text, options)),
      getByTitle: (text, options) =>
        Locator.make(locator.getByTitle(text, options)),
      getByTestId: (testId) => Locator.make(locator.getByTestId(testId)),
      isChecked: (options) => use((l) => l.isChecked(options)),
      isDisabled: (options) => use((l) => l.isDisabled(options)),
      isEditable: (options) => use((l) => l.isEditable(options)),
      isEnabled: (options) => use((l) => l.isEnabled(options)),
      isHidden: (options) => use((l) => l.isHidden(options)),
      isVisible: (options) => use((l) => l.isVisible(options)),
      waitFor: (options) => use((l) => l.waitFor(options)),
      waitForFunction: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
        options?: Parameters<CoreLocator["waitForFunction"]>[2],
      ) =>
        use((l) =>
          l.waitForFunction<Arg, E>(
            pageFunction as unknown as Parameters<
              typeof l.waitForFunction<Arg, E>
            >[0],
            arg as Arg,
            options,
          ),
        ),
      evaluate: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
        options?: Parameters<CoreLocator["evaluate"]>[2],
      ) =>
        use((l) =>
          l.evaluate<R, Arg, E>(
            pageFunction as unknown as Parameters<
              typeof l.evaluate<R, Arg, E>
            >[0],
            arg as Arg,
            options,
          ),
        ),
      evaluateAll: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (elements: E[], arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
      ) =>
        use((l) =>
          l.evaluateAll<R, Arg, E>(
            pageFunction as unknown as Parameters<
              typeof l.evaluateAll<R, Arg, E>
            >[0],
            arg as Arg,
          ),
        ),
      evaluateHandle: <
        R,
        Arg = void,
        E extends SVGElement | HTMLElement = SVGElement | HTMLElement,
      >(
        pageFunction: (element: E, arg: Unboxed<Arg>) => R | Promise<R>,
        arg?: Arg,
        options?: Parameters<CoreLocator["evaluateHandle"]>[2],
      ) =>
        use((l) =>
          l.evaluateHandle<R, Arg, E>(
            pageFunction as unknown as Parameters<
              typeof l.evaluateHandle<R, Arg, E>
            >[0],
            arg as Arg,
            options,
          ),
        ),
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
      highlight: (options) => use((l) => l.highlight(options)),
      hideHighlight: use((l) => l.hideHighlight()),
      drop: (data, options) => use((l) => l.drop(data, options)),
      normalize: () => use((l) => l.normalize().then(Locator.make)),
      screenshot: (options) => use((l) => l.screenshot(options)),
      blur: (options) => use((l) => l.blur(options)),
      clear: (options) => use((l) => l.clear(options)),
      dblclick: (options) => use((l) => l.dblclick(options)),
      dispatchEvent: (type, eventInit, options) =>
        use((l) => l.dispatchEvent(type, eventInit, options)),
      dragTo: (target, options) =>
        use((l) => l.dragTo(unwrap(target), options)),
      focus: (options) => use((l) => l.focus(options)),
      hover: (options) => use((l) => l.hover(options)),
      press: (key, options) => use((l) => l.press(key, options)),
      pressSequentially: (text, options) =>
        use((l) => l.pressSequentially(text, options)),
      scrollIntoViewIfNeeded: (options) =>
        use((l) => l.scrollIntoViewIfNeeded(options)),
      selectOption: (values, options) =>
        use((l) => l.selectOption(values, options)),
      selectText: (options) => use((l) => l.selectText(options)),
      setChecked: (checked, options) =>
        use((l) => l.setChecked(checked, options)),
      setInputFiles: (files, options) =>
        use((l) => l.setInputFiles(files, options)),
      tap: (options) => use((l) => l.tap(options)),
      uncheck: (options) => use((l) => l.uncheck(options)),
      toString: () => locator.toString(),
      use,
    });
  }
}
