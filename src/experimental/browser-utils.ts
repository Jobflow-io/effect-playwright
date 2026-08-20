/**
 * Experimental utilities for traversing browser pages and frames and merging
 * frame-navigation event streams.
 *
 * @since 0.2.0
 */

import { Array, Effect, pipe, Stream } from "effect";
import type { Browser } from "../browser";

/**
 * Returns all pages in the browser from all contexts.
 * @category utilities
 * @since 0.2.0
 */
export const allPages = (browser: Browser) =>
  Array.flatten(browser.contexts().map((context) => context.pages()));

/**
 * Returns all frames in the browser from all pages in all contexts.
 * @category utilities
 * @since 0.2.0
 */
export const allFrames = (browser: Browser) =>
  Effect.all(allPages(browser).map((page) => page.frames)).pipe(
    Effect.map(Array.flatten),
  );

/**
 * Returns a stream of all framenavigated events for all current and future pages in the browser.
 * In all current contexts (but not future contexts).
 * @category event streams
 * @since 0.2.0
 */
export const allFrameNavigatedEventStream = (browser: Browser) =>
  Effect.gen(function* () {
    const contexts = browser.contexts();
    const pages = Array.flatten(contexts.map((c) => c.pages()));

    // listen for framenavigated for all current pages
    const currentPages = pages.map((page) =>
      page.eventStream("framenavigated"),
    );

    // and all future pages
    const newPages = pipe(
      contexts.map((c) => c.eventStream("page")),
      Stream.mergeAll({ concurrency: "unbounded" }),
      Stream.flatMap((page) => page.eventStream("framenavigated"), {
        concurrency: "unbounded",
      }),
    );

    return Stream.mergeAll([newPages, ...currentPages], {
      concurrency: "unbounded",
    });
  }).pipe(Stream.unwrap);
