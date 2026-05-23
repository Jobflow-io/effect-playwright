import { Context, type Effect } from "effect";
import type { Screencast } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.5.0
 */
export interface PlaywrightScreencastService {
  /**
   * Starts recording the screencast.
   *
   * @see {@link Screencast.start}
   * @since 0.5.0
   */
  readonly start: (
    options?: Parameters<Screencast["start"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Stops recording the screencast.
   *
   * @see {@link Screencast.stop}
   * @since 0.5.0
   */
  readonly stop: Effect.Effect<void, PlaywrightError>;

  /**
   * Shows action annotations.
   *
   * @see {@link Screencast.showActions}
   * @since 0.5.0
   */
  readonly showActions: (
    options?: Parameters<Screencast["showActions"]>[0],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Hides action annotations.
   *
   * @see {@link Screencast.hideActions}
   * @since 0.5.0
   */
  readonly hideActions: Effect.Effect<void, PlaywrightError>;

  /**
   * Shows a chapter title.
   *
   * @see {@link Screencast.showChapter}
   * @since 0.5.0
   */
  readonly showChapter: (
    title: string,
    options?: Parameters<Screencast["showChapter"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Shows a custom HTML overlay.
   *
   * @see {@link Screencast.showOverlay}
   * @since 0.5.0
   */
  readonly showOverlay: (
    html: string,
    options?: Parameters<Screencast["showOverlay"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;

  /**
   * Shows all overlays.
   *
   * @see {@link Screencast.showOverlays}
   * @since 0.5.0
   */
  readonly showOverlays: Effect.Effect<void, PlaywrightError>;

  /**
   * Hides all overlays.
   *
   * @see {@link Screencast.hideOverlays}
   * @since 0.5.0
   */
  readonly hideOverlays: Effect.Effect<void, PlaywrightError>;
}

/**
 * @category tag
 */
export class PlaywrightScreencast extends Context.Service<
  PlaywrightScreencast,
  PlaywrightScreencastService
>()("effect-playwright/PlaywrightScreencast") {
  /**
   * @category constructor
   */
  static make(screencast: Screencast): PlaywrightScreencastService {
    const use = useHelper(screencast);
    return PlaywrightScreencast.of({
      start: (options) => use((s) => s.start(options).then(() => {})),
      stop: use((s) => s.stop()),
      showActions: (options) =>
        use((s) => s.showActions(options).then(() => {})),
      hideActions: use((s) => s.hideActions()),
      showChapter: (title, options) =>
        use((s) => s.showChapter(title, options)),
      showOverlay: (html, options) =>
        use((s) => s.showOverlay(html, options).then(() => {})),
      showOverlays: use((s) => s.showOverlays()),
      hideOverlays: use((s) => s.hideOverlays()),
    });
  }
}
