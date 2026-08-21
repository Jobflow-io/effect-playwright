/**
 * Effect service wrapper for Playwright touchscreen input.
 *
 * @since 0.3.0
 */

import { Context, type Effect } from "effect";
import type { Touchscreen as CoreTouchscreen } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category models
 * @since 0.3.0
 */
export interface Touchscreen {
  /**
   * Dispatches a `touchstart` and `touchend` event with a single touch at the position
   * ([`x`](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-option-x),[`y`](https://playwright.dev/docs/api/class-touchscreen#touchscreen-tap-option-y)).
   *
   * @see {@link CoreTouchscreen.tap}
   * @since 0.3.0
   */
  readonly tap: (
    x: Parameters<CoreTouchscreen["tap"]>[0],
    y: Parameters<CoreTouchscreen["tap"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category services
 * @since 0.3.0
 */
export const Touchscreen = Context.Service<Touchscreen>(
  "effect-playwright/touchscreen/Touchscreen",
);

/**
 * Creates a `Touchscreen` from a Playwright `Touchscreen` instance.
 *
 * @param touchscreen - The Playwright `Touchscreen` instance to wrap.
 * @since 0.3.0
 * @category constructors
 */
export const makeTouchscreen = (touchscreen: CoreTouchscreen): Touchscreen => {
  const use = useHelper(touchscreen);

  return Touchscreen.of({
    tap: (x, y) => use((t) => t.tap(x, y)),
  });
};
