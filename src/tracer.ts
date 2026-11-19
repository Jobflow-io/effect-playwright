/**
 * Effect `Tracer` integration and configuration references for Playwright
 * operations.
 *
 * All fallible Playwright operations emit Effect spans with `kind: "client"`
 * while respecting Effect's native tracing controls (`Effect.withTracerEnabled`,
 * `Tracer.DisablePropagation`, `Tracer.MinimumTraceLevel`,
 * `Effect.withTracerTiming`, and `Effect.annotateSpans`). Sensitive payloads
 * (such as typed text, headers, cookies, storage values, raw HTML, `data:` URL
 * bodies, and URL credentials) are omitted or redacted by default.
 *
 * Use {@link TracerDisabledWhen}, {@link TracerAttributeFilter}, and
 * {@link SpanNameGenerator} to customize Playwright-specific tracing behavior.
 * These references configure Effect tracing and are separate from Playwright's
 * trace viewer recordings (`context.tracing`).
 *
 * @since 0.10.0
 */

import { Context, Effect, type Predicate, References, Tracer } from "effect";
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
 * {@link SpanNameGenerator} so tracing behavior can be customized per service,
 * method, or target.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const formatSpanName = (op: Playwright.SpanOperation): string =>
 *   op.target !== undefined
 *     ? `${op.service}.${op.method} (${op.target})`
 *     : `${op.service}.${op.method}`;
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.goto("https://example.com");
 * }).pipe(
 *   Effect.provideService(Playwright.SpanNameGenerator, formatSpanName),
 * );
 * ```
 *
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
  /**
   * Optional sanitized target summary, such as a locator selector/description
   * or a credential-redacted URL.
   */
  readonly target?: string | undefined;
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
 * Use when you want to trim trace size or omit potentially sensitive metadata
 * such as `"url.query"`, `"url.full"`, or `"playwright.selector"`.
 *
 * **Details**
 *
 * Defaults to `() => true`. Return `false` for any attribute name you want to
 * omit from spans. Sensitive payloads (input values, headers, cookies, storage
 * values, raw HTML, `data:` URL bodies, and URL credentials) are already
 * omitted or redacted by default.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 *
 * const program = Effect.gen(function* () {
 *   const page = yield* Playwright.Page;
 *   yield* page.goto("https://example.com/search?token=secret");
 * }).pipe(
 *   Effect.provideService(
 *     Playwright.TracerAttributeFilter,
 *     (name) => name !== "url.query" && name !== "url.full",
 *   ),
 * );
 * ```
 *
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
 * Use to adopt a custom span naming scheme or to include
 * {@link SpanOperation.target} (such as locator descriptions) in span names.
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
 *   yield* page.locator("button").click();
 * }).pipe(
 *   Effect.provideService(Playwright.SpanNameGenerator, (op) =>
 *     op.target !== undefined
 *       ? `${op.service}.${op.method} (${op.target})`
 *       : `${op.service}.${op.method}`,
 *   ),
 * );
 * ```
 *
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
  readonly target?: string | undefined;
  readonly getTarget?: (() => string | undefined) | undefined;
  readonly attributes?: (() => Record<string, unknown>) | undefined;
  readonly onSuccess?:
    | ((value: A) => Record<string, unknown> | undefined)
    | undefined;
}

/** @internal */
export const sanitizeUrl = (rawUrl: string): string | undefined => {
  if (rawUrl === "") {
    return undefined;
  }
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol === "data:") {
      return "data:";
    }
    if (parsed.username !== "" || parsed.password !== "") {
      parsed.username = "REDACTED";
      parsed.password = "REDACTED";
    }
    return parsed.toString();
  } catch {
    return rawUrl;
  }
};

/** @internal */
export const urlAttributes = (rawUrl: string): Record<string, unknown> => {
  if (rawUrl === "") {
    return {};
  }
  try {
    const parsed = new URL(rawUrl);
    const scheme = parsed.protocol.slice(0, -1);
    if (parsed.protocol === "data:") {
      return { "url.scheme": scheme };
    }
    if (parsed.username !== "" || parsed.password !== "") {
      parsed.username = "REDACTED";
      parsed.password = "REDACTED";
    }
    const attrs: Record<string, unknown> = {
      "url.full": parsed.toString(),
      "url.scheme": scheme,
      "url.path": parsed.pathname,
    };
    if (parsed.origin !== "null") {
      attrs["server.address"] = parsed.origin;
    }
    if (parsed.port !== "") {
      attrs["server.port"] = +parsed.port;
    }
    const query = parsed.search.slice(1);
    if (query !== "") {
      attrs["url.query"] = query;
    }
    return attrs;
  } catch {
    const hashIndex = rawUrl.indexOf("#");
    const withoutHash = hashIndex === -1 ? rawUrl : rawUrl.slice(0, hashIndex);
    const queryIndex = withoutHash.indexOf("?");
    const attrs: Record<string, unknown> = {
      "url.full": rawUrl,
      "url.path":
        queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex),
    };
    if (queryIndex !== -1 && queryIndex < withoutHash.length - 1) {
      attrs["url.query"] = withoutHash.slice(queryIndex + 1);
    }
    return attrs;
  }
};

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

    const target =
      config.target !== undefined ? config.target : config.getTarget?.();

    const operation: SpanOperation =
      target !== undefined
        ? { service: config.service, method: config.method, target }
        : { service: config.service, method: config.method };

    if (fiber.getRef(TracerDisabledWhen)(operation)) {
      return effect;
    }

    const spanName = fiber.getRef(SpanNameGenerator)(operation);
    const attributeFilter = fiber.getRef(TracerAttributeFilter);

    const setAttribute = (
      span: Tracer.Span,
      key: string,
      value: unknown,
    ): void => {
      if (value === undefined) return;
      if (!attributeFilter(key, operation)) return;
      span.attribute(key, value);
    };

    return Effect.useSpan(spanName, { kind: "client" }, (span) => {
      if (span.sampled) {
        setAttribute(span, "playwright.service", operation.service);
        setAttribute(span, "playwright.method", operation.method);
        if (config.attributes !== undefined) {
          const attrs = config.attributes();
          for (const key in attrs) {
            setAttribute(span, key, attrs[key]);
          }
        }
      }

      let result = Effect.withParentSpan(effect, span, {
        captureStackTrace: false,
      });

      if (span.sampled && config.onSuccess !== undefined) {
        const onSuccess = config.onSuccess;
        result = Effect.map(result, (value) => {
          const attrs = onSuccess(value);
          if (attrs !== undefined) {
            for (const key in attrs) {
              setAttribute(span, key, attrs[key]);
            }
          }
          return value;
        });
      }

      if (span.sampled) {
        result = Effect.mapError(result, (error) => {
          if (error instanceof PlaywrightError) {
            setAttribute(span, "playwright.error.reason", error.reason);
          }
          return error;
        });
      }

      return result;
    });
  });

/** @internal */
export interface TracedCallOptions<A> {
  readonly target?: string | undefined;
  readonly getTarget?: (() => string | undefined) | undefined;
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
  baseTarget?: () => string | undefined,
) => {
  const rawUse = useHelper(api);

  const traced = <A>(
    method: string,
    userFunction: (api: Wrap) => Promise<A>,
    options?: TracedCallOptions<A>,
  ): Effect.Effect<A, PlaywrightError> =>
    withPlaywrightSpan(rawUse(userFunction), {
      service,
      method,
      target: options?.target,
      getTarget:
        options?.target !== undefined
          ? undefined
          : (options?.getTarget ?? baseTarget),
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

  const use = <A>(
    userFunction: (api: Wrap) => Promise<A>,
  ): Effect.Effect<A, PlaywrightError> => traced("use", userFunction);

  return { traced, use } as const;
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
    target: options?.target,
    getTarget: options?.getTarget,
    attributes: options?.attributes,
    onSuccess: options?.onSuccess,
  });
