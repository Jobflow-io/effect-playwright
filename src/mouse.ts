import { Context, type Effect } from "effect";
import type { Mouse } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.3.0
 */
export interface PlaywrightMouseService {
  /**
   * Shortcut for mouse.move, mouse.down, mouse.up.
   *
   * @see {@link Mouse.click}
   * @since 0.3.0
   */
  readonly click: (
    x: Parameters<Mouse["click"]>[0],
    y: Parameters<Mouse["click"]>[1],
    options?: Parameters<Mouse["click"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Shortcut for mouse.move, mouse.down, mouse.up, mouse.down and mouse.up.
   *
   * @see {@link Mouse.dblclick}
   * @since 0.3.0
   */
  readonly dblclick: (
    x: Parameters<Mouse["dblclick"]>[0],
    y: Parameters<Mouse["dblclick"]>[1],
    options?: Parameters<Mouse["dblclick"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mousedown` event.
   *
   * @see {@link Mouse.down}
   * @since 0.3.0
   */
  readonly down: (
    options?: Parameters<Mouse["down"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mousemove` event.
   *
   * @see {@link Mouse.move}
   * @since 0.3.0
   */
  readonly move: (
    x: Parameters<Mouse["move"]>[0],
    y: Parameters<Mouse["move"]>[1],
    options?: Parameters<Mouse["move"]>[2],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `mouseup` event.
   *
   * @see {@link Mouse.up}
   * @since 0.3.0
   */
  readonly up: (
    options?: Parameters<Mouse["up"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `wheel` event.
   *
   * @see {@link Mouse.wheel}
   * @since 0.3.0
   */
  readonly wheel: (
    deltaX: Parameters<Mouse["wheel"]>[0],
    deltaY: Parameters<Mouse["wheel"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 */
export class PlaywrightMouse extends Context.Tag(
  "effect-playwright/PlaywrightMouse",
)<PlaywrightMouse, PlaywrightMouseService>() {
  /**
   * Creates a `PlaywrightMouse` from a Playwright `Mouse` instance.
   *
   * @param mouse - The Playwright `Mouse` instance to wrap.
   * @since 0.3.0
   */
  static make(mouse: Mouse): PlaywrightMouseService {
    const use = useHelper(mouse);

    return PlaywrightMouse.of({
      click: (x, y, options) => use((m) => m.click(x, y, options)),
      dblclick: (x, y, options) => use((m) => m.dblclick(x, y, options)),
      down: (options) => use((m) => m.down(options)),
      move: (x, y, options) => use((m) => m.move(x, y, options)),
      up: (options) => use((m) => m.up(options)),
      wheel: (deltaX, deltaY) => use((m) => m.wheel(deltaX, deltaY)),
    });
  }
}
