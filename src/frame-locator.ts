import { Context, Match, Predicate } from "effect";
import type {
  FrameLocator as CoreFrameLocator,
  Locator as CoreLocator,
} from "playwright-core";
import { Locator, type LocatorService } from "./locator";

/**
 * Interface for a Playwright frame locator.
 * @category model
 */
export interface FrameLocatorService {
  /**
   * The underlying Playwright FrameLocator instance.
   * @internal
   */
  readonly _raw: CoreFrameLocator;

  /**
   * Returns locator to the first matching frame.
   *
   * @see {@link CoreFrameLocator.first}
   * @since 0.1.0
   */
  readonly first: () => FrameLocatorService;

  /**
   * When working with iframes, you can create a frame locator that will enter the iframe and allow selecting elements
   * in that iframe.
   *
   * @see {@link CoreFrameLocator.frameLocator}
   * @since 0.1.0
   */
  readonly frameLocator: (selector: string) => FrameLocatorService;

  /**
   * Returns locator to the last matching frame.
   *
   * @see {@link CoreFrameLocator.last}
   * @since 0.1.0
   */
  readonly last: () => FrameLocatorService;

  /**
   * Returns locator to the n-th matching frame.
   *
   * @see {@link CoreFrameLocator.nth}
   * @since 0.1.0
   */
  readonly nth: (index: number) => FrameLocatorService;

  /**
   * Returns a `Locator` object pointing to the same `iframe` as this frame locator.
   *
   * @see {@link CoreFrameLocator.owner}
   * @since 0.1.0
   */
  readonly owner: () => LocatorService;

  /**
   * Finds an element matching the specified selector in the locator's subtree.
   *
   * @see {@link CoreFrameLocator.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selectorOrLocator: string | CoreLocator | LocatorService,
    options?: Parameters<CoreFrameLocator["locator"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their ARIA role.
   *
   * @see {@link CoreFrameLocator.getByRole}
   * @since 0.1.0
   */
  readonly getByRole: (
    role: Parameters<CoreFrameLocator["getByRole"]>[0],
    options?: Parameters<CoreFrameLocator["getByRole"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements that contain given text.
   *
   * @see {@link CoreFrameLocator.getByText}
   * @since 0.1.0
   */
  readonly getByText: (
    text: Parameters<CoreFrameLocator["getByText"]>[0],
    options?: Parameters<CoreFrameLocator["getByText"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their label text.
   *
   * @see {@link CoreFrameLocator.getByLabel}
   * @since 0.1.0
   */
  readonly getByLabel: (
    text: Parameters<CoreFrameLocator["getByLabel"]>[0],
    options?: Parameters<CoreFrameLocator["getByLabel"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their placeholder text.
   *
   * @see {@link CoreFrameLocator.getByPlaceholder}
   * @since 0.1.0
   */
  readonly getByPlaceholder: (
    text: Parameters<CoreFrameLocator["getByPlaceholder"]>[0],
    options?: Parameters<CoreFrameLocator["getByPlaceholder"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their alt text.
   *
   * @see {@link CoreFrameLocator.getByAltText}
   * @since 0.1.0
   */
  readonly getByAltText: (
    text: Parameters<CoreFrameLocator["getByAltText"]>[0],
    options?: Parameters<CoreFrameLocator["getByAltText"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their title attribute.
   *
   * @see {@link CoreFrameLocator.getByTitle}
   * @since 0.1.0
   */
  readonly getByTitle: (
    text: Parameters<CoreFrameLocator["getByTitle"]>[0],
    options?: Parameters<CoreFrameLocator["getByTitle"]>[1],
  ) => LocatorService;

  /**
   * Allows locating elements by their test id.
   *
   * @see {@link CoreFrameLocator.getByTestId}
   * @since 0.1.0
   */
  readonly getByTestId: (
    testId: Parameters<CoreFrameLocator["getByTestId"]>[0],
  ) => LocatorService;
}

/**
 * A service that provides a `FrameLocator` instance.
 *
 * @since 0.1.0
 * @category tag
 */
export class FrameLocator extends Context.Tag(
  "effect-playwright/frame-locator/FrameLocator",
)<FrameLocator, FrameLocatorService>() {
  /**
   * Creates a `FrameLocator` from a Playwright `FrameLocator` instance.
   *
   * @param frameLocator - The Playwright `FrameLocator` instance to wrap.
   * @since 0.1.0
   * @category constructor
   */
  static make(frameLocator: CoreFrameLocator): typeof FrameLocator.Service {
    const unwrap = Match.type<string | CoreLocator | LocatorService>().pipe(
      Match.when(Predicate.hasProperty("_raw"), (l) => l._raw),
      Match.orElse((l) => l),
    );

    return FrameLocator.of({
      _raw: frameLocator,
      first: () => FrameLocator.make(frameLocator.first()),
      frameLocator: (selector: string) =>
        FrameLocator.make(frameLocator.frameLocator(selector)),
      last: () => FrameLocator.make(frameLocator.last()),
      nth: (index: number) => FrameLocator.make(frameLocator.nth(index)),
      owner: () => Locator.make(frameLocator.owner()),
      locator: (selectorOrLocator, options) =>
        Locator.make(frameLocator.locator(unwrap(selectorOrLocator), options)),
      getByRole: (role, options) =>
        Locator.make(frameLocator.getByRole(role, options)),
      getByText: (text, options) =>
        Locator.make(frameLocator.getByText(text, options)),
      getByLabel: (text, options) =>
        Locator.make(frameLocator.getByLabel(text, options)),
      getByPlaceholder: (text, options) =>
        Locator.make(frameLocator.getByPlaceholder(text, options)),
      getByAltText: (text, options) =>
        Locator.make(frameLocator.getByAltText(text, options)),
      getByTitle: (text, options) =>
        Locator.make(frameLocator.getByTitle(text, options)),
      getByTestId: (testId) => Locator.make(frameLocator.getByTestId(testId)),
    });
  }
}
