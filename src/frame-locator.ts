import { Context, Match, Predicate } from "effect";
import type { FrameLocator, Locator } from "playwright-core";
import { PlaywrightLocator, type PlaywrightLocatorService } from "./locator";

/**
 * Interface for a Playwright frame locator.
 * @category model
 */
export interface PlaywrightFrameLocatorService {
  /**
   * The underlying Playwright FrameLocator instance.
   * @internal
   */
  readonly _raw: FrameLocator;

  /**
   * Returns locator to the first matching frame.
   *
   * @see {@link FrameLocator.first}
   * @since 0.1.0
   */
  readonly first: () => PlaywrightFrameLocatorService;

  /**
   * When working with iframes, you can create a frame locator that will enter the iframe and allow selecting elements
   * in that iframe.
   *
   * @see {@link FrameLocator.frameLocator}
   * @since 0.1.0
   */
  readonly frameLocator: (selector: string) => PlaywrightFrameLocatorService;

  /**
   * Returns locator to the last matching frame.
   *
   * @see {@link FrameLocator.last}
   * @since 0.1.0
   */
  readonly last: () => PlaywrightFrameLocatorService;

  /**
   * Returns locator to the n-th matching frame.
   *
   * @see {@link FrameLocator.nth}
   * @since 0.1.0
   */
  readonly nth: (index: number) => PlaywrightFrameLocatorService;

  /**
   * Returns a `Locator` object pointing to the same `iframe` as this frame locator.
   *
   * @see {@link FrameLocator.owner}
   * @since 0.1.0
   */
  readonly owner: () => PlaywrightLocatorService;

  /**
   * Finds an element matching the specified selector in the locator's subtree.
   *
   * @see {@link FrameLocator.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selectorOrLocator: string | Locator | PlaywrightLocatorService,
    options?: Parameters<FrameLocator["locator"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their ARIA role.
   *
   * @see {@link FrameLocator.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<FrameLocator["getByRole"]>[0],
    options?: Parameters<FrameLocator["getByRole"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements that contain given text.
   *
   * @see {@link FrameLocator.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<FrameLocator["getByText"]>[0],
    options?: Parameters<FrameLocator["getByText"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their label text.
   *
   * @see {@link FrameLocator.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    text: Parameters<FrameLocator["getByLabel"]>[0],
    options?: Parameters<FrameLocator["getByLabel"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their placeholder text.
   *
   * @see {@link FrameLocator.getByPlaceholder}
   * @since 0.1.0
   */
  readonly getByPlaceholder: (
    text: Parameters<FrameLocator["getByPlaceholder"]>[0],
    options?: Parameters<FrameLocator["getByPlaceholder"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their alt text.
   *
   * @see {@link FrameLocator.getByAltText}
   * @since 0.1.0
   */
  readonly getByAltText: (
    text: Parameters<FrameLocator["getByAltText"]>[0],
    options?: Parameters<FrameLocator["getByAltText"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their title attribute.
   *
   * @see {@link FrameLocator.getByTitle}
   * @since 0.1.0
   */
  readonly getByTitle: (
    text: Parameters<FrameLocator["getByTitle"]>[0],
    options?: Parameters<FrameLocator["getByTitle"]>[1],
  ) => PlaywrightLocatorService;

  /**
   * Allows locating elements by their test id.
   *
   * @see {@link FrameLocator.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<FrameLocator["getByTestId"]>[0],
  ) => PlaywrightLocatorService;
}

/**
 * A service that provides a `PlaywrightFrameLocator` instance.
 *
 * @since 0.1.0
 * @category tag
 */
export class PlaywrightFrameLocator extends Context.Tag(
  "effect-playwright/PlaywrightFrameLocator",
)<PlaywrightFrameLocator, PlaywrightFrameLocatorService>() {
  /**
   * Creates a `PlaywrightFrameLocator` from a Playwright `FrameLocator` instance.
   *
   * @param frameLocator - The Playwright `FrameLocator` instance to wrap.
   * @since 0.1.0
   * @category constructor
   */
  static make(
    frameLocator: FrameLocator,
  ): typeof PlaywrightFrameLocator.Service {
    const unwrap = Match.type<
      string | Locator | PlaywrightLocatorService
    >().pipe(
      Match.when(Predicate.hasProperty("_raw"), (l) => l._raw),
      Match.orElse((l) => l),
    );

    return PlaywrightFrameLocator.of({
      _raw: frameLocator,
      first: () => PlaywrightFrameLocator.make(frameLocator.first()),
      frameLocator: (selector: string) =>
        PlaywrightFrameLocator.make(frameLocator.frameLocator(selector)),
      last: () => PlaywrightFrameLocator.make(frameLocator.last()),
      nth: (index: number) =>
        PlaywrightFrameLocator.make(frameLocator.nth(index)),
      owner: () => PlaywrightLocator.make(frameLocator.owner()),
      locator: (selectorOrLocator, options) =>
        PlaywrightLocator.make(
          frameLocator.locator(unwrap(selectorOrLocator), options),
        ),
      getByRole: (role, options) =>
        PlaywrightLocator.make(frameLocator.getByRole(role, options)),
      getByText: (text, options) =>
        PlaywrightLocator.make(frameLocator.getByText(text, options)),
      getByLabel: (text, options) =>
        PlaywrightLocator.make(frameLocator.getByLabel(text, options)),
      getByPlaceholder: (text, options) =>
        PlaywrightLocator.make(frameLocator.getByPlaceholder(text, options)),
      getByAltText: (text, options) =>
        PlaywrightLocator.make(frameLocator.getByAltText(text, options)),
      getByTitle: (text, options) =>
        PlaywrightLocator.make(frameLocator.getByTitle(text, options)),
      getByTestId: (testId) =>
        PlaywrightLocator.make(frameLocator.getByTestId(testId)),
    });
  }
}
