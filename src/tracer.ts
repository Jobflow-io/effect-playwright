/**
 * Effect `Tracer` integration and configuration references for Playwright
 * operations.
 *
 * All fallible Playwright operations emit Effect spans with `kind: "client"`
 * while respecting Effect's native tracing controls (`Effect.withTracerEnabled`,
 * `Tracer.DisablePropagation`, `Tracer.MinimumTraceLevel`,
 * `Effect.withTracerTiming`, and `Effect.annotateSpans`). Sensitive payloads
 * (such as input values, keystrokes, selectors, coordinates, headers, cookies,
 * storage keys/values, HTML content, URL paths, queries, fragments,
 * credentials, opaque URL payloads, and raw error causes) are never recorded
 * on spans.
 *
 * Use {@link TracerDisabledWhen}, {@link TracerAttributeFilter}, and
 * {@link SpanNameGenerator} to customize Playwright-specific tracing behavior.
 * These references configure Effect tracing and are separate from Playwright's
 * trace viewer recordings (`context.tracing`).
 *
 * @see https://playwright.dev/docs/api/class-playwright
 * @since 0.10.0
 */

import {
  Cause,
  Clock,
  Context,
  Effect,
  Exit,
  Option,
  type Predicate,
  Record,
  References,
  Result,
  Schema,
  SchemaTransformation,
  Tracer,
} from "effect";
import { PlaywrightError, wrapError } from "./errors";
import { useHelper } from "./utils";

/**
 * Wrapper service names reported on {@link SpanOperation.service}.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const ignoredServices = new Set<Playwright.SpanService>([
 *   "Mouse",
 *   "Keyboard",
 * ]);
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.mouse.move(10, 20);
 * }).pipe(
 *   Effect.provideService(Playwright.TracerDisabledWhen, (op) =>
 *     ignoredServices.has(op.service),
 *   ),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/api/class-playwright
 * @category models
 * @since 0.10.0
 */
export type SpanService =
  | "Playwright"
  | "Browser"
  | "BrowserContext"
  | "Page"
  | "Frame"
  | "Locator"
  | "Keyboard"
  | "Mouse"
  | "Touchscreen"
  | "Clock"
  | "Credentials"
  | "Screencast"
  | "Tracing"
  | "WebStorage"
  | "WebMCP"
  | "Request"
  | "Response"
  | "Worker"
  | "Dialog"
  | "FileChooser"
  | "Download";

/**
 * Metadata describing a Playwright operation being traced.
 *
 * Passed to {@link TracerDisabledWhen}, {@link TracerAttributeFilter}, and
 * {@link SpanNameGenerator} so tracing behavior can be customized per service
 * or method.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const formatSpanName = (op: Playwright.SpanOperation): string =>
 *   `${op.service}.${op.method}`;
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.goto("https://example.com");
 * }).pipe(
 *   Effect.provideService(Playwright.SpanNameGenerator, formatSpanName),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/api/class-playwright
 * @category models
 * @since 0.10.0
 */
export interface SpanOperation {
  /**
   * The wrapper service name (for example, `"Page"`, `"Locator"`, or `"Browser"`).
   */
  readonly service: SpanService;
  /**
   * The operation method name (for example, `"goto"`, `"click"`, or `"launch"`).
   */
  readonly method: string;
}

/**
 * Context reference for a predicate that disables Effect tracing for matching
 * Playwright operations.
 *
 * **When to use**
 *
 * Use to silence noisy Playwright services/methods (for example, `"Mouse"` or
 * `"title"`) or to disable all Playwright spans with `() => true` while
 * keeping your own application spans enabled.
 *
 * **Details**
 *
 * Defaults to `() => false` (all operations are traced unless disabled by
 * `Effect.withTracerEnabled(false)` or `Tracer.DisablePropagation`). Can be
 * provided per effect via `Effect.provideService` or as a layer via
 * `Layer.succeed`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.mouse.move(10, 20);
 *   yield* page.goto("https://example.com");
 * }).pipe(
 *   Effect.provideService(
 *     Playwright.TracerDisabledWhen,
 *     (op) => op.service === "Mouse",
 *   ),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/api/class-playwright
 * @see {@link TracerAttributeFilter}
 * @see {@link SpanNameGenerator}
 * @category services
 * @since 0.10.0
 */
