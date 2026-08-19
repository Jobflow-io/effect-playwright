/**
 * An Effect-based wrapper for Playwright.
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

export { chromium, firefox, webkit } from "playwright-core";
export * as Playwright from "./playwright-api";
