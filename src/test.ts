/**
 * Playwright Test integration for Effect programs.
 *
 * Playwright Test owns its fixtures and their lifetimes. Effect programs receive
 * non-owning wrappers for the active `browser`, `context`, and `page`; resources
 * acquired by the program remain scoped to that program. Because Playwright does
 * not expose a public test-completion signal, timeout interruption starts during
 * test-scoped fixture teardown, after user `afterEach` hooks have run.
 *
 * @since 0.6.0
 * @packageDocumentation
 */

import {
  type Fixtures,
  type PlaywrightTestArgs,
  type PlaywrightWorkerArgs,
  test as playwrightTest,
  type TestDetails,
  type TestInfo,
  type TestType,
} from "@playwright/test";
import {
  Cause,
  Context,
  Duration,
  Effect,
  Exit,
  Layer,
  Logger,
  Scope,
} from "effect";
import { Browser } from "./browser";
import { BrowserContext } from "./browser-context";
import { Page } from "./page";

export * from "@playwright/test";

/**
 * Services available to an Effect-based Playwright test.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type TestEnvironment = Browser | BrowserContext | Page | Scope.Scope;

/**
 * An Effect-returning Playwright Test callback.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type EffectTestFunction<Args extends object, A, E, R = never> = (
  args: Args,
  testInfo: TestInfo,
) => Effect.Effect<A, E, TestEnvironment | R>;

/**
 * Registers Effect-based Playwright tests.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export interface EffectTest<Args extends object, R = never> {
  <A, E>(title: string, body: EffectTestFunction<Args, A, E, R>): void;
  <A, E>(
    title: string,
    details: TestDetails,
    body: EffectTestFunction<Args, A, E, R>,
  ): void;
}

/**
 * Effect-based Playwright test registration and modifiers.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-annotations
 * @since 0.6.0
 */
export interface EffectTester<Args extends object, R = never>
  extends EffectTest<Args, R> {
  readonly only: EffectTest<Args, R>;
  readonly skip: EffectTest<Args, R>;
  readonly fixme: EffectTest<Args, R>;
  readonly fail: EffectTest<Args, R> & { readonly only: EffectTest<Args, R> };
}

interface LayerOptions {
  readonly memoMap?: Layer.MemoMap;
  readonly timeout?: Duration.DurationInput;
}

interface NestedLayerOptions {
  readonly timeout?: Duration.DurationInput;
}

interface LayerRegistration<T extends object, W extends object, R> {
  (f: (test: LayerTestMethods<T, W, R>) => void): void;
  (name: string, f: (test: LayerTestMethods<T, W, R>) => void): void;
}

type LayerTestMethods<T extends object, W extends object, R> = TestType<
  T,
  W
> & {
  readonly effect: EffectTester<T & W, R>;
  readonly scoped: EffectTester<T & W, R>;
  readonly layer: <R2, E>(
    layer: Layer.Layer<R2, E, R>,
    options?: NestedLayerOptions,
  ) => LayerRegistration<T, W, R | R2>;
};

type LayerMethod<T extends object, W extends object> = <R, E>(
  layer: Layer.Layer<R, E>,
  options?: LayerOptions,
) => LayerRegistration<T, W, R>;

