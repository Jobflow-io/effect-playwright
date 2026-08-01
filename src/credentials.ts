import { Context, type Effect } from "effect";
import type { Credentials } from "playwright-core";
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
 *   const context = yield* browser.newContext();
 *   yield* context.credentials.install;
 *   const credential = yield* context.credentials.create("example.com");
 *   const credentials = yield* context.credentials.get({ id: credential.id });
 *   yield* context.credentials.delete(credential.id);
 *   return credentials;
 * });
 * ```
 *
 * @category model
 * @since 0.5.1
 */
export interface PlaywrightCredentialsService {
  /**
   * Installs the virtual WebAuthn authenticator into the browser context.
   *
   * @see {@link Credentials.install}
   * @since 0.5.1
   */
  readonly install: Effect.Effect<
    Awaited<ReturnType<Credentials["install"]>>,
    PlaywrightError
  >;

  /**
   * Seeds a virtual WebAuthn credential and returns it.
   *
   * @see {@link Credentials.create}
   * @since 0.5.1
   */
  readonly create: (
    rpId: Parameters<Credentials["create"]>[0],
    options?: Parameters<Credentials["create"]>[1],
  ) => Effect.Effect<
    Awaited<ReturnType<Credentials["create"]>>,
    PlaywrightError
  >;

  /**
   * Returns credentials currently held by the virtual authenticator.
   *
   * @see {@link Credentials.get}
   * @since 0.5.1
   */
  readonly get: (
    options?: Parameters<Credentials["get"]>[0],
  ) => Effect.Effect<Awaited<ReturnType<Credentials["get"]>>, PlaywrightError>;

  /**
   * Removes a credential from the virtual authenticator.
   *
   * @see {@link Credentials.delete}
   * @since 0.5.1
   */
  readonly delete: (
    id: Parameters<Credentials["delete"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<Credentials["delete"]>>,
    PlaywrightError
  >;
}

/**
 * @category tag
 * @since 0.5.1
 */
export class PlaywrightCredentials extends Context.Tag(
  "effect-playwright/PlaywrightCredentials",
)<PlaywrightCredentials, PlaywrightCredentialsService>() {
  /**
   * Creates a `PlaywrightCredentials` from a Playwright `Credentials` instance.
   *
   * @category constructor
   * @since 0.5.1
   */
  static make(credentials: Credentials): PlaywrightCredentialsService {
    const use = useHelper(credentials);

    return PlaywrightCredentials.of({
      install: use((c) => c.install()),
      create: (rpId, options) => use((c) => c.create(rpId, options)),
      get: (options) => use((c) => c.get(options)),
      delete: (id) => use((c) => c.delete(id)),
    });
  }
}
