/**
 * Effect service wrapper for Playwright mouse input.
 *
 * @since 0.3.0
 */

import { Context, type Effect } from "effect";
import type { Mouse as CoreMouse } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { makeTracedUse } from "./tracer";

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
  const { traced } = makeTracedUse(mouse, "Mouse");

  return Mouse.of({
    click: (x, y, options) =>
      traced("click", (m) => m.click(x, y, options), {
        attributes: () => ({
          "playwright.mouse.x": x,
          "playwright.mouse.y": y,
          "playwright.mouse.button": options?.button,
        }),
      }),
    dblclick: (x, y, options) =>
      traced("dblclick", (m) => m.dblclick(x, y, options), {
        attributes: () => ({
          "playwright.mouse.x": x,
          "playwright.mouse.y": y,
          "playwright.mouse.button": options?.button,
        }),
      }),
    down: (options) =>
      traced("down", (m) => m.down(options), {
        attributes: () => ({ "playwright.mouse.button": options?.button }),
      }),
    move: (x, y, options) =>
      traced("move", (m) => m.move(x, y, options), {
        attributes: () => ({
          "playwright.mouse.x": x,
          "playwright.mouse.y": y,
        }),
      }),
    up: (options) =>
      traced("up", (m) => m.up(options), {
        attributes: () => ({ "playwright.mouse.button": options?.button }),
      }),
    wheel: (deltaX, deltaY) =>
      traced("wheel", (m) => m.wheel(deltaX, deltaY), {
        attributes: () => ({
          "playwright.mouse.delta_x": deltaX,
          "playwright.mouse.delta_y": deltaY,
        }),
      }),
  });
};
