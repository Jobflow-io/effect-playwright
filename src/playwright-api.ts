import {
  type BrowserService,
  Browser as BrowserTag,
  type LaunchOptions,
  type NewContextOptions,
  type NewPageOptions,
} from "./browser";
import {
  type BrowserContextService,
  BrowserContext as BrowserContextTag,
} from "./browser-context";
import { type ClockService, Clock as ClockTag } from "./clock";
import {
  type CredentialsService,
  Credentials as CredentialsTag,
} from "./credentials";
import { type FrameService, Frame as FrameTag } from "./frame";
import {
  type FrameLocatorService,
  FrameLocator as FrameLocatorTag,
} from "./frame-locator";
import { type KeyboardService, Keyboard as KeyboardTag } from "./keyboard";
import { type LocatorService, Locator as LocatorTag } from "./locator";
import { type MouseService, Mouse as MouseTag } from "./mouse";
import { type PageService, Page as PageTag } from "./page";
import { Playwright as PlaywrightTag, type Service } from "./playwright";
import {
  type ScreencastService,
  Screencast as ScreencastTag,
} from "./screencast";
import {
  type TouchscreenService,
  Touchscreen as TouchscreenTag,
} from "./touchscreen";
import { type TracingService, Tracing as TracingTag } from "./tracing";
import {
  type WebStorageService,
  WebStorage as WebStorageTag,
} from "./web-storage";

export {
  Dialog,
  Download,
  FileChooser,
  Request,
  Response,
  Worker,
} from "./common";
export { PlaywrightError, type PlaywrightErrorReason } from "./errors";
export type { NoHandles, PageFunction, Unboxed } from "./playwright-types";
export type {
  BrowserContextService,
  BrowserService,
  ClockService,
  CredentialsService,
  FrameLocatorService,
  FrameService,
  KeyboardService,
  LaunchOptions,
  LocatorService,
  MouseService,
  NewContextOptions,
  NewPageOptions,
  PageService,
  ScreencastService,
  Service,
  TouchscreenService,
  TracingService,
  WebStorageService,
};

/**
 * The Playwright service tag.
 *
 * @example
 * ```ts
 * const playwright = yield* Playwright.Playwright;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Playwright = PlaywrightTag;

/**
 * The Playwright service.
 *
 * @example
 * ```ts
 * declare const playwright: Playwright.Playwright;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Playwright = Service;

/**
 * The layer that provides the {@link Playwright} service.
 *
 * @example
 * ```ts
 * const program = Effect.provide(effect, Playwright.layer);
 * ```
 *
 * @category layer
 * @since 0.7.0
 */
export const layer = PlaywrightTag.layer;

/**
 * The Browser service tag.
 *
 * @example
 * ```ts
 * const browser = yield* Playwright.Browser;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Browser = BrowserTag;

/**
 * A browser service.
 *
 * @example
 * ```ts
 * declare const browser: Playwright.Browser;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Browser = BrowserService;

/**
 * The BrowserContext service tag.
 *
 * @example
 * ```ts
 * const context = yield* Playwright.BrowserContext;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const BrowserContext = BrowserContextTag;

/**
 * A browser context service.
 *
 * @example
 * ```ts
 * declare const context: Playwright.BrowserContext;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type BrowserContext = BrowserContextService;

/**
 * The Clock service tag.
 *
 * @example
 * ```ts
 * const clock = yield* Playwright.Clock;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Clock = ClockTag;

/**
 * A clock service.
 *
 * @example
 * ```ts
 * declare const clock: Playwright.Clock;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Clock = ClockService;

/**
 * The Credentials service tag.
 *
 * @example
 * ```ts
 * const credentials = yield* Playwright.Credentials;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Credentials = CredentialsTag;

/**
 * A credentials service.
 *
 * @example
 * ```ts
 * declare const credentials: Playwright.Credentials;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Credentials = CredentialsService;

/**
 * The Frame service tag.
 *
 * @example
 * ```ts
 * const frame = yield* Playwright.Frame;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Frame = FrameTag;

/**
 * A frame service.
 *
 * @example
 * ```ts
 * declare const frame: Playwright.Frame;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Frame = FrameService;

/**
 * The FrameLocator service tag.
 *
 * @example
 * ```ts
 * const frameLocator = yield* Playwright.FrameLocator;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const FrameLocator = FrameLocatorTag;

/**
 * A frame locator service.
 *
 * @example
 * ```ts
 * declare const frameLocator: Playwright.FrameLocator;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type FrameLocator = FrameLocatorService;

/**
 * The Keyboard service tag.
 *
 * @example
 * ```ts
 * const keyboard = yield* Playwright.Keyboard;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Keyboard = KeyboardTag;

/**
 * A keyboard service.
 *
 * @example
 * ```ts
 * declare const keyboard: Playwright.Keyboard;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Keyboard = KeyboardService;

/**
 * The Locator service tag.
 *
 * @example
 * ```ts
 * const locator = yield* Playwright.Locator;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Locator = LocatorTag;

/**
 * A locator service.
 *
 * @example
 * ```ts
 * declare const locator: Playwright.Locator;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Locator = LocatorService;

/**
 * The Mouse service tag.
 *
 * @example
 * ```ts
 * const mouse = yield* Playwright.Mouse;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Mouse = MouseTag;

/**
 * A mouse service.
 *
 * @example
 * ```ts
 * declare const mouse: Playwright.Mouse;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Mouse = MouseService;

/**
 * The Page service tag.
 *
 * @example
 * ```ts
 * const page = yield* Playwright.Page;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Page = PageTag;

/**
 * A page service.
 *
 * @example
 * ```ts
 * declare const page: Playwright.Page;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Page = PageService;

/**
 * The Screencast service tag.
 *
 * @example
 * ```ts
 * const screencast = yield* Playwright.Screencast;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Screencast = ScreencastTag;

/**
 * A screencast service.
 *
 * @example
 * ```ts
 * declare const screencast: Playwright.Screencast;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Screencast = ScreencastService;

/**
 * The Touchscreen service tag.
 *
 * @example
 * ```ts
 * const touchscreen = yield* Playwright.Touchscreen;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Touchscreen = TouchscreenTag;

/**
 * A touchscreen service.
 *
 * @example
 * ```ts
 * declare const touchscreen: Playwright.Touchscreen;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Touchscreen = TouchscreenService;

/**
 * The Tracing service tag.
 *
 * @example
 * ```ts
 * const tracing = yield* Playwright.Tracing;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const Tracing = TracingTag;

/**
 * A tracing service.
 *
 * @example
 * ```ts
 * declare const tracing: Playwright.Tracing;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type Tracing = TracingService;

/**
 * The WebStorage service tag.
 *
 * @example
 * ```ts
 * const storage = yield* Playwright.WebStorage;
 * ```
 *
 * @category tag
 * @since 0.7.0
 */
export const WebStorage = WebStorageTag;

/**
 * A web storage service.
 *
 * @example
 * ```ts
 * declare const storage: Playwright.WebStorage;
 * ```
 *
 * @category model
 * @since 0.7.0
 */
export type WebStorage = WebStorageService;
