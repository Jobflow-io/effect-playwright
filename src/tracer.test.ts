import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { assert, describe, it, layer } from "@effect/vitest";
import {
  Cause,
  Deferred,
  Effect,
  Exit,
  Fiber,
  Layer,
  Option,
  Tracer,
} from "effect";
import { chromium, Playwright, PlaywrightSpawner } from "effect-playwright";
import type { Request as CoreRequest } from "playwright-core";
import { sanitizeHttpMethod, sanitizeLoadState, urlAttributes } from "./tracer";

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
        let reloadCount = 0;
        const server = createServer((req, res) => {
          const parsedReq = new URL(req.url ?? "/", "http://127.0.0.1");
          const path = parsedReq.pathname;
          if (path === "/redirect-to") {
            const target = parsedReq.searchParams.get("target") ?? "/page-b";
            res.writeHead(302, { location: target });
            res.end();
            return;
          }
          if (path === "/redirect-on-reload") {
            reloadCount += 1;
            if (reloadCount >= 2) {
              res.writeHead(302, { location: "/page-b" });
              res.end();
              return;
            }
          }
          const status = path === "/page-b" ? 201 : 200;
          res.writeHead(status, {
            "content-type": "text/html",
            "cache-control": "no-store",
          });
          res.end(
            `<title>${path}</title><input id='pw' type='password' /><button id='go'>alice@example.com</button>`,
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
  it("extracts only scheme, host, and port from resolved absolute URLs", () => {
    assert.deepStrictEqual(
      urlAttributes(
        "https://alice:s3cr3t@example.com:8443/users/alice@example.com?token=abc#section",
      ),
      {
        "url.scheme": "https",
        "server.address": "example.com",
        "server.port": 8443,
      },
    );

    assert.deepStrictEqual(urlAttributes("http://[::1]:8080/api?key=secret"), {
      "url.scheme": "http",
      "server.address": "::1",
      "server.port": 8080,
    });

    assert.deepStrictEqual(urlAttributes("http:///127.0.0.1:9222"), {
      "url.scheme": "http",
      "server.address": "127.0.0.1",
      "server.port": 9222,
    });

    assert.deepStrictEqual(
      urlAttributes(
        "wss://user:pass@browser.example.com:9443/devtools/browser/secret-id?token=xyz",
      ),
      {
        "url.scheme": "wss",
        "server.address": "browser.example.com",
        "server.port": 9443,
      },
    );

    for (const [input, expectedScheme] of [
      ["about:blank", "about"],
      ["data:text/html,<h1>secret</h1>", "data"],
      ["file:///Users/alice/secrets.html", "file"],
      ["mailto:alice@example.com", "mailto"],
    ] as const) {
      assert.deepStrictEqual(urlAttributes(input), {
        "url.scheme": expectedScheme,
      });
    }

    for (const invalid of ["", "/relative", "#fragment", "http://[invalid"]) {
      assert.deepStrictEqual(urlAttributes(invalid), {});
    }
  });

  it("sanitizes HTTP methods case-sensitively and validates load states", () => {
    assert.strictEqual(sanitizeHttpMethod("GET"), "GET");
    assert.strictEqual(sanitizeHttpMethod("PATCH"), "PATCH");
    assert.strictEqual(sanitizeHttpMethod("patch"), "_OTHER");
    assert.strictEqual(sanitizeHttpMethod("Customer-Alice-Smith"), "_OTHER");

    assert.deepStrictEqual(sanitizeLoadState("load"), Option.some("load"));
    assert.deepStrictEqual(
      sanitizeLoadState("networkidle"),
      Option.some("networkidle"),
    );
    assert.isTrue(Option.isNone(sanitizeLoadState(undefined)));
    assert.isTrue(Option.isNone(sanitizeLoadState("invalid")));
  });
});

layer(PlaywrightSpawner.layer(chromium))("Effect Tracer integration", (it) => {
  it.effect(
    "emits client spans with parent linkage and never records sensitive payloads",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();
        const server = yield* withLocalHttpServer;

        const cookies = yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const context = yield* browser.newContext();
          yield* context.addCookies([
            {
              name: "session_id",
              value: "super-secret-cookie",
              url: server.url,
            },
          ]);
          const page = yield* context.newPage;

          yield* page.goto(
            `${server.url}/users/alice@example.com?token=sensitive-query#secret-frag`,
          );
          yield* page
            .locator("#pw")
            .describe("Password for alice@example.com")
            .fill("super-secret-password");
          yield* page.keyboard.press("a");
          yield* page.mouse.click(10, 20);
          yield* page.localStorage.setItem(
            "prefs:alice@example.com",
            "secret-storage-val",
          );
          yield* page.setContent("<h1>top-secret-html</h1>");
          yield* page.goto("data:text/html,<h1>secret-data-url</h1>");

          const stubRequest = Playwright.makeRequest({
            method: () => "Customer-Alice-Smith",
            url: () => "https://example.test/api?token=sensitive-query",
            allHeaders: async () => ({}),
          } as unknown as CoreRequest);
          yield* stubRequest.allHeaders;

          return yield* context.cookies();
        }).pipe(
          Effect.scoped,
          Effect.withSpan("checkout-flow"),
          PlaywrightSpawner.withBrowser,
          Effect.withTracer(tracer),
        );

        assert.strictEqual(cookies.length, 1);
        assert.strictEqual(cookies[0].value, "super-secret-cookie");

        const parentSpan = spans.find((s) => s.name === "checkout-flow");
        assert.isDefined(parentSpan);

        const gotoSpans = spans.filter(
          (s) => s.name === "Playwright.Page.goto",
        );
        assert.strictEqual(gotoSpans.length, 2);

        const httpGoto = gotoSpans[0];
        assert.strictEqual(httpGoto.kind, "client");
        assert.strictEqual(
          Option.getOrUndefined(httpGoto.parent)?.spanId,
          parentSpan.spanId,
        );
        assert.strictEqual(httpGoto.attributes.get("url.scheme"), "http");
        assert.strictEqual(
          httpGoto.attributes.get("server.address"),
          "127.0.0.1",
        );
        assert.strictEqual(httpGoto.attributes.get("server.port"), server.port);
        assert.strictEqual(
          httpGoto.attributes.get("http.response.status_code"),
          200,
        );
        assert.isUndefined(httpGoto.attributes.get("url.path"));
        assert.isUndefined(httpGoto.attributes.get("url.full"));

        const dataGoto = gotoSpans[1];
        assert.strictEqual(dataGoto.attributes.get("url.scheme"), "data");
        assert.isUndefined(dataGoto.attributes.get("server.address"));

        const requestSpan = spans.find(
          (s) => s.name === "Playwright.Request.allHeaders",
        );
        assert.isDefined(requestSpan);
        assert.strictEqual(
          requestSpan.attributes.get("http.request.method"),
          "_OTHER",
        );

        const cookiesSpan = spans.find(
          (s) => s.name === "Playwright.BrowserContext.cookies",
        );
        assert.isDefined(cookiesSpan);
        assert.strictEqual(cookiesSpan.status._tag, "Ended");
        if (cookiesSpan.status._tag === "Ended") {
          assert.isTrue(Exit.isSuccess(cookiesSpan.status.exit));
          if (Exit.isSuccess(cookiesSpan.status.exit)) {
            assert.isUndefined(cookiesSpan.status.exit.value);
          }
        }

        const forbidden = [
          "sensitive-query",
          "secret-frag",
          "super-secret-password",
          "super-secret-cookie",
          "secret-storage-val",
          "top-secret-html",
          "secret-data-url",
          "alice@example.com",
          "Customer-Alice-Smith",
        ];
        for (const span of spans) {
          for (const secret of forbidden) {
            assert.isFalse(span.name.includes(secret));
          }
          for (const value of span.attributes.values()) {
            const text = String(value);
            for (const secret of forbidden) {
              assert.isFalse(text.includes(secret));
            }
          }
        }
      }).pipe(Effect.scoped),
  );

  it.effect(
    "records resolved destinations on redirects, fragments, reload, goBack, and goForward while omitting no-op traversals",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();
        const originServer = yield* withLocalHttpServer;
        const destServer = yield* withLocalHttpServer;
        const destUrl = `http://localhost:${destServer.port}/page-b`;

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          // No-op traversals at history boundaries
          yield* page.goBack();
          yield* page.goForward();

          // Cross-origin redirects on Page.goto and Frame.goto
          yield* page.goto(
            `${originServer.url}/redirect-to?target=${encodeURIComponent(destUrl)}`,
          );
          yield* page
            .mainFrame()
            .goto(
              `${originServer.url}/redirect-to?target=${encodeURIComponent(destUrl)}`,
            );

          yield* page.goto(`${originServer.url}/page-a`);
          yield* page.goto(`${originServer.url}/page-b`);
          yield* page.goBack();
          yield* page.goForward();

          yield* page.goto(`${originServer.url}/redirect-on-reload`);
          yield* page.reload();

          // Fragment-only navigation (response === null) uses resolved page/frame URL
          const baseContext = yield* browser.newContext({
            baseURL: `${originServer.url}/page-b`,
          });
          const basePage = yield* baseContext.newPage;
          yield* basePage.goto("");
          yield* basePage.goto("#details");
          yield* basePage.mainFrame().goto("#more");
        }).pipe(
          Effect.scoped,
          PlaywrightSpawner.withBrowser,
          Effect.withTracer(tracer),
        );

        const pageGotos = spans.filter(
          (s) => s.name === "Playwright.Page.goto",
        );
        assert.strictEqual(
          pageGotos[0].attributes.get("server.address"),
          "localhost",
        );
        assert.strictEqual(
          pageGotos[0].attributes.get("server.port"),
          destServer.port,
        );
        assert.strictEqual(
          pageGotos[0].attributes.get("http.response.status_code"),
          201,
        );

        const fragmentPageGoto = pageGotos.at(-1);
        assert.isDefined(fragmentPageGoto);
        assert.strictEqual(
          fragmentPageGoto.attributes.get("server.address"),
          "127.0.0.1",
        );
        assert.strictEqual(
          fragmentPageGoto.attributes.get("server.port"),
          originServer.port,
        );

        const frameGotos = spans.filter(
          (s) => s.name === "Playwright.Frame.goto",
        );
        assert.strictEqual(
          frameGotos[0].attributes.get("server.address"),
          "localhost",
        );
        assert.strictEqual(
          frameGotos[0].attributes.get("http.response.status_code"),
          201,
        );
        assert.strictEqual(
          frameGotos[1].attributes.get("server.address"),
          "127.0.0.1",
        );

        const goBacks = spans.filter(
          (s) => s.name === "Playwright.Page.goBack",
        );
        assert.strictEqual(goBacks.length, 2);
        assert.isUndefined(goBacks[0].attributes.get("server.address"));
        assert.strictEqual(
          goBacks[1].attributes.get("http.response.status_code"),
          200,
        );

        const goForwards = spans.filter(
          (s) => s.name === "Playwright.Page.goForward",
        );
        assert.strictEqual(goForwards.length, 2);
        assert.isUndefined(goForwards[0].attributes.get("server.address"));
        assert.strictEqual(
          goForwards[1].attributes.get("http.response.status_code"),
          201,
        );

        const reloadSpan = spans.find(
          (s) => s.name === "Playwright.Page.reload",
        );
        assert.isDefined(reloadSpan);
        assert.strictEqual(
          reloadSpan.attributes.get("http.response.status_code"),
          201,
        );
      }).pipe(Effect.scoped),
  );

  it.effect(
    "sanitizes failure exits sent to the tracer while returning original errors to callers",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();

        const useExit = yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();
          yield* page.setContent("<div>hello</div>");

          const timeoutExit = yield* Effect.exit(
            page.locator("#does-not-exist").click({ timeout: 50 }),
          );
          assert.isTrue(Exit.isFailure(timeoutExit));

          return yield* Effect.exit(
            page.use(() =>
              Promise.reject(
                new Error("customer alice@example.com failed validation"),
              ),
            ),
          );
        }).pipe(PlaywrightSpawner.withBrowser, Effect.withTracer(tracer));

        assert.isTrue(Exit.isFailure(useExit));
        if (Exit.isFailure(useExit)) {
          const err = Cause.findErrorOption(useExit.cause);
          assert.isTrue(Option.isSome(err));
          if (Option.isSome(err)) {
            assert.strictEqual(err.value.reason, "Unknown");
            assert.include(String(err.value.cause), "alice@example.com");
          }
        }

        const useSpan = spans.find((s) => s.name === "Playwright.Page.use");
        assert.isDefined(useSpan);
        assert.strictEqual(
          useSpan.attributes.get("playwright.error.reason"),
          "Unknown",
        );
        assert.strictEqual(useSpan.status._tag, "Ended");
        if (useSpan.status._tag === "Ended") {
          assert.isTrue(Exit.isFailure(useSpan.status.exit));
          if (Exit.isFailure(useSpan.status.exit)) {
            const spanErr = Cause.findErrorOption(useSpan.status.exit.cause);
            assert.isTrue(Option.isSome(spanErr));
            if (Option.isSome(spanErr)) {
              const pwErr = spanErr.value as Playwright.PlaywrightError;
              assert.strictEqual(pwErr.reason, "Unknown");
              assert.isUndefined(pwErr.cause);
            }
          }
        }

        const clickSpan = spans.find(
          (s) => s.name === "Playwright.Locator.click",
        );
        assert.isDefined(clickSpan);
        assert.strictEqual(
          clickSpan.attributes.get("playwright.error.reason"),
          "Timeout",
        );
      }),
  );

  it.effect(
    "respects Effect tracing controls and Playwright tracing configuration references",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();
        const server = yield* withLocalHttpServer;

        const configLayer = Layer.mergeAll(
          Layer.succeed(
            Playwright.TracerDisabledWhen,
            (op) => op.service === "Mouse" || op.method === "content",
          ),
          Layer.succeed(
            Playwright.TracerAttributeFilter,
            (name) => name !== "server.address",
          ),
          Layer.succeed(
            Playwright.SpanNameGenerator,
            (op) => `pw:${op.service}.${op.method}`,
          ),
        );

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();

          yield* page
            .setContent("<title>Hidden</title>")
            .pipe(Effect.withTracerEnabled(false));
          yield* page.title.pipe(
            Effect.provideService(Tracer.DisablePropagation, true),
          );
          yield* page.mouse.move(10, 20);
          yield* page.content();
          yield* page.goto(`${server.url}/items`);
          yield* page.title.pipe(Effect.annotateSpans({ "tenant.id": "acme" }));
          yield* page.title.pipe(
            Effect.provideService(Tracer.MinimumTraceLevel, "None"),
          );
          yield* page.title.pipe(Effect.withTracerTiming(false));
        }).pipe(
          PlaywrightSpawner.withBrowser,
          Effect.provide(configLayer),
          Effect.withTracer(tracer),
        );

        assert.isUndefined(spans.find((s) => s.name.includes("setContent")));
        assert.isUndefined(spans.find((s) => s.name.includes("Mouse")));
        assert.isUndefined(spans.find((s) => s.name.includes("content")));

        const gotoSpan = spans.find((s) => s.name === "pw:Page.goto");
        assert.isDefined(gotoSpan);
        assert.isUndefined(gotoSpan.attributes.get("server.address"));
        assert.strictEqual(
          gotoSpan.attributes.get("http.response.status_code"),
          200,
        );

        const titleSpans = spans.filter((s) => s.name === "pw:Page.title");
        assert.strictEqual(titleSpans.length, 3);
        assert.strictEqual(titleSpans[0].attributes.get("tenant.id"), "acme");
        assert.strictEqual(titleSpans[1].sampled, false);
        assert.strictEqual(titleSpans[1].attributes.size, 0);
        assert.strictEqual(titleSpans[2].status._tag, "Ended");
        if (titleSpans[2].status._tag === "Ended") {
          assert.strictEqual(titleSpans[2].status.startTime, 0n);
          assert.strictEqual(titleSpans[2].status.endTime, 0n);
        }
      }).pipe(Effect.scoped),
  );

  it.effect(
    "ends spans with an interruption-only cause when an in-flight operation is interrupted",
    () =>
      Effect.gen(function* () {
        const { spans, tracer } = makeRecordingTracer();

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          const page = yield* browser.newPage();
          const started = yield* Deferred.make<void>();
          let releasePending: (() => void) | undefined;

          const fiber = yield* page
            .use(
              () =>
                new Promise<void>((resolve) => {
                  releasePending = resolve;
                  Deferred.doneUnsafe(started, Exit.void);
                }),
            )
            .pipe(Effect.forkChild);

          yield* Deferred.await(started);
          yield* Fiber.interrupt(fiber);
          releasePending?.();
        }).pipe(PlaywrightSpawner.withBrowser, Effect.withTracer(tracer));

        const useSpan = spans.find((s) => s.name === "Playwright.Page.use");
        assert.isDefined(useSpan);
        assert.strictEqual(useSpan.status._tag, "Ended");
        if (useSpan.status._tag === "Ended") {
          assert.isTrue(Exit.isFailure(useSpan.status.exit));
          if (Exit.isFailure(useSpan.status.exit)) {
            assert.isTrue(Cause.hasInterruptsOnly(useSpan.status.exit.cause));
          }
        }
      }),
  );

  it.effect(
    "isolates throwing tracing hooks and custom tracer defects from operations and Browser.close",
    () =>
      Effect.gen(function* () {
        const { tracer } = makeRecordingTracer();
        let firstBrowser: Playwright.Browser | undefined;

        const failExit = yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          firstBrowser = browser;
          const page = yield* browser.newPage();
          yield* page.setContent("<div>hello</div>");
          return yield* page.locator("#missing").click({ timeout: 50 });
        }).pipe(
          PlaywrightSpawner.withBrowser,
          Effect.provideService(Playwright.TracerAttributeFilter, () => {
            throw new Error("filter boom");
          }),
          Effect.withTracer(tracer),
          Effect.exit,
        );
        assert.isTrue(Exit.isFailure(failExit));
        assert.isDefined(firstBrowser);
        assert.isFalse(firstBrowser.isConnected());

        // Throwing span.sampled and span.status getters still allow operations,
        // span.end finalization, and scoped Browser.close to run.
        let secondBrowser: Playwright.Browser | undefined;
        let endedCount = 0;
        const faultyTracer = Tracer.make({
          span(options) {
            const inner = new Tracer.NativeSpan(options);
            return new Proxy(inner, {
              get(target, prop, receiver) {
                if (prop === "sampled") {
                  throw new Error("sampled getter boom");
                }
                if (prop === "status") {
                  throw new Error("status getter boom");
                }
                if (prop === "end") {
                  return (...args: Parameters<Tracer.NativeSpan["end"]>) => {
                    endedCount += 1;
                    return target.end(...args);
                  };
                }
                const value = Reflect.get(target, prop, receiver);
                return typeof value === "function" ? value.bind(target) : value;
              },
            });
          },
        });

        yield* Effect.gen(function* () {
          const browser = yield* Playwright.Browser;
          secondBrowser = browser;
          const page = yield* browser.newPage();
          yield* page.setContent("<title>Ok</title>");
          assert.strictEqual(yield* page.title, "Ok");
        }).pipe(PlaywrightSpawner.withBrowser, Effect.withTracer(faultyTracer));
        assert.isDefined(secondBrowser);
        assert.isFalse(secondBrowser.isConnected());
        assert.isAbove(endedCount, 0);
      }),
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
