/**
 * Effect service wrapper for Playwright keyboard input.
 *
 * @since 0.1.0
 */

import { Context, type Effect } from "effect";
import type { Keyboard as CoreKeyboard } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { makeTracedUse } from "./tracer";

/**
 * @category models
 * @since 0.1.0
 */
export interface Keyboard {
  /**
   * Dispatches a `keydown` event.
   *
   * @see {@link CoreKeyboard.down}
   * @since 0.1.0
   */
  readonly down: (
    key: Parameters<CoreKeyboard["down"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches only `input` event, does not emit the `keydown`, `keyup` or `keypress` events.
   *
   * @see {@link CoreKeyboard.insertText}
   * @since 0.1.0
   */
  readonly insertText: (
    text: Parameters<CoreKeyboard["insertText"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `keydown` and `keyup` event.
   *
   * @see {@link CoreKeyboard.press}
   * @since 0.1.0
   */
  readonly press: (
    key: Parameters<CoreKeyboard["press"]>[0],
    options?: Parameters<CoreKeyboard["press"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.
   *
   * @see {@link CoreKeyboard.type}
   * @since 0.1.0
   */
  readonly type: (
    text: Parameters<CoreKeyboard["type"]>[0],
    options?: Parameters<CoreKeyboard["type"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `keyup` event.
   *
   * @see {@link CoreKeyboard.up}
   * @since 0.1.0
   */
  readonly up: (
    key: Parameters<CoreKeyboard["up"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category services
 */
export const Keyboard = Context.Service<Keyboard>(
  "effect-playwright/keyboard/Keyboard",
);

/**
 * Creates a `Keyboard` from a Playwright `Keyboard` instance.
 *
 * @param keyboard - The Playwright `Keyboard` instance to wrap.
 * @category constructors
 * @since 0.1.0
 */
export const makeKeyboard = (keyboard: CoreKeyboard): Keyboard => {
  const { traced } = makeTracedUse(keyboard, "Keyboard");

  return Keyboard.of({
    down: (key) =>
      traced("down", (k) => k.down(key), {
        target: key,
        attributes: () => ({ "playwright.key": key }),
      }),
    insertText: (text) => traced("insertText", (k) => k.insertText(text)),
    press: (key, options) =>
      traced("press", (k) => k.press(key, options), {
        target: key,
        attributes: () => ({ "playwright.key": key }),
      }),
    type: (text, options) => traced("type", (k) => k.type(text, options)),
    up: (key) =>
      traced("up", (k) => k.up(key), {
        target: key,
        attributes: () => ({ "playwright.key": key }),
      }),
  });
};
