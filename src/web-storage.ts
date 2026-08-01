import { Context, Effect, Option } from "effect";
import type { WebStorage } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightBrowser } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const browser = yield* PlaywrightBrowser;
 *   const page = yield* browser.newPage();
 *   yield* page.goto("https://example.com");
 *   yield* page.localStorage.setItem("theme", "dark");
 *   return yield* page.localStorage.getItem("theme");
 * });
 * ```
 *
 * @category model
 * @since 0.5.1
 */
export interface PlaywrightWebStorageService {
  /**
   * Removes all items from storage.
   *
   * @see {@link WebStorage.clear}
   * @since 0.5.1
   */
  readonly clear: Effect.Effect<
    Awaited<ReturnType<WebStorage["clear"]>>,
    PlaywrightError
  >;

  /**
   * Returns the value stored under the given name, if present.
   *
   * @see {@link WebStorage.getItem}
   * @since 0.5.1
   */
  readonly getItem: (
    name: Parameters<WebStorage["getItem"]>[0],
  ) => Effect.Effect<
    Option.Option<NonNullable<Awaited<ReturnType<WebStorage["getItem"]>>>>,
    PlaywrightError
  >;

  /**
   * Returns all items in storage as name/value pairs.
   *
   * @see {@link WebStorage.items}
   * @since 0.5.1
   */
  readonly items: Effect.Effect<
    Awaited<ReturnType<WebStorage["items"]>>,
    PlaywrightError
  >;

  /**
   * Removes the item stored under the given name.
   *
   * @see {@link WebStorage.removeItem}
   * @since 0.5.1
   */
  readonly removeItem: (
    name: Parameters<WebStorage["removeItem"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<WebStorage["removeItem"]>>,
    PlaywrightError
  >;

  /**
   * Stores a value under the given name.
   *
   * @see {@link WebStorage.setItem}
   * @since 0.5.1
   */
  readonly setItem: (
    name: Parameters<WebStorage["setItem"]>[0],
    value: Parameters<WebStorage["setItem"]>[1],
  ) => Effect.Effect<
    Awaited<ReturnType<WebStorage["setItem"]>>,
    PlaywrightError
  >;
}

/**
 * @category tag
 * @since 0.5.1
 */
export class PlaywrightWebStorage extends Context.Tag(
  "effect-playwright/PlaywrightWebStorage",
)<PlaywrightWebStorage, PlaywrightWebStorageService>() {
  /**
   * Creates a `PlaywrightWebStorage` from a Playwright `WebStorage` instance.
   *
   * @category constructor
   * @since 0.5.1
   */
  static make(webStorage: WebStorage): PlaywrightWebStorageService {
    const use = useHelper(webStorage);

    return PlaywrightWebStorage.of({
      clear: use((storage) => storage.clear()),
      getItem: (name) =>
        use((storage) => storage.getItem(name)).pipe(
          Effect.map(Option.fromNullable),
        ),
      items: use((storage) => storage.items()),
      removeItem: (name) => use((storage) => storage.removeItem(name)),
      setItem: (name, value) => use((storage) => storage.setItem(name, value)),
    });
  }
}
