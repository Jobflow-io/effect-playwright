import { assert, layer } from "@effect/vitest";
import { Effect, Fiber, Option, Stream } from "effect";
import { PlaywrightSpawner } from "effect-playwright";
import { type Request as CoreRequest, chromium } from "playwright-core";
import { Browser } from "./browser";
import {
  Dialog,
  Download,
  FileChooser,
  makeRequest,
  Request,
  Response,
  Worker as WorkerService,
} from "./common";

layer(PlaywrightSpawner.layer(chromium))("PlaywrightCommon", (it) => {
  it.effect("Request.postDataJSON handles synchronous results", () =>
    Effect.gen(function* () {
      const make = (postDataJSON: CoreRequest["postDataJSON"]) =>
        makeRequest({ postDataJSON } as unknown as CoreRequest);

      const parsed = yield* make(() => ({ hello: "world" })).postDataJSON;
      assert.deepStrictEqual(parsed, Option.some({ hello: "world" }));

      const empty = yield* make(() => null).postDataJSON;
      assert(Option.isNone(empty));

      const cause = new Error("invalid post data");
      const failure = yield* make(() => {
        throw cause;
      }).postDataJSON.pipe(Effect.flip);
      assert.strictEqual(failure._tag, "PlaywrightError");
      assert.strictEqual(failure.cause, cause);
    }),
  );
  it.effect("Request nullable methods preserve the receiver", () =>
    Effect.sync(() => {
      const body = Buffer.from("hello");
      const coreRequest = {
        body: body as Buffer | null,
        failureText: "failed" as string | null,
        postData() {
          return this.body?.toString("utf8") ?? null;
        },
        postDataBuffer() {
          return this.body;
        },
        failure() {
          return this.failureText === null
            ? null
            : { errorText: this.failureText };
        },
      };
      const request = makeRequest(coreRequest as unknown as CoreRequest);

      assert.deepStrictEqual(request.postData(), Option.some("hello"));
      assert.deepStrictEqual(request.postDataBuffer(), Option.some(body));
      assert.deepStrictEqual(
        request.failure(),
        Option.some({ errorText: "failed" }),
      );

      coreRequest.body = null;
      coreRequest.failureText = null;
      assert(Option.isNone(request.postData()));
      assert(Option.isNone(request.postDataBuffer()));
      assert(Option.isNone(request.failure()));
    }),
  );

  it.effect("Request and Response", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const requestFiber = yield* page
        .eventStream("request")
        .pipe(Stream.runHead, Effect.forkChild);

      const responseFiber = yield* page
        .eventStream("response")
        .pipe(Stream.runHead, Effect.forkChild);

      yield* page.goto("http://example.com");

      const request = yield* Fiber.join(requestFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      const response = yield* Fiber.join(responseFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      assert.strictEqual(
        yield* Request.pipe(Effect.provideService(Request, request)),
        request,
      );
      assert.strictEqual(
        yield* Response.pipe(Effect.provideService(Response, response)),
        response,
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

      const existingResponse = request.existingResponse();
      assert(Option.isSome(existingResponse));
      assert(existingResponse.value.url() === response.url());

      const httpVersion = yield* response.httpVersion;
      assert(typeof httpVersion === "string");
      assert(httpVersion.length > 0);
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("Worker", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const workerFiber = yield* page
        .eventStream("worker")
        .pipe(Stream.runHead, Effect.forkChild);

      yield* page.evaluate(() => {
        const blob = new Blob(['console.log("worker")'], {
          type: "application/javascript",
        });
        new Worker(URL.createObjectURL(blob));
      });

      const worker = yield* Fiber.join(workerFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      assert.strictEqual(
        yield* WorkerService.pipe(Effect.provideService(WorkerService, worker)),
        worker,
      );

      assert(worker.url().startsWith("blob:"));
      const result = yield* worker.evaluate(() => 1 + 1);
      assert(result === 2);
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("Dialog", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      const dialogFiber = yield* page
        .eventStream("dialog")
        .pipe(Stream.runHead, Effect.forkChild);

      yield* page.evaluate(() => {
        setTimeout(() => alert("hello world"), 10);
      });

      const dialog = yield* Fiber.join(dialogFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      assert.strictEqual(
        yield* Dialog.pipe(Effect.provideService(Dialog, dialog)),
        dialog,
      );

      assert(dialog.message() === "hello world");
      assert(dialog.type() === "alert");

      yield* dialog.accept();
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("FileChooser", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = '<input type="file" id="fileinput" />';
      });

      const fileChooserFiber = yield* page
        .eventStream("filechooser")
        .pipe(Stream.runHead, Effect.forkChild);

      yield* page.locator("#fileinput").click();

      const fileChooser = yield* Fiber.join(fileChooserFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      assert.strictEqual(
        yield* FileChooser.pipe(
          Effect.provideService(FileChooser, fileChooser),
        ),
        fileChooser,
      );

      assert(fileChooser.isMultiple() === false);
      assert(fileChooser.element() !== null);
    }).pipe(PlaywrightSpawner.withBrowser),
  );

  it.effect("Download", () =>
    Effect.gen(function* () {
      const browser = yield* Browser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML =
          '<a text="Download" id="download" href="data:application/octet-stream,hello world" download="test.txt">Download</a>';
      });

      const downloadFiber = yield* page
        .eventStream("download")
        .pipe(Stream.runHead, Effect.forkChild);

      yield* page.locator("#download").click();

      const download = yield* Fiber.join(downloadFiber).pipe(
        Effect.flatMap(Effect.fromOption),
      );
      assert.strictEqual(
        yield* Download.pipe(Effect.provideService(Download, download)),
        download,
      );

      assert(download.suggestedFilename() === "test.txt");
      const url = download.url();
      assert(url.startsWith("data:"));

      const text = yield* download.stream.pipe(
        Stream.decodeText(),
        Stream.runCollect,
        Effect.map((chunks) => chunks.join("")),
      );

      assert.strictEqual(text, "hello world");
    }).pipe(PlaywrightSpawner.withBrowser),
  );
});
