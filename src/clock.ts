import { Context, type Effect } from "effect";
import type { Clock } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * Interface for a Playwright clock.
 * @category model
 */
export interface PlaywrightClockService {
  /**
   * Advance the clock by jumping forward in time. Only fires due timers at most once. This is equivalent to user
   * closing the laptop lid for a while and reopening it later, after given time.
   *
   * @see {@link Clock.fastForward}
   * @since 0.1.0
   */
  readonly fastForward: (
    ticks: number | string,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Install fake implementations for time-related functions.
   *
   * @see {@link Clock.install}
   * @since 0.1.0
   */
  readonly install: (options?: {
    time?: number | string | Date;
  }) => Effect.Effect<void, PlaywrightError>;

  /**
   * Advance the clock by jumping forward in time and pause the time.
   *
   * @see {@link Clock.pauseAt}
   * @since 0.1.0
   */
  readonly pauseAt: (
    time: number | string | Date,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Resumes timers. Once this method is called, time resumes flowing, timers are fired as usual.
   *
   * @see {@link Clock.resume}
   * @since 0.1.0
   */
  readonly resume: Effect.Effect<void, PlaywrightError>;

  /**
   * Advance the clock, firing all the time-related callbacks.
   *
   * @see {@link Clock.runFor}
   * @since 0.1.0
   */
  readonly runFor: (
    ticks: number | string,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Makes `Date.now` and `new Date()` return fixed fake time at all times, keeps all the timers running.
   *
   * @see {@link Clock.setFixedTime}
   * @since 0.1.0
   */
  readonly setFixedTime: (
    time: number | string | Date,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Sets system time, but does not trigger any timers.
   *
   * @see {@link Clock.setSystemTime}
   * @since 0.1.0
   */
  readonly setSystemTime: (
    time: number | string | Date,
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * A generic utility to execute any promise-based method on the underlying Playwright `Clock`.
   * Can be used to access any Clock functionality not directly exposed by this service.
   *
   * @param f - A function that takes the Playwright `Clock` and returns a `Promise`.
   * @returns An effect that wraps the promise and returns its result.
   * @see {@link Clock}
   * @since 0.1.0
   */
  readonly use: <T>(
    f: (clock: Clock) => Promise<T>,
  ) => Effect.Effect<T, PlaywrightError>;
}

/**
 * A service that provides a `PlaywrightClock` instance.
 *
 * @since 0.1.0
 * @category tag
 */
export class PlaywrightClock extends Context.Tag(
  "effect-playwright/PlaywrightClock",
)<PlaywrightClock, PlaywrightClockService>() {
  /**
   * Creates a `PlaywrightClock` from a Playwright `Clock` instance.
   *
   * @param clock - The Playwright `Clock` instance to wrap.
   * @since 0.1.0
   * @category constructor
   */
  static make(clock: Clock): typeof PlaywrightClock.Service {
    const use = useHelper(clock);

    return PlaywrightClock.of({
      fastForward: (ticks) => use((c) => c.fastForward(ticks)),
      install: (options) => use((c) => c.install(options)),
      pauseAt: (time) => use((c) => c.pauseAt(time)),
      resume: use((c) => c.resume()),
      runFor: (ticks) => use((c) => c.runFor(ticks)),
      setFixedTime: (time) => use((c) => c.setFixedTime(time)),
      setSystemTime: (time) => use((c) => c.setSystemTime(time)),
      use,
    });
  }
}
