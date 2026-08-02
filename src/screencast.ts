import { Context, type Effect } from "effect";
import type { Screencast as CoreScreencast } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.5.0
 */
export interface ScreencastService {
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
 * @category tag
 */
export class Screencast extends Context.Tag(
  "effect-playwright/screencast/Screencast",
)<Screencast, ScreencastService>() {
  /**
   * @category constructor
   */
  static make(screencast: CoreScreencast): ScreencastService {
    const use = useHelper(screencast);
    return Screencast.of({
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
