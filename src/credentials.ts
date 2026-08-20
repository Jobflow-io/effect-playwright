/**
 * Effect service wrapper for Playwright WebAuthn credential operations.
 *
 * @since 0.5.1
 */

import { Context, type Effect } from "effect";
import type { Credentials as CoreCredentials } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const browser = yield* Playwright.Browser;
 *   const context = yield* browser.newContext();
 *   yield* context.credentials.install;
 *   const credential = yield* context.credentials.create("example.com");
 *   const credentials = yield* context.credentials.get({ id: credential.id });
 *   yield* context.credentials.delete(credential.id);
 *   return credentials;
 * });
 * ```
 *
 * @category models
 * @since 0.5.1
 */
export interface Credentials {
  /**
   * Installs the virtual WebAuthn authenticator into the browser context.
   *
   * @see {@link CoreCredentials.install}
   * @since 0.5.1
   */
  readonly install: Effect.Effect<
    Awaited<ReturnType<CoreCredentials["install"]>>,
    PlaywrightError
  >;

  /**
   * Seeds a virtual WebAuthn credential and returns it.
   *
   * @see {@link CoreCredentials.create}
   * @since 0.5.1
   */
  readonly create: (
    rpId: Parameters<CoreCredentials["create"]>[0],
    options?: Parameters<CoreCredentials["create"]>[1],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreCredentials["create"]>>,
    PlaywrightError
  >;

  /**
   * Returns credentials currently held by the virtual authenticator.
   *
   * @see {@link CoreCredentials.get}
   * @since 0.5.1
   */
  readonly get: (
    options?: Parameters<CoreCredentials["get"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreCredentials["get"]>>,
    PlaywrightError
  >;

  /**
   * Removes a credential from the virtual authenticator.
   *
   * @see {@link CoreCredentials.delete}
   * @since 0.5.1
   */
  readonly delete: (
    id: Parameters<CoreCredentials["delete"]>[0],
  ) => Effect.Effect<
    Awaited<ReturnType<CoreCredentials["delete"]>>,
    PlaywrightError
  >;
}

/**
 * @category services
 * @since 0.5.1
 */
export const Credentials = Context.Service<Credentials>(
  "effect-playwright/credentials/Credentials",
);

/**
 * Creates `Credentials` from a Playwright `Credentials` instance.
 *
 * @param credentials - The Playwright `Credentials` instance to wrap.
 * @category constructors
 * @since 0.5.1
 */
export const makeCredentials = (credentials: CoreCredentials): Credentials => {
  const use = useHelper(credentials);

  return Credentials.of({
    install: use((c) => c.install()),
    create: (rpId, options) => use((c) => c.create(rpId, options)),
    get: (options) => use((c) => c.get(options)),
    delete: (id) => use((c) => c.delete(id)),
  });
};
