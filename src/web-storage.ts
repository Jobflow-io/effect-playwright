import { Context, Effect, Option } from "effect";
import type { WebStorage as CoreWebStorage } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Browser } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const browser = yield* Browser;
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
export interface WebStorageService {
  /**
   * Removes all items from storage.
   *
   * @see {@link CoreWebStorage.clear}
   * @since 0.5.1
   */
  readonly clear: Effect.Effect<
    Awaited<ReturnType<CoreWebStorage["clear"]>>,
    PlaywrightError
  >;

  /**
   * Returns the value stored under the given name, if present.
   *
   * @see {@link CoreWebStorage.getItem}
   * @since 0.5.1
   */
  readonly getItem: (
    name: Parameters<CoreWebStorage["getItem"]>[0],
  ) => Effect.Effect<
    Option.Option<NonNullable<Awaited<ReturnType<CoreWebStorage["getItem"]>>>>,
    PlaywrightError
  >;

  /**
   * Returns all items in storage as name/value pairs.
   *
   * @see {@link CoreWebStorage.items}
   * @since 0.5.1
   */
  readonly items: Effect.Effect<
    Awaited<ReturnType<CoreWebStorage["items"]>>,
    PlaywrightError
  >;

  /**
   * Removes the item stored under the given name.
   *
   * @see {@link CoreWebStorage.removeItem}
   * @since 0.5.1
   */
  readonly removeItem: (
    name: Parameters<CoreWebStorage["removeItem"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreWebStorage["removeItem"]>>,
    PlaywrightError
  >;

  /**
   * Stores a value under the given name.
   *
   * @see {@link CoreWebStorage.setItem}
   * @since 0.5.1
   */
  readonly setItem: (
    name: Parameters<CoreWebStorage["setItem"]>[0],
    value: Parameters<CoreWebStorage["setItem"]>[1],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreWebStorage["setItem"]>>,
    PlaywrightError
  >;
}

/**
 * @category tag
 * @since 0.5.1
 */
export class WebStorage extends Context.Tag(
  "effect-playwright/web-storage/WebStorage",
)<WebStorage, WebStorageService>() {
  /**
   * Creates a `WebStorage` from a Playwright `WebStorage` instance.
   *
   * @category constructor
   * @since 0.5.1
   */
  static make(webStorage: CoreWebStorage): WebStorageService {
    const use = useHelper(webStorage);

    return WebStorage.of({
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
