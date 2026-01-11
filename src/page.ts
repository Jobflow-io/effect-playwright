import { Context, Effect } from "effect";
import type { Page } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { PlaywrightLocator } from "./locator";
import type { PageFunction } from "./playwright-types";
import { useHelper } from "./utils";

export type ClickOptions = Parameters<Page["click"]>[1];

export interface PlaywrightPageService {
  /**
   * Navigates the page to the given URL.
   * See [Playwright Docs](https://playwright.dev/docs/api/class-page#page-goto) for more information.
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
   * Evaluates a function in the context of the page.
   * See [Playwright Docs](https://playwright.dev/docs/api/class-page#page-evaluate) for more information.
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
   * Returns the page title.
   * See [Playwright Docs](https://playwright.dev/docs/api/class-page#page-title) for more information.
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
   * @see {@link Page.locator}
   * @since 0.1.0
   */
  readonly locator: (
    selector: string,
    options?: Parameters<Page["locator"]>[1],
  ) => typeof PlaywrightLocator.Service;

  /**
   * Reloads the page.
   *
   * @see {@link Page.reload}
   * @since 0.1.0
   */
  readonly reload: Effect.Effect<void, PlaywrightError>;
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
   * const url = yield* page.url;
   * ```
   *
   * @see {@link Page.url}
   * @since 0.1.0
   */
  readonly url: Effect.Effect<string, PlaywrightError>;

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
    options?: ClickOptions,
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 */
export class PlaywrightPage extends Context.Tag(
  "@jobflow/effect-playwright/PlaywrightPage",
)<PlaywrightPage, PlaywrightPageService>() {
  /**
   * Creates a `PlaywrightPage` from a Playwright `Page` instance.
   *
   * @param page - The Playwright `Page` instance to wrap.
   * @since 0.1.0
   */
  static make(page: Page) {
    const use = useHelper(page);

    return PlaywrightPage.of({
      goto: (url: string, options?: Parameters<Page["goto"]>[1]) =>
        use((p) => p.goto(url, options)),
      title: use((p) => p.title()),
      evaluate: <R, Arg>(f: PageFunction<Arg, R>, arg?: Arg) =>
        use((p) => p.evaluate(f, arg as Arg)),
      locator: (selector: string, options?: Parameters<Page["locator"]>[1]) =>
        PlaywrightLocator.make(page.locator(selector, options)),
      url: Effect.sync(() => page.url()),
      reload: use((p) => p.reload()),
      close: use((p) => p.close()),
      click: (selector: string, options?: ClickOptions) =>
        use((p) => p.click(selector, options)),
      use,
    });
  }
}