export const TracerDisabledWhen: Context.Reference<
  Predicate.Predicate<SpanOperation>
> = Context.Reference<Predicate.Predicate<SpanOperation>>(
  "effect-playwright/tracer/TracerDisabledWhen",
  {
    defaultValue: () => () => false,
  },
);

/**
 * Context reference for filtering attributes recorded on Playwright spans.
 *
 * **When to use**
 *
 * Use when you want to trim trace size or omit metadata such as
 * `"server.address"` or `"playwright.browser.version"`.
 *
 * **Details**
 *
 * Defaults to `() => true`. Return `false` for any attribute name recorded by
 * `effect-playwright` that you want to omit from spans. This filter only
 * applies to attributes emitted by `effect-playwright` and does not filter
 * annotations inherited from `Effect.annotateSpans`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.goto("https://example.com/account/settings");
 * }).pipe(
 *   Effect.provideService(
 *     Playwright.TracerAttributeFilter,
 *     (name) => name !== "server.address" && name !== "server.port",
 *   ),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/api/class-page
 * @see {@link TracerDisabledWhen}
 * @see {@link SpanNameGenerator}
 * @category services
 * @since 0.10.0
 */
export const TracerAttributeFilter: Context.Reference<
  (attributeName: string, operation: SpanOperation) => boolean
> = Context.Reference<
  (attributeName: string, operation: SpanOperation) => boolean
>("effect-playwright/tracer/TracerAttributeFilter", {
  defaultValue: () => () => true,
});

/**
 * Context reference for generating span names for Playwright operations.
 *
 * **When to use**
 *
 * Use to adopt a custom span naming scheme for Playwright operations.
 *
 * **Details**
 *
 * Defaults to `Playwright.<method>` for launch and connection operations on
 * the `Playwright` service, and `Playwright.<service>.<method>` for all other
 * services (for example, `Playwright.Page.goto` and `Playwright.Locator.click`).
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.goto("https://example.com");
 * }).pipe(
 *   Effect.provideService(
 *     Playwright.SpanNameGenerator,
 *     (op) => `pw.${op.service}.${op.method}`,
 *   ),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/api/class-playwright
 * @see {@link TracerDisabledWhen}
 * @see {@link TracerAttributeFilter}
 * @category services
 * @since 0.10.0
 */
export const SpanNameGenerator: Context.Reference<
  (operation: SpanOperation) => string
> = Context.Reference<(operation: SpanOperation) => string>(
  "effect-playwright/tracer/SpanNameGenerator",
  {
    defaultValue: () => (operation) =>
      operation.service === "Playwright"
        ? `Playwright.${operation.method}`
        : `Playwright.${operation.service}.${operation.method}`,
  },
);

/** @internal */
export interface TraceSpanConfig<A> {
  readonly service: SpanService;
  readonly method: string;
  readonly attributes?: (() => Record<string, unknown>) | undefined;
  readonly onSuccess?:
    | ((value: A) => Record<string, unknown> | undefined)
    | undefined;
}

const NetworkScheme = Schema.Literals(["http", "https", "ws", "wss"]);
const isNetworkScheme = Schema.is(NetworkScheme);

const parseAbsoluteUrl = Schema.decodeOption(
  Schema.String.pipe(
    Schema.decodeTo(Schema.URL, SchemaTransformation.urlFromString),
  ),
);

const normalizeHostname = (hostname: string): string | undefined => {
  if (hostname === "") return undefined;
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
};

