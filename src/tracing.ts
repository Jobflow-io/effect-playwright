import { Context, type Effect } from "effect";
import type { Tracing } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.5.0
 */
export interface PlaywrightTracingService {
  /**
   * Starts tracing.
   *
   * @see {@link Tracing.start}
   * @since 0.5.0
   */
  readonly start: (
    options?: Parameters<Tracing["start"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Starts a new tracing chunk.
   *
   * @see {@link Tracing.startChunk}
   * @since 0.5.0
   */
  readonly startChunk: (
    options?: Parameters<Tracing["startChunk"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops a tracing chunk.
   *
   * @see {@link Tracing.stopChunk}
   * @since 0.5.0
   */
  readonly stopChunk: (
    options?: Parameters<Tracing["stopChunk"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops tracing.
   *
   * @see {@link Tracing.stop}
   * @since 0.5.0
   */
  readonly stop: (
    options?: Parameters<Tracing["stop"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Starts HAR recording.
   *
   * @see {@link Tracing.startHar}
   * @since 0.5.0
   */
  readonly startHar: (
    options: Parameters<Tracing["startHar"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops HAR recording.
   *
   * @see {@link Tracing.stopHar}
   * @since 0.5.0
   */
  readonly stopHar: Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 */
export class PlaywrightTracing extends Context.Service<
  PlaywrightTracing,
  PlaywrightTracingService
>()("effect-playwright/PlaywrightTracing") {
  /**
   * @category constructor
   */
  static make(tracing: Tracing): PlaywrightTracingService {
    const use = useHelper(tracing);
    return PlaywrightTracing.of({
      start: (options) => use((t) => t.start(options)),
      startChunk: (options) => use((t) => t.startChunk(options)),
      stopChunk: (options) => use((t) => t.stopChunk(options)),
      stop: (options) => use((t) => t.stop(options)),
      startHar: (options) => use((t) => t.startHar(options).then(() => {})),
      stopHar: use((t) => t.stopHar()),
    });
  }
}
