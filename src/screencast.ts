/**
 * Effect service wrapper for Playwright screencast recording and overlays.
 *
 * @since 0.5.0
 */

import { Context, type Effect } from "effect";
import type { Screencast as CoreScreencast } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { makeTracedUse } from "./tracer";

/**
 * @category models
 * @since 0.5.0
 */
export interface Screencast {
  /**
   * Starts recording the screencast.
   *
   * @see {@link CoreScreencast.start}
   * @since 0.5.0
   */
  readonly start: (
    options?: Parameters<CoreScreencast["start"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops recording the screencast.
   *
   * @see {@link CoreScreencast.stop}
   * @since 0.5.0
   */
  readonly stop: Effect.Effect<void, PlaywrightError>;

  /**
   * Shows action annotations.
   *
   * @see {@link CoreScreencast.showActions}
   * @since 0.5.0
   */
  readonly showActions: (
    options?: Parameters<CoreScreencast["showActions"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Hides action annotations.
   *
   * @see {@link CoreScreencast.hideActions}
   * @since 0.5.0
   */
  readonly hideActions: Effect.Effect<void, PlaywrightError>;

  /**
   * Shows a chapter title.
   *
   * @see {@link CoreScreencast.showChapter}
   * @since 0.5.0
   */
  readonly showChapter: (
    title: string,
    options?: Parameters<CoreScreencast["showChapter"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Shows a custom HTML overlay.
   *
   * @see {@link CoreScreencast.showOverlay}
   * @since 0.5.0
   */
  readonly showOverlay: (
    html: string,
    options?: Parameters<CoreScreencast["showOverlay"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Shows all overlays.
   *
   * @see {@link CoreScreencast.showOverlays}
   * @since 0.5.0
   */
  readonly showOverlays: Effect.Effect<void, PlaywrightError>;

  /**
   * Hides all overlays.
   *
   * @see {@link CoreScreencast.hideOverlays}
   * @since 0.5.0
   */
  readonly hideOverlays: Effect.Effect<void, PlaywrightError>;
}

/**
 * @category services
 */
export const Screencast = Context.Service<Screencast>(
  "effect-playwright/screencast/Screencast",
);

/**
 * Creates a `Screencast` from a Playwright `Screencast` instance.
 *
 * @param screencast - The Playwright `Screencast` instance to wrap.
 * @category constructors
 * @since 0.5.0
 */
export const makeScreencast = (screencast: CoreScreencast): Screencast => {
  const { traced } = makeTracedUse(screencast, "Screencast");
  return Screencast.of({
    start: (options) => traced("start", (s) => s.start(options).then(() => {})),
    stop: traced("stop", (s) => s.stop()),
    showActions: (options) =>
      traced("showActions", (s) => s.showActions(options).then(() => {})),
    hideActions: traced("hideActions", (s) => s.hideActions()),
    showChapter: (title, options) =>
      traced("showChapter", (s) => s.showChapter(title, options)),
    showOverlay: (html, options) =>
      traced("showOverlay", (s) => s.showOverlay(html, options).then(() => {})),
    showOverlays: traced("showOverlays", (s) => s.showOverlays()),
    hideOverlays: traced("hideOverlays", (s) => s.hideOverlays()),
  });
};
