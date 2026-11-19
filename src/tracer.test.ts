import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Exit, Layer, Option, Tracer } from "effect";
import { chromium, Playwright, PlaywrightSpawner } from "effect-playwright";
import { sanitizeUrl, urlAttributes } from "./tracer";

const makeRecordingTracer = () => {
  const spans: Array<Tracer.NativeSpan> = [];
  const tracer = Tracer.make({
    span(options) {
      const span = new Tracer.NativeSpan(options);
      spans.push(span);
      return span;
    },
  });
  return { spans, tracer } as const;
};

const withLocalHttpServer = Effect.acquireRelease(
  Effect.promise(
    () =>
      new Promise<{
        readonly url: string;
        readonly port: number;
        readonly close: () => Promise<void>;
      }>((resolve) => {
        const server = createServer((_req, res) => {
          res.writeHead(200, { "content-type": "text/html" });
          res.end(
            "<title>Traced Page</title><input id='pw' type='password' /><button id='go'>Go</button>",
          );
        });
        server.listen(0, "127.0.0.1", () => {
          const { port } = server.address() as AddressInfo;
          resolve({
            url: `http://127.0.0.1:${port}`,
            port,
            close: () =>
              new Promise<void>((done) => {
                server.close(() => done());
              }),
          });
        });
      }),
  ),
  (server) => Effect.promise(() => server.close()),
);

describe("Tracer helpers", () => {
  it("redacts URL credentials and suppresses data URL payloads", () => {
    assert.strictEqual(
      sanitizeUrl("https://alice:s3cr3t@example.com:8443/login?next=/app"),
      "https://REDACTED:REDACTED@example.com:8443/login?next=/app",
    );
    assert.strictEqual(
      sanitizeUrl("data:text/html,<h1>very secret payload</h1>"),
      "data:",
    );
    assert.strictEqual(sanitizeUrl(""), undefined);

    const credAttrs = urlAttributes(
      "https://alice:s3cr3t@example.com:8443/login?next=/app",
    );
    assert.strictEqual(
      credAttrs["url.full"],
      "https://REDACTED:REDACTED@example.com:8443/login?next=/app",
    );
    assert.strictEqual(credAttrs["url.scheme"], "https");
    assert.strictEqual(credAttrs["server.address"], "https://example.com:8443");
    assert.strictEqual(credAttrs["server.port"], 8443);
    assert.strictEqual(credAttrs["url.path"], "/login");
    assert.strictEqual(credAttrs["url.query"], "next=/app");

    const dataAttrs = urlAttributes("data:text/html,<h1>secret</h1>");
    assert.deepStrictEqual(dataAttrs, { "url.scheme": "data" });

    const relativeAttrs = urlAttributes("/dashboard?tab=1#top");
    assert.deepStrictEqual(relativeAttrs, {
      "url.full": "/dashboard?tab=1#top",
      "url.path": "/dashboard",
      "url.query": "tab=1",
    });
  });
});

