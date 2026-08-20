/**
 * Effect services and value wrappers for Playwright browser automation.
 *
 * Service names such as {@link Browser}, {@link BrowserContext}, and
 * {@link Page} work in both value and type positions. Constructors adapt
 * native Playwright values, and {@link Playwright} provides browser launch and
 * connection operations.
 *
 * @since 0.7.0
 * @packageDocumentation
 */

export {
  Browser,
  type LaunchOptions,
  makeBrowser,
  type NewContextOptions,
  type NewPageOptions,
} from "./browser";
export { BrowserContext, makeBrowserContext } from "./browser-context";
export { Clock, makeClock } from "./clock";
export {
  Dialog,
  Download,
  FileChooser,
  Request,
  Response,
  Worker,
} from "./common";
export { Credentials, makeCredentials } from "./credentials";
export { PlaywrightError, type PlaywrightErrorReason } from "./errors";
export { Frame, makeFrame } from "./frame";
export { FrameLocator, makeFrameLocator } from "./frame-locator";
export { Keyboard, makeKeyboard } from "./keyboard";
export { Locator, makeLocator } from "./locator";
export { Mouse, makeMouse } from "./mouse";
export { makePage, Page, type PageEventMap } from "./page";
export { layer, Playwright } from "./playwright";
export type { NoHandles, PageFunction, Unboxed } from "./playwright-types";
export { makeScreencast, Screencast } from "./screencast";
export { makeTouchscreen, Touchscreen } from "./touchscreen";
export { makeTracing, Tracing } from "./tracing";
export { makeWebStorage, WebStorage } from "./web-storage";
