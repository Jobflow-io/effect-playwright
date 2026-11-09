/**
 * Effect service wrapper for Playwright trace and HAR recording.
 *
 * @since 0.5.0
 */

import { Context, Effect, type Scope } from "effect";
import type { Tracing as CoreTracing } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category models
 * @since 0.5.0
 */
export interface Tracing {
  /**
   * Starts tracing.
   *
   * @see {@link CoreTracing.start}
   * @since 0.5.0
   */
  readonly start: (
    options?: Parameters<CoreTracing["start"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Starts a new tracing chunk.
   *
   * @see {@link CoreTracing.startChunk}
   * @since 0.5.0
   */
  readonly startChunk: (
    options?: Parameters<CoreTracing["startChunk"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Starts tracing and stops it when the current `Scope` closes.
   *
   * **When to use**
   *
   * Use instead of pairing {@link Tracing.start} with {@link Tracing.stop}, so
   * the trace is stopped even when the workflow fails or is interrupted.
   *
   * **Gotchas**
   *
   * Pass `stopOptions.path` to save the trace; without it Playwright discards
   * the recording. A failure while stopping is logged instead of failing the
   * scope.
   *
   * @example
   * ```ts
   * import { Effect } from "effect";
   * import { Playwright } from "effect-playwright";
   * import { chromium } from "playwright-core";
   *
   * const program = Effect.gen(function* () {
   *   const playwright = yield* Playwright.Playwright;
   *   const browser = yield* playwright.launchScoped(chromium);
   *   const context = yield* browser.newContext();
   *   yield* context.tracing.startScoped(
   *     { screenshots: true, snapshots: true },
   *     { path: "trace.zip" },
   *   );
   *   const page = yield* context.newPage;
   *   yield* page.goto("https://example.com");
   * }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
   * ```
   *
   * @param options - Options passed to {@link Tracing.start}.
   * @param stopOptions - Options passed to {@link Tracing.stop} when the scope closes.
   * @see {@link CoreTracing.start}
   * @since 0.9.0
   */
  readonly startScoped: (
    options?: Parameters<CoreTracing["start"]>[0],
    stopOptions?: Parameters<CoreTracing["stop"]>[0],
  ) => Effect.Effect<void, PlaywrightError, Scope.Scope>;

  /**
   * Starts a new tracing chunk and stops it when the current `Scope` closes.
   *
   * Tracing must already be started. Pass `stopOptions.path` to save the
   * chunk; a failure while stopping is logged instead of failing the scope.
   *
   * @param options - Options passed to {@link Tracing.startChunk}.
   * @param stopOptions - Options passed to {@link Tracing.stopChunk} when the scope closes.
   * @see {@link CoreTracing.startChunk}
   * @since 0.9.0
   */
  readonly startChunkScoped: (
    options?: Parameters<CoreTracing["startChunk"]>[0],
    stopOptions?: Parameters<CoreTracing["stopChunk"]>[0],
  ) => Effect.Effect<void, PlaywrightError, Scope.Scope>;

  /**
   * Stops a tracing chunk.
   *
   * @see {@link CoreTracing.stopChunk}
   * @since 0.5.0
   */
  readonly stopChunk: (
    options?: Parameters<CoreTracing["stopChunk"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops tracing.
   *
   * @see {@link CoreTracing.stop}
   * @since 0.5.0
   */
  readonly stop: (
    options?: Parameters<CoreTracing["stop"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Starts HAR recording.
   *
   * @see {@link CoreTracing.startHar}
   * @since 0.5.0
   */
  readonly startHar: (
    options: Parameters<CoreTracing["startHar"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops HAR recording.
   *
   * @see {@link CoreTracing.stopHar}
   * @since 0.5.0
   */
  readonly stopHar: Effect.Effect<void, PlaywrightError>;
}

/**
 * @category services
 */
export const Tracing = Context.Service<Tracing>(
  "effect-playwright/tracing/Tracing",
);

/**
 * Creates `Tracing` from a Playwright `Tracing` instance.
 *
 * @param tracing - The Playwright `Tracing` instance to wrap.
 * @category constructors
 * @since 0.5.0
 */
export const makeTracing = (tracing: CoreTracing): Tracing => {
  const use = useHelper(tracing);
  const start: Tracing["start"] = (options) =>
    use((t) => t.start(options).then(() => {}));
  const startChunk: Tracing["startChunk"] = (options) =>
    use((t) => t.startChunk(options).then(() => {}));
  const stopChunk: Tracing["stopChunk"] = (options) =>
    use((t) => t.stopChunk(options));
  const stop: Tracing["stop"] = (options) => use((t) => t.stop(options));
  return Tracing.of({
    start,
    startChunk,
    startScoped: (options, stopOptions) =>
      Effect.acquireRelease(start(options), () =>
        stop(stopOptions).pipe(Effect.ignore({ log: true })),
      ),
    startChunkScoped: (options, stopOptions) =>
      Effect.acquireRelease(startChunk(options), () =>
        stopChunk(stopOptions).pipe(Effect.ignore({ log: true })),
      ),
    stopChunk,
    stop,
    startHar: (options) => use((t) => t.startHar(options).then(() => {})),
    stopHar: use((t) => t.stopHar()),
  });
};
