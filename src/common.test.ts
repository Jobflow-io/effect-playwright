import { assert, layer } from "@effect/vitest";
import { Effect, Fiber, Option, Stream } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

layer(PlaywrightEnvironment.layer(chromium))("PlaywrightCommon", (it) => {
  it.effect("PlaywrightRequest and PlaywrightResponse", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const requestFiber = yield* page
        .eventStream("request")
        .pipe(Stream.runHead, Effect.forkChild());

      const responseFiber = yield* page
        .eventStream("response")
        .pipe(Stream.runHead, Effect.forkChild());

      yield* page.goto("http://example.com");

      const request = yield* Fiber.join(requestFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      const response = yield* Fiber.join(responseFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );

      assert(request.url().includes("example.com"));
      assert(request.method() === "GET");
      assert(request.isNavigationRequest() === true);

      assert(response.url().includes("example.com"));
      assert(response.ok() === true);
      assert(response.status() === 200);

      const headers = response.headers();
      assert(headers["content-type"] !== undefined);

      const respRequest = response.request();
      assert(respRequest.url().includes("example.com"));

      const requestResponse = yield* request.response;
      assert(Option.isSome(requestResponse));
      assert(requestResponse.value.url() === response.url());
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.effect("PlaywrightWorker", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const workerFiber = yield* page
        .eventStream("worker")
        .pipe(Stream.runHead, Effect.forkChild());

      yield* page.evaluate(() => {
        const blob = new Blob(['console.log("worker")'], {
          type: "application/javascript",
        });
        new Worker(URL.createObjectURL(blob));
      });

      const worker = yield* Fiber.join(workerFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );

      assert(worker.url().startsWith("blob:"));
      const result = yield* worker.evaluate(() => 1 + 1);
      assert(result === 2);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.effect("PlaywrightDialog", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const dialogFiber = yield* page
        .eventStream("dialog")
        .pipe(Stream.runHead, Effect.forkChild());

      yield* page.evaluate(() => {
        setTimeout(() => alert("hello world"), 10);
      });

      const dialog = yield* Fiber.join(dialogFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );

      assert(dialog.message() === "hello world");
      assert(dialog.type() === "alert");

      yield* dialog.accept();
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.effect("PlaywrightFileChooser", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = '<input type="file" id="fileinput" />';
      });

      const fileChooserFiber = yield* page
        .eventStream("filechooser")
        .pipe(Stream.runHead, Effect.forkChild());

      yield* page.locator("#fileinput").click();

      const fileChooser = yield* Fiber.join(fileChooserFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );

      assert(fileChooser.isMultiple() === false);
      assert(fileChooser.element() !== null);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.effect("PlaywrightDownload", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML =
          '<a text="Download" id="download" href="data:application/octet-stream,hello world" download="test.txt">Download</a>';
      });

      const downloadFiber = yield* page
        .eventStream("download")
        .pipe(Stream.runHead, Effect.forkChild());

      yield* page.locator("#download").click();

      const download = yield* Fiber.join(downloadFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );

      assert(download.suggestedFilename() === "test.txt");
      const url = download.url();
      assert(url.startsWith("data:"));

      const text = yield* download.stream.pipe(
        Stream.decodeText(),
        Stream.runCollect,
        Effect.map((arr) => arr.join("")),
      );

      assert.strictEqual(text, "hello world");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
