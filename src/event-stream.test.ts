import { layer } from "@effect/vitest";
import { Effect, Stream } from "effect";
import { PlaywrightSpawner } from "effect-playwright";
import { chromium } from "playwright-core";
import { Browser } from "./browser";

layer(PlaywrightSpawner.layer(chromium))("eventStream", (it) => {
  it.scoped("should complete when the page closes", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      // Subscribe to an event stream
      const stream = page.eventStream("console");

      // Run the stream in the background
      const fiber = yield* Stream.runCollect(stream).pipe(Effect.fork);

      // Close the page
      yield* page.close;

      // Wait for the stream to complete
      yield* fiber.await;

      // test will timeout if the stream does not complete
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.scoped("should complete when the browser closes", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      // Subscribe to an event stream
      const stream = page.eventStream("console");

      // Run the stream in the background
      const fiber = yield* Stream.runCollect(stream).pipe(Effect.fork);

      // Close the browser
      yield* browser.close;

      // Wait for the stream to complete
      yield* fiber.await;

      // test will timeout if the stream does not complete
    }).pipe(PlaywrightSpawner.withBrowser),
  );
});
