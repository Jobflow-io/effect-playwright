import { Context, type Effect } from "effect";
import type { Touchscreen } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.3.0
 */
export interface PlaywrightTouchscreenService {
  /**
   * Dispatches a `touchstart` and `touchend` event with a single touch at the position
   * ([`x`](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-option-x),[`y`](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-option-y)).
   *
   * @see {@link Touchscreen.tap}
   * @since 0.3.0
   */
  readonly tap: (
    x: Parameters<Touchscreen["tap"]>[0],
    y: Parameters<Touchscreen["tap"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 * @since 0.3.0
 */
export class PlaywrightTouchscreen extends Context.Tag(
  "effect-playwright/PlaywrightTouchscreen",
)<PlaywrightTouchscreen, PlaywrightTouchscreenService>() {
  /**
   * Creates a `PlaywrightTouchscreen` from a Playwright `Touchscreen` instance.
   *
   * @param touchscreen - The Playwright `Touchscreen` instance to wrap.
   * @since 0.3.0
   */
  static make(touchscreen: Touchscreen): PlaywrightTouchscreenService {
    const use = useHelper(touchscreen);

    return PlaywrightTouchscreen.of({
      tap: (x, y) => use((t) => t.tap(x, y)),
    });
  }
}
