import { assert, layer } from "@effect/vitest";
import { Chunk, Effect, Fiber, Option, Stream } from "effect";
import { chromium } from "playwright-core";
import { Browser } from "./browser";
import { Environment } from "./experimental";

layer(Environment.layer(chromium))("PlaywrightCommon", (it) => {
  it.scoped("Request and Response", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const requestFiber = yield* page
        .eventStream("request")
        .pipe(Stream.runHead, Effect.fork);

      const responseFiber = yield* page
        .eventStream("response")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.goto("http://example.com");

      const request = yield* Fiber.join(requestFiber).pipe(Effect.flatten);
      const response = yield* Fiber.join(responseFiber).pipe(Effect.flatten);
      assert.strictEqual(request._tag, "effect-playwright/common/Request");
      assert.strictEqual(response._tag, "effect-playwright/common/Response");

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

      const existingResponse = request.existingResponse();
      assert(Option.isSome(existingResponse));
      assert(existingResponse.value.url() === response.url());

      const httpVersion = yield* response.httpVersion;
      assert(typeof httpVersion === "string");
      assert(httpVersion.length > 0);
    }).pipe(Environment.withBrowser),
  );

  it.scoped("Worker", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const workerFiber = yield* page
        .eventStream("worker")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.evaluate(() => {
        const blob = new Blob(['console.log("worker")'], {
          type: "application/javascript",
        });
        new Worker(URL.createObjectURL(blob));
      });

      const worker = yield* Fiber.join(workerFiber).pipe(Effect.flatten);
      assert.strictEqual(worker._tag, "effect-playwright/common/Worker");

      assert(worker.url().startsWith("blob:"));
      const result = yield* worker.evaluate(() => 1 + 1);
      assert(result === 2);
    }).pipe(Environment.withBrowser),
  );

  it.scoped("Dialog", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const dialogFiber = yield* page
        .eventStream("dialog")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.evaluate(() => {
        setTimeout(() => alert("hello world"), 10);
      });

      const dialog = yield* Fiber.join(dialogFiber).pipe(Effect.flatten);
      assert.strictEqual(dialog._tag, "effect-playwright/common/Dialog");

      assert(dialog.message() === "hello world");
      assert(dialog.type() === "alert");

      yield* dialog.accept();
    }).pipe(Environment.withBrowser),
  );

  it.scoped("FileChooser", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = '<input type="file" id="fileinput" />';
      });

      const fileChooserFiber = yield* page
        .eventStream("filechooser")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.locator("#fileinput").click();

      const fileChooser = yield* Fiber.join(fileChooserFiber).pipe(
        Effect.flatten,
      );
      assert.strictEqual(
        fileChooser._tag,
        "effect-playwright/common/FileChooser",
      );

      assert(fileChooser.isMultiple() === false);
      assert(fileChooser.element() !== null);
    }).pipe(Environment.withBrowser),
  );

  it.scoped("Download", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML =
          '<a text="Download" id="download" href="data:application/octet-stream,hello world" download="test.txt">Download</a>';
      });

      const downloadFiber = yield* page
        .eventStream("download")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.locator("#download").click();

      const download = yield* Fiber.join(downloadFiber).pipe(Effect.flatten);
      assert.strictEqual(download._tag, "effect-playwright/common/Download");

      assert(download.suggestedFilename() === "test.txt");
      const url = download.url();
      assert(url.startsWith("data:"));

      const text = yield* download.stream.pipe(
        Stream.decodeText(),
        Stream.runCollect,
        Effect.map(Chunk.join("")),
      );

      assert.strictEqual(text, "hello world");
    }).pipe(Environment.withBrowser),
  );
});