/**
 * A Playwright `TestType` enhanced with Effect-based registration methods.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type TestMethods<T extends object, W extends object> = TestType<T, W> & {
  readonly effect: EffectTester<T & W>;
  readonly layer: LayerMethod<T, W>;
};

interface EffectRunner {
  readonly abortController: AbortController;
  readonly context: Context.Context<Exclude<TestEnvironment, Scope.Scope>>;
  readonly running: Set<Promise<unknown>>;
  closed: boolean;
}

interface InternalFixtures {
  readonly _effectPlaywrightRuntime: EffectRunner;
}

const activeRunners = new WeakMap<TestInfo, EffectRunner>();
const augmentedTesters = new WeakMap<object, EffectTester<object>>();
const noActiveRuntimeMessage =
  "effect-playwright/test: no active Effect runtime for this test";

const runPromise = <A, E>(
  effect: Effect.Effect<A, E>,
  signal?: AbortSignal,
): Promise<A> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const exit = yield* Effect.exit(effect);
      if (Exit.isFailure(exit)) {
        const errors = Cause.prettyErrors(exit.cause);
        yield* Effect.forEach(errors, (e) => {
          console.error(e);
          return Effect.void;
        });
      }
      return yield* exit;
    }).pipe(Effect.provide(Logger.pretty)),
    { signal },
  );

type EffectTransform<R> = <A, E>(
  effect: Effect.Effect<A, E, TestEnvironment | R>,
) => Effect.Effect<A, E, TestEnvironment>;

const withoutLayer: EffectTransform<never> = (effect) => effect;

const makeEffectTest = <Args extends object, R>(
  register: (
    title: string,
    details: TestDetails | undefined,
    body: (args: Args, testInfo: TestInfo) => Promise<void>,
  ) => void,
  transform: EffectTransform<R>,
): EffectTest<Args, R> => {
  function effectTest<A, E>(
    title: string,
    body: EffectTestFunction<Args, A, E, R>,
  ): void;
  function effectTest<A, E>(
    title: string,
    details: TestDetails,
    body: EffectTestFunction<Args, A, E, R>,
  ): void;
  function effectTest<A, E>(
    title: string,
    detailsOrBody: TestDetails | EffectTestFunction<Args, A, E, R>,
    possibleBody?: EffectTestFunction<Args, A, E, R>,
  ): void {
    const details =
      typeof detailsOrBody === "function" ? undefined : detailsOrBody;
    const body =
      typeof detailsOrBody === "function" ? detailsOrBody : possibleBody;
    if (body === undefined) {
      throw new TypeError("effect-playwright/test: missing Effect test body");
    }

    const wrapped = (args: Args, testInfo: TestInfo): Promise<void> => {
      const runner = activeRunners.get(testInfo);
      if (runner === undefined || runner.closed) {
        return Promise.reject(new Error(noActiveRuntimeMessage));
      }

      const program = transform(
        Effect.suspend(() => body(args, testInfo)),
      ).pipe(Effect.provide(runner.context), Effect.scoped, Effect.asVoid);
      const promise = runPromise(program, runner.abortController.signal);
      runner.running.add(promise);
      void promise.then(
        () => runner.running.delete(promise),
        () => runner.running.delete(promise),
      );
      return promise;
    };
    Object.defineProperty(wrapped, "toString", {
      value: () => body.toString(),
    });
    register(title, details, wrapped);
  }
  return effectTest;
};

type EffectRegistration<Args extends object> = {
  (
    title: string,
    body: (args: Args, testInfo: TestInfo) => Promise<void>,
  ): void;
  (
    title: string,
    details: TestDetails,
    body: (args: Args, testInfo: TestInfo) => Promise<void>,
  ): void;
};

const makeTester = <Args extends object, R>(
  effectTestType: TestType<Args & InternalFixtures, object>,
  transform: EffectTransform<R>,
): EffectTester<Args, R> => {
  const makeRegistration = (
    method: EffectRegistration<Args & InternalFixtures>,
  ): EffectTest<Args, R> =>
    makeEffectTest((title, details, body) => {
      if (details === undefined) {
        method(title, body);
      } else {
        method(title, details, body);
      }
    }, transform);

  const tester = makeRegistration(effectTestType);
  const fail = makeRegistration(effectTestType.fail) as EffectTester<
    Args,
    R
  >["fail"];
  Object.defineProperties(fail, {
    only: { value: makeRegistration(effectTestType.fail.only) },
  });
  Object.defineProperties(tester, {
    only: { value: makeRegistration(effectTestType.only) },
    skip: { value: makeRegistration(effectTestType.skip) },
    fixme: { value: makeRegistration(effectTestType.fixme) },
    fail: { value: fail },
  });
  return tester as EffectTester<Args, R>;
};

const makeLayer = <T extends object, W extends object, R, E>(
  testType: TestType<T, W>,
  effectTestType: TestType<T & W & InternalFixtures, object>,
  layer: Layer.Layer<R, E>,
  options?: LayerOptions,
): LayerRegistration<T, W, R> => {
  const memoMap = options?.memoMap ?? Effect.runSync(Layer.makeMemoMap);
  const scope = Effect.runSync(Scope.make());
  const runtimeEffect = Layer.toRuntimeWithMemoMap(layer, memoMap).pipe(
    Scope.extend(scope),
    Effect.orDie,
    Effect.cached,
    Effect.runSync,
  );
  const transform: EffectTransform<R> = (effect) =>
    Effect.flatMap(runtimeEffect, (runtime) => Effect.provide(effect, runtime));
  const tester = makeTester<T & W, R>(effectTestType, transform);

  const makeLayerMethods = (): LayerTestMethods<T, W, R> => {
    const layerTest = testType.bind(undefined);
    Object.assign(layerTest, testType);
    const nestedLayer = <R2, E2>(
      nested: Layer.Layer<R2, E2, R>,
      nestedOptions?: NestedLayerOptions,
    ): LayerRegistration<T, W, R | R2> =>
      makeLayer(testType, effectTestType, Layer.provideMerge(nested, layer), {
        memoMap,
        timeout: nestedOptions?.timeout,
      });
    Object.defineProperties(layerTest, {
      effect: { value: tester },
      layer: { value: nestedLayer },
      scoped: { value: tester },
    });
    return layerTest as LayerTestMethods<T, W, R>;
  };

  const registerHooks = (): void => {
    testType.beforeAll(
      // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring.
      async ({}, testInfo) => {
        if (options?.timeout !== undefined) {
          testInfo.setTimeout(Duration.toMillis(options.timeout));
        }
        await runPromise(Effect.asVoid(runtimeEffect));
      },
    );
    testType.afterAll(
      // biome-ignore lint/correctness/noEmptyPattern: Playwright requires fixture object destructuring.
      async ({}, testInfo) => {
        if (options?.timeout !== undefined) {
          testInfo.setTimeout(Duration.toMillis(options.timeout));
        }
        await runPromise(Scope.close(scope, Exit.void));
      },
    );
  };

  function register(f: (test: LayerTestMethods<T, W, R>) => void): void;
  function register(
    name: string,
    f: (test: LayerTestMethods<T, W, R>) => void,
  ): void;
  function register(
    nameOrFunction: string | ((test: LayerTestMethods<T, W, R>) => void),
    possibleFunction?: (test: LayerTestMethods<T, W, R>) => void,
  ): void {
    if (typeof nameOrFunction === "function") {
      testType.describe(() => {
        registerHooks();
        nameOrFunction(makeLayerMethods());
      });
      return;
    }
    if (possibleFunction === undefined) {
      throw new TypeError("effect-playwright/test: missing layer test body");
    }
    testType.describe(nameOrFunction, () => {
      registerHooks();
      possibleFunction(makeLayerMethods());
    });
  }

  return register;
};

/**
 * Adds Effect-based test methods to a Playwright `TestType`.
 *
 * Call `makeMethods` after `test.extend(...)` or `mergeTests(...)`, because those
 * APIs return a new `TestType`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @example
 * ```ts
 * import { test as base } from "@playwright/test";
 * import { Effect } from "effect";
 * import { expect, makeMethods } from "effect-playwright/test";
 *
 * const test = makeMethods(
 *   base.extend<{ answer: number }>({
 *     answer: async ({}, use) => use(42),
 *   }),
 * );
 *
 * test.effect("uses a custom fixture", ({ answer }) =>
 *   Effect.sync(() => expect(answer).toBe(42)),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export const makeMethods: <
  T extends Pick<PlaywrightTestArgs, "context" | "page">,
  W extends Pick<PlaywrightWorkerArgs, "browser">,
>(
  testType: TestType<T, W>,
) => TestMethods<T, W> = <
  T extends Pick<PlaywrightTestArgs, "context" | "page">,
  W extends Pick<PlaywrightWorkerArgs, "browser">,
>(
  testType: TestType<T, W>,
): TestMethods<T, W> => {
  const cached = augmentedTesters.get(testType);
  if (cached !== undefined) {
    return testType as TestMethods<T, W>;
  }
  if (Object.hasOwn(testType, "effect") || Object.hasOwn(testType, "layer")) {
    const method = Object.hasOwn(testType, "effect") ? "effect" : "layer";
    throw new Error(
      `effect-playwright/test: the supplied TestType already defines "${method}"`,
    );
  }

  const internalFixtures = {
    _effectPlaywrightRuntime: [
      async (
        { browser, context, page }: T & W & InternalFixtures,
        use: (runner: EffectRunner) => Promise<void>,
        testInfo: TestInfo,
      ) => {
        const runner: EffectRunner = {
          abortController: new AbortController(),
          closed: false,
          context: Context.mergeAll(
            Context.make(Browser, Browser.make(browser)),
            Context.make(BrowserContext, BrowserContext.make(context)),
            Context.make(Page, Page.make(page)),
          ),
          running: new Set(),
        };
        activeRunners.set(testInfo, runner);
        try {
          await use(runner);
        } finally {
          runner.closed = true;
          runner.abortController.abort();
          await Promise.allSettled([...runner.running]);
          activeRunners.delete(testInfo);
        }
      },
      { auto: true, box: true, timeout: 0 },
    ],
    // biome-ignore lint/complexity/noBannedTypes: Matches Playwright's empty worker fixture type.
  } as unknown as Fixtures<InternalFixtures, {}, T, W>;
  const effectTestType = testType.extend<InternalFixtures>(internalFixtures);
  const typedEffectTestType = effectTestType as TestType<
    T & W & InternalFixtures,
    object
  >;
  const tester = makeTester<T & W, never>(typedEffectTestType, withoutLayer);
  const layerMethod: LayerMethod<T, W> = (layer, options) =>
    makeLayer(testType, typedEffectTestType, layer, options);
  augmentedTesters.set(testType, tester as EffectTester<object>);
  Object.defineProperties(testType, {
    effect: { value: tester },
    layer: { value: layerMethod },
  });
  return testType as TestMethods<T, W>;
};

/**
 * The standard Playwright Test API enhanced with Effect test and layer methods.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export const test = makeMethods(playwrightTest);

/**
 * Shares an Effect `Layer` between Playwright tests in the current worker.
 *
 * The layer is acquired before the tests in the block and released after all
 * tests in the block finish. Passing a name wraps the tests in a Playwright
 * `describe` block. Layers can be nested and reuse their parent services.
 *
 * @example
 * ```ts
 * import { Context, Effect, Layer } from "effect";
 * import { expect, layer } from "effect-playwright/test";
 *
 * class Greeting extends Context.Tag("Greeting")<Greeting, string>() {}
 *
 * layer(Layer.succeed(Greeting, "hello"))("Greeting", (it) => {
 *   it.effect("provides the layer", () =>
 *     Effect.gen(function* () {
 *       expect(yield* Greeting).toBe("hello");
 *     }),
 *   );
 * });
 * ```
 *
 * @see https://playwright.dev/docs/api/class-test#test-before-all
 * @since 0.6.0
 */
export const layer: LayerMethod<PlaywrightTestArgs, PlaywrightWorkerArgs> =
  test.layer;

/**
 * Standalone alias for `test.effect`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Page } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* Page;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export const effect = test.effect;

export default test;
