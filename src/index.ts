/**
 * An Effect-based wrapper for Playwright, bringing the power of functional programming
 * and structured concurrency to browser automation.
 *
 * ## Features
 *
 * - **Effect Integration**: Seamlessly integrates Playwright's API with the Effect ecosystem.
 * - **Resource Management**: Automatic cleanup of browsers and contexts using Effect's Scope.
 * - **Type Safety**: Enhanced type safety and functional error handling.
 * - **Event Streams**: Handle Playwright events as typed Effect Streams.
 *
 * **model** is the most important category you probably want to look at.
 *
 * @packageDocumentation
 */

export * from "./browser";
export { PlaywrightBrowserContext } from "./browser-context";
export * from "./common";
export type { PlaywrightErrorReason } from "./errors";
export { PlaywrightError } from "./errors";
export * from "./locator";
export * from "./page";
export * from "./playwright";