/** @internal */
export const urlAttributes = (rawUrl: string): Record<string, unknown> =>
  Option.match(parseAbsoluteUrl(rawUrl), {
    onNone: () => ({}),
    onSome: (url) => {
      const scheme = url.protocol.slice(0, -1);
      if (!isNetworkScheme(scheme)) {
        return { "url.scheme": scheme };
      }
      const hostname = normalizeHostname(url.hostname);
      const port = url.port !== "" ? Number(url.port) : undefined;
      return {
        "url.scheme": scheme,
        ...(hostname !== undefined
          ? { "server.address": hostname }
          : undefined),
        ...(port !== undefined ? { "server.port": port } : undefined),
      };
    },
  });

const StandardHttpMethod = Schema.Literals([
  "CONNECT",
  "DELETE",
  "GET",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "POST",
  "PUT",
  "QUERY",
  "TRACE",
]);
const isStandardHttpMethod = Schema.is(StandardHttpMethod);

/** @internal */
export const sanitizeHttpMethod = (method: string): string =>
  isStandardHttpMethod(method) ? method : "_OTHER";

const StandardLoadState = Schema.Literals([
  "load",
  "domcontentloaded",
  "networkidle",
]);
const isStandardLoadState = Schema.is(StandardLoadState);

/** @internal */
export type StandardLoadState = Schema.Schema.Type<typeof StandardLoadState>;

/** @internal */
export const sanitizeLoadState = (
  state: string | undefined,
): Option.Option<StandardLoadState> =>
  Option.fromNullishOr(state).pipe(Option.filter(isStandardLoadState));

const isPlaywrightError = (error: unknown): error is PlaywrightError =>
  error instanceof PlaywrightError;

const bigint0 = BigInt(0);

const sanitizeSpanExit = <A, E>(
  exit: Exit.Exit<A, E>,
): Exit.Exit<unknown, unknown> =>
  Exit.match(exit, {
    onSuccess: () => Exit.void,
    onFailure: (cause) => {
      if (Cause.hasInterruptsOnly(cause)) {
        return exit;
      }
      const reason = Cause.findErrorOption(cause).pipe(
        Option.filter(isPlaywrightError),
        Option.map((error) => error.reason),
        Option.getOrElse(() => "Unknown" as const),
      );
      return Exit.fail(new PlaywrightError({ reason, cause: undefined }));
    },
  });

const isSpanSampled = (span: Tracer.Span): boolean =>
  Result.getOrElse(
    Result.try(() => span.sampled),
    () => false,
  );

const isSpanEnded = (span: Tracer.Span): boolean =>
  Result.getOrElse(
    Result.try(() => span.status._tag === "Ended"),
    () => false,
  );

interface ResolvedSpanSetup {
  readonly operation: SpanOperation;
  readonly spanName: string;
  readonly attributeFilter: (
    attributeName: string,
    operation: SpanOperation,
  ) => boolean;
}

