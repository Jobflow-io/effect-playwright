import { layer } from "@effect/vitest";
import { Effect, Fiber, Stream } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

layer(PlaywrightEnvironment.layer(chromium))("eventStream", (it) => {
  it.effect("should complete when the page closes", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Subscribe to an event stream
      const stream = page.eventStream("console");

      // Run the stream in the background
      const fiber = yield* Stream.runCollect(stream).pipe(Effect.forkChild());

      // Close the page
      yield* page.close;

      // Wait for the stream to complete
      yield* Fiber.await(fiber);

      // test will timeout if the stream does not complete
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.effect("should complete when the browser closes", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Subscribe to an event stream
      const stream = page.eventStream("console");

      // Run the stream in the background
      const fiber = yield* Stream.runCollect(stream).pipe(Effect.forkChild());

      // Close the browser
      yield* browser.close;

      // Wait for the stream to complete
      yield* Fiber.await(fiber);

      // test will timeout if the stream does not complete
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
