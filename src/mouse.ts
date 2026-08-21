/**
 * Effect service wrapper for Playwright mouse input.
 *
 * @since 0.3.0
 */

import { Context, type Effect } from "effect";
import type { Mouse as CoreMouse } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category models
 * @since 0.3.0
 */
export interface Mouse {
  /**
   * Shortcut for mouse.move, mouse.down, mouse.up.
   *
   * @see {@link CoreMouse.click}
   * @since 0.3.0
   */
  readonly click: (
    x: Parameters<CoreMouse["click"]>[0],
    y: Parameters<CoreMouse["click"]>[1],
    options?: Parameters<CoreMouse["click"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Shortcut for mouse.move, mouse.down, mouse.up, mouse.down and mouse.up.
   *
   * @see {@link CoreMouse.dblclick}
   * @since 0.3.0
   */
  readonly dblclick: (
    x: Parameters<CoreMouse["dblclick"]>[0],
    y: Parameters<CoreMouse["dblclick"]>[1],
    options?: Parameters<CoreMouse["dblclick"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mousedown` event.
   *
   * @see {@link CoreMouse.down}
   * @since 0.3.0
   */
  readonly down: (
    options?: Parameters<CoreMouse["down"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mousemove` event.
   *
   * @see {@link CoreMouse.move}
   * @since 0.3.0
   */
  readonly move: (
    x: Parameters<CoreMouse["move"]>[0],
    y: Parameters<CoreMouse["move"]>[1],
    options?: Parameters<CoreMouse["move"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mouseup` event.
   *
   * @see {@link CoreMouse.up}
   * @since 0.3.0
   */
  readonly up: (
    options?: Parameters<CoreMouse["up"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `wheel` event.
   *
   * @see {@link CoreMouse.wheel}
   * @since 0.3.0
   */
  readonly wheel: (
    deltaX: Parameters<CoreMouse["wheel"]>[0],
    deltaY: Parameters<CoreMouse["wheel"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category services
 */
export const Mouse = Context.Service<Mouse>("effect-playwright/mouse/Mouse");

/**
 * Creates a `Mouse` from a Playwright `Mouse` instance.
 *
 * @param mouse - The Playwright `Mouse` instance to wrap.
 * @since 0.3.0
 * @category constructors
 */
export const makeMouse = (mouse: CoreMouse): Mouse => {
  const use = useHelper(mouse);

  return Mouse.of({
    click: (x, y, options) => use((m) => m.click(x, y, options)),
    dblclick: (x, y, options) => use((m) => m.dblclick(x, y, options)),
    down: (options) => use((m) => m.down(options)),
    move: (x, y, options) => use((m) => m.move(x, y, options)),
    up: (options) => use((m) => m.up(options)),
    wheel: (deltaX, deltaY) => use((m) => m.wheel(deltaX, deltaY)),
  });
};
