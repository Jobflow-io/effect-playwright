/**
 * Effect services and value wrappers for browser automation with Playwright.
 *
 * The root entrypoint exposes Effect-based services, models, constructors, and
 * errors under the {@link Playwright} namespace. {@link PlaywrightSpawner}
 * provides scoped browser acquisition. Fallible operations report
 * {@link Playwright.PlaywrightError}.
 *
 * @since 0.1.0
 * @packageDocumentation
 */

/**
 * Playwright's Chromium, Firefox, and WebKit browser engines re-exported from `playwright-core`.
 *
 * @since 0.5.0
 */
export { chromium, firefox, webkit } from "playwright-core";
/**
 * Effect services, models, constructors, and errors for Playwright.
 *
 * @since 0.7.0
 */
export * as Playwright from "./playwright-api";
/**
 * Scoped browser provisioning for Effect programs.
 *
 * @since 0.7.0
 */
export * as PlaywrightSpawner from "./playwright-spawner";
