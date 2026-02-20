import { Context, type Effect } from "effect";
import type { Keyboard } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.1.0
 */
export interface PlaywrightKeyboardService {
  /**
   * Dispatches a `keydown` event.
   *
   * @see {@link Keyboard.down}
   * @since 0.1.0
   */
  readonly down: (
    key: Parameters<Keyboard["down"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches only `input` event, does not emit the `keydown`, `keyup` or `keypress` events.
   *
   * @see {@link Keyboard.insertText}
   * @since 0.1.0
   */
  readonly insertText: (
    text: Parameters<Keyboard["insertText"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `keydown` and `keyup` event.
   *
   * @see {@link Keyboard.press}
   * @since 0.1.0
   */
  readonly press: (
    key: Parameters<Keyboard["press"]>[0],
    options?: Parameters<Keyboard["press"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Sends a `keydown`, `keypress`/`input`, and `keyup` event for each character in the text.
   *
   * @see {@link Keyboard.type}
   * @since 0.1.0
   */
  readonly type: (
    text: Parameters<Keyboard["type"]>[0],
    options?: Parameters<Keyboard["type"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
  /**
   * Dispatches a `keyup` event.
   *
   * @see {@link Keyboard.up}
   * @since 0.1.0
   */
  readonly up: (
    key: Parameters<Keyboard["up"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 */
export class PlaywrightKeyboard extends Context.Tag(
  "effect-playwright/PlaywrightKeyboard",
)<PlaywrightKeyboard, PlaywrightKeyboardService>() {
  /**
   * Creates a `PlaywrightKeyboard` from a Playwright `Keyboard` instance.
   *
   * @param keyboard - The Playwright `Keyboard` instance to wrap.
   * @since 0.1.0
   */
  static make(keyboard: Keyboard): PlaywrightKeyboardService {
    const use = useHelper(keyboard);

    return PlaywrightKeyboard.of({
      down: (key) => use((k) => k.down(key)),
      insertText: (text) => use((k) => k.insertText(text)),
      press: (key, options) => use((k) => k.press(key, options)),
      type: (text, options) => use((k) => k.type(text, options)),
      up: (key) => use((k) => k.up(key)),
    });
  }
}