layer(PlaywrightSpawner.layer(chromium))("Effect Tracer integration", (it) => {
  it.effect(
    "emits client spans with parent linkage, attributes, and privacy defaults",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();
        const server = yield* withLocalHttpServer;

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          const targetUrl = `${server.url}/login?token=sensitive-query`;
          yield* page.goto(targetUrl);
          const passwordInput = page
            .locator("#pw")
            .describe("Password input field");
          yield* passwordInput.fill("super-secret-password");
          yield* page.locator("#go").click();
          yield* page.localStorage.setItem("auth_token", "secret-storage-val");
          yield* page.setContent("<h1>top-secret-html</h1>");
          yield* page.goto("data:text/html,<h1>secret-data-url</h1>");
        }).pipe(
          Effect.withSpan("checkout-flow"),
          PlaywrightSpawner.withBrowser,
          Effect.withTracer(tracer),
        );

        const parentSpan = spans.find((s) => s.name === "checkout-flow");
        assert.isDefined(parentSpan);

        const launchSpan = spans.find((s) => s.name === "Playwright.launch");
        assert.isDefined(launchSpan);
        assert.strictEqual(launchSpan.kind, "client");
        assert.strictEqual(
          launchSpan.attributes.get("playwright.browser.name"),
          "chromium",
        );
        assert.isString(
          launchSpan.attributes.get("playwright.browser.version"),
        );

        const newPageSpan = spans.find(
          (s) => s.name === "Playwright.Browser.newPage",
        );
        assert.isDefined(newPageSpan);
        assert.strictEqual(
          Option.getOrUndefined(newPageSpan.parent)?.spanId,
          parentSpan.spanId,
        );

        const gotoSpans = spans.filter(
          (s) => s.name === "Playwright.Page.goto",
        );
        assert.strictEqual(gotoSpans.length, 2);

        const httpGoto = gotoSpans[0];
        assert.strictEqual(httpGoto.kind, "client");
        assert.strictEqual(httpGoto.attributes.get("url.path"), "/login");
        assert.strictEqual(
          httpGoto.attributes.get("url.query"),
          "token=sensitive-query",
        );
        assert.strictEqual(
          httpGoto.attributes.get("server.address"),
          server.url,
        );
        assert.strictEqual(httpGoto.attributes.get("server.port"), server.port);
        assert.strictEqual(
          httpGoto.attributes.get("http.response.status_code"),
          200,
        );

        const dataGoto = gotoSpans[1];
        assert.strictEqual(dataGoto.attributes.get("url.scheme"), "data");
        assert.isUndefined(dataGoto.attributes.get("url.full"));

        const fillSpan = spans.find(
          (s) => s.name === "Playwright.Locator.fill",
        );
        assert.isDefined(fillSpan);
        assert.strictEqual(
          fillSpan.attributes.get("playwright.locator.description"),
          "Password input field",
        );
        assert.isString(fillSpan.attributes.get("playwright.selector"));

        const storageSpan = spans.find(
          (s) => s.name === "Playwright.WebStorage.setItem",
        );
        assert.isDefined(storageSpan);
        assert.strictEqual(
          storageSpan.attributes.get("playwright.storage.key"),
          "auth_token",
        );

        // Verify sensitive payloads never appear in any span name or attribute
        for (const span of spans) {
          assert.isFalse(span.name.includes("super-secret-password"));
          assert.isFalse(span.name.includes("secret-storage-val"));
          assert.isFalse(span.name.includes("top-secret-html"));
          assert.isFalse(span.name.includes("secret-data-url"));
          for (const value of span.attributes.values()) {
            const text = String(value);
            assert.isFalse(text.includes("super-secret-password"));
            assert.isFalse(text.includes("secret-storage-val"));
            assert.isFalse(text.includes("top-secret-html"));
            assert.isFalse(text.includes("secret-data-url"));
          }
        }
      }).pipe(Effect.scoped),
  );

  it.effect(
    "records playwright.error.reason on Timeout and Unknown failures",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();
          yield* page.setContent("<div>hello</div>");

          const timeoutExit = yield* Effect.exit(
            page.locator("#does-not-exist").click({ timeout: 50 }),
          );
          assert.isTrue(Exit.isFailure(timeoutExit));

          const evalExit = yield* Effect.exit(
            page.evaluate(() => {
              throw new Error("boom");
            }),
          );
          assert.isTrue(Exit.isFailure(evalExit));
        }).pipe(PlaywrightSpawner.withBrowser, Effect.withTracer(tracer));

        const clickSpan = spans.find(
          (s) => s.name === "Playwright.Locator.click",
        );
        assert.isDefined(clickSpan);
        assert.strictEqual(clickSpan.status._tag, "Ended");
        if (clickSpan.status._tag === "Ended") {
          assert.isTrue(Exit.isFailure(clickSpan.status.exit));
        }
        assert.strictEqual(
          clickSpan.attributes.get("playwright.error.reason"),
          "Timeout",
        );

        const evalSpan = spans.find(
          (s) => s.name === "Playwright.Page.evaluate",
        );
        assert.isDefined(evalSpan);
        assert.strictEqual(evalSpan.status._tag, "Ended");
        if (evalSpan.status._tag === "Ended") {
          assert.isTrue(Exit.isFailure(evalSpan.status.exit));
        }
        assert.strictEqual(
          evalSpan.attributes.get("playwright.error.reason"),
          "Unknown",
        );
      }),
  );

  it.effect(
    "respects Effect.withTracerEnabled, Tracer.DisablePropagation, Tracer.MinimumTraceLevel, and Effect.annotateSpans",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          // Disabled via Effect.withTracerEnabled(false)
          yield* page
            .setContent("<title>One</title>")
            .pipe(Effect.withTracerEnabled(false));

          // Disabled via Tracer.DisablePropagation
          yield* page.title.pipe(
            Effect.provideService(Tracer.DisablePropagation, true),
          );

          // Unsampled via Tracer.MinimumTraceLevel = "None"
          yield* page
            .content()
            .pipe(Effect.provideService(Tracer.MinimumTraceLevel, "None"));

          // Annotated via Effect.annotateSpans
          yield* page.title.pipe(Effect.annotateSpans({ "tenant.id": "acme" }));
        }).pipe(PlaywrightSpawner.withBrowser, Effect.withTracer(tracer));

        assert.isUndefined(
          spans.find((s) => s.name === "Playwright.Page.setContent"),
        );

        // Only the second page.title call should have produced a span
        const titleSpans = spans.filter(
          (s) => s.name === "Playwright.Page.title",
        );
        assert.strictEqual(titleSpans.length, 1);
        assert.strictEqual(titleSpans[0].attributes.get("tenant.id"), "acme");

        // page.content ran with MinimumTraceLevel = "None" => unsampled, no attributes populated
        const contentSpan = spans.find(
          (s) => s.name === "Playwright.Page.content",
        );
        assert.isDefined(contentSpan);
        assert.strictEqual(contentSpan.sampled, false);
        assert.strictEqual(contentSpan.attributes.size, 0);
      }),
  );

  it.effect(
    "supports TracerDisabledWhen, TracerAttributeFilter, and SpanNameGenerator",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();
        const server = yield* withLocalHttpServer;

        const tracingConfigLayer = Layer.mergeAll(
          Layer.succeed(
            Playwright.TracerDisabledWhen,
            (op) => op.service === "Mouse" || op.method === "title",
          ),
          Layer.succeed(
            Playwright.TracerAttributeFilter,
            (name) =>
              name !== "url.query" &&
              name !== "url.full" &&
              name !== "playwright.selector",
          ),
          Layer.succeed(Playwright.SpanNameGenerator, (op) =>
            op.target !== undefined
              ? `pw:${op.service}.${op.method}:${op.target}`
              : `pw:${op.service}.${op.method}`,
          ),
        );

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          yield* page.goto(`${server.url}/items?secret=123`);
          yield* page.mouse.move(10, 20);
          yield* page.title;
          yield* page.locator("#go").describe("Go button").click();
        }).pipe(
          PlaywrightSpawner.withBrowser,
          Effect.provide(tracingConfigLayer),
          Effect.withTracer(tracer),
        );

        // Disabled services/methods produce no spans
        assert.isUndefined(spans.find((s) => s.name.includes("Mouse")));
        assert.isUndefined(spans.find((s) => s.name.includes(".title")));

        // Custom SpanNameGenerator + filtered attributes on Page.goto
        const gotoSpan = spans.find((s) => s.name.startsWith("pw:Page.goto:"));
        assert.isDefined(gotoSpan);
        assert.strictEqual(gotoSpan.attributes.get("url.path"), "/items");
        assert.strictEqual(
          gotoSpan.attributes.get("http.response.status_code"),
          200,
        );
        assert.isUndefined(gotoSpan.attributes.get("url.query"));
        assert.isUndefined(gotoSpan.attributes.get("url.full"));

        // Custom SpanNameGenerator with locator target + selector filtered out
        const clickSpan = spans.find(
          (s) => s.name === "pw:Locator.click:Go button",
        );
        assert.isDefined(clickSpan);
        assert.isUndefined(clickSpan.attributes.get("playwright.selector"));
        assert.strictEqual(
          clickSpan.attributes.get("playwright.locator.description"),
          "Go button",
        );
      }).pipe(Effect.scoped),
  );

  it.effect(
    "does not leak ended exposeFunction span into exposed callback parent",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          yield* page.exposeFunction("ping", () =>
            Effect.succeed("pong").pipe(Effect.withSpan("callback-span")),
          );

          const result = yield* page.evaluate(() =>
            (window as unknown as { ping: () => Promise<string> }).ping(),
          );
          assert.strictEqual(result, "pong");
        }).pipe(
          Effect.withSpan("outer-span"),
          PlaywrightSpawner.withBrowser,
          Effect.withTracer(tracer),
        );

        const outerSpan = spans.find((s) => s.name === "outer-span");
        const exposeSpan = spans.find(
          (s) => s.name === "Playwright.Page.exposeFunction",
        );
        const callbackSpan = spans.find((s) => s.name === "callback-span");

        assert.isDefined(outerSpan);
        assert.isDefined(exposeSpan);
        assert.isDefined(callbackSpan);

        const callbackParent = Option.getOrUndefined(callbackSpan.parent);
        assert.isDefined(callbackParent);
        assert.notStrictEqual(callbackParent.spanId, exposeSpan.spanId);
        assert.strictEqual(callbackParent.spanId, outerSpan.spanId);
      }),
  );
});