/** @internal */
export const withPlaywrightSpan = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  config: TraceSpanConfig<A>,
): Effect.Effect<A, E, R> =>
  Effect.withFiber((fiber) => {
    if (
      !fiber.getRef(References.TracerEnabled) ||
      fiber.getRef(Tracer.DisablePropagation)
    ) {
      return effect;
    }

    const setup = Result.getSuccess(
      Result.try((): Option.Option<ResolvedSpanSetup> => {
        const operation: SpanOperation = {
          service: config.service,
          method: config.method,
        };
        if (fiber.getRef(TracerDisabledWhen)(operation)) {
          return Option.none();
        }
        return Option.some({
          operation,
          spanName: fiber.getRef(SpanNameGenerator)(operation),
          attributeFilter: fiber.getRef(TracerAttributeFilter),
        });
      }),
    ).pipe(Option.flatten);

    if (Option.isNone(setup)) {
      return effect;
    }

    const { operation, spanName, attributeFilter } = setup.value;

    const setAttribute = (
      span: Tracer.Span,
      key: string,
      value: unknown,
    ): void => {
      if (value === undefined) return;
      Result.try(() => {
        if (attributeFilter(key, operation)) {
          span.attribute(key, value);
        }
      });
    };

    const setAttributes = (
      span: Tracer.Span,
      getAttributes: () => Record<string, unknown> | undefined,
    ): void => {
      Result.getSuccess(Result.try(getAttributes)).pipe(
        Option.flatMap(Option.fromNullishOr),
        Option.map((attrs) =>
          Record.toEntries(attrs).forEach(([key, value]) => {
            setAttribute(span, key, value);
          }),
        ),
      );
    };

    const clock = fiber.getRef(Clock.Clock);
    const timingEnabled = fiber.getRef(References.TracerTimingEnabled);

    return Effect.uninterruptibleMask((restore) =>
      Effect.makeSpan(spanName, { kind: "client" }).pipe(
        Effect.catchDefect(() => Effect.succeed(undefined)),
        Effect.flatMap((span) => {
          if (span === undefined) {
            return restore(effect);
          }

          if (isSpanSampled(span)) {
            setAttribute(span, "playwright.service", operation.service);
            setAttribute(span, "playwright.method", operation.method);
            if (config.attributes !== undefined) {
              setAttributes(span, config.attributes);
            }
          }

          return Effect.onExit(
            Effect.withParentSpan(restore(effect), span, {
              captureStackTrace: false,
            }),
            (exit) =>
              Effect.sync(() => {
                if (isSpanEnded(span)) return;
                if (isSpanSampled(span)) {
                  Exit.match(exit, {
                    onSuccess: (value) => {
                      if (config.onSuccess !== undefined) {
                        const onSuccess = config.onSuccess;
                        setAttributes(span, () => onSuccess(value));
                      }
                    },
                    onFailure: (cause) => {
                      Cause.findErrorOption(cause).pipe(
                        Option.filter(isPlaywrightError),
                        Option.map((error) =>
                          setAttribute(
                            span,
                            "playwright.error.reason",
                            error.reason,
                          ),
                        ),
                      );
                    },
                  });
                }
                const endTime = timingEnabled
                  ? clock.currentTimeNanosUnsafe()
                  : bigint0;
                span.end(endTime, sanitizeSpanExit(exit));
              }).pipe(Effect.catchDefect(() => Effect.void)),
          );
        }),
      ),
    );
  });

/** @internal */
export interface TracedCallOptions<A> {
  readonly attributes?: (() => Record<string, unknown>) | undefined;
  readonly onSuccess?:
    | ((value: A) => Record<string, unknown> | undefined)
    | undefined;
}

/** @internal */
export const makeTracedUse = <Wrap>(
  api: Wrap,
  service: SpanService,
  baseAttributes?: () => Record<string, unknown>,
) => {
  const rawUse = useHelper(api);

  const traceEffect = <A>(
    method: string,
    effect: Effect.Effect<A, PlaywrightError>,
    options?: TracedCallOptions<A>,
  ): Effect.Effect<A, PlaywrightError> =>
    withPlaywrightSpan(effect, {
      service,
      method,
      attributes:
        baseAttributes !== undefined || options?.attributes !== undefined
          ? () => ({
              ...(baseAttributes !== undefined ? baseAttributes() : undefined),
              ...(options?.attributes !== undefined
                ? options.attributes()
                : undefined),
            })
          : undefined,
      onSuccess: options?.onSuccess,
    });

  const traced = <A>(
    method: string,
    userFunction: (api: Wrap) => Promise<A>,
    options?: TracedCallOptions<A>,
  ): Effect.Effect<A, PlaywrightError> =>
    traceEffect(method, rawUse(userFunction), options);

  const use = <A>(
    userFunction: (api: Wrap) => Promise<A>,
  ): Effect.Effect<A, PlaywrightError> => traced("use", userFunction);

  return { traced, traceEffect, use } as const;
};

/** @internal */
export const tracedTry = <A>(
  service: SpanService,
  method: string,
  thunk: () => A,
  options?: TracedCallOptions<A>,
): Effect.Effect<A, PlaywrightError> =>
  withPlaywrightSpan(Effect.try({ try: thunk, catch: wrapError }), {
    service,
    method,
    attributes: options?.attributes,
    onSuccess: options?.onSuccess,
  });
