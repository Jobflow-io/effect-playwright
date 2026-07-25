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
import { Cause, Context, Effect, Exit, Logger, type Scope } from "effect";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightBrowserContext } from "./browser-context";
import { PlaywrightPage } from "./page";

export * from "@playwright/test";

/**
 * Services available to an Effect-based Playwright test.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type PlaywrightTestEnvironment =
  | PlaywrightBrowser
  | PlaywrightBrowserContext
  | PlaywrightPage
  | Scope.Scope;

/**
 * An Effect-returning Playwright Test callback.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type EffectTestFunction<Args extends object, A, E> = (
  args: Args,
  testInfo: TestInfo,
) => Effect.Effect<A, E, PlaywrightTestEnvironment>;

/**
 * Registers Effect-based Playwright tests.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export interface EffectTest<Args extends object> {
  <A, E>(title: string, body: EffectTestFunction<Args, A, E>): void;
  <A, E>(
    title: string,
    details: TestDetails,
    body: EffectTestFunction<Args, A, E>,
  ): void;
}

/**
 * Effect-based Playwright test registration and modifiers.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-annotations
 * @since 0.6.0
 */
export interface EffectTester<Args extends object> extends EffectTest<Args> {
  readonly only: EffectTest<Args>;
  readonly skip: EffectTest<Args>;
  readonly fixme: EffectTest<Args>;
  readonly fail: EffectTest<Args> & { readonly only: EffectTest<Args> };
}

/**
 * A Playwright `TestType` enhanced with Effect-based registration methods.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
 *     yield* page.goto("data:text/html,<title>Effect</title>");
 *     expect(yield* page.title).toBe("Effect");
 *   }),
 * );
 * ```
 *
 * @see https://playwright.dev/docs/test-fixtures
 * @since 0.6.0
 */
export type PlaywrightTestMethods<
  T extends object,
  W extends object,
> = TestType<T, W> & { readonly effect: EffectTester<T & W> };

interface EffectRunner {
  readonly abortController: AbortController;
  readonly context: Context.Context<
    Exclude<PlaywrightTestEnvironment, Scope.Scope>
  >;
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
  signal: AbortSignal,
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

const makeEffectTest = <Args extends object>(
  register: (
    title: string,
    details: TestDetails | undefined,
    body: (args: Args, testInfo: TestInfo) => Promise<void>,
  ) => void,
): EffectTest<Args> => {
  function effectTest<A, E>(
    title: string,
    body: EffectTestFunction<Args, A, E>,
  ): void;
  function effectTest<A, E>(
    title: string,
    details: TestDetails,
    body: EffectTestFunction<Args, A, E>,
  ): void;
  function effectTest<A, E>(
    title: string,
    detailsOrBody: TestDetails | EffectTestFunction<Args, A, E>,
    possibleBody?: EffectTestFunction<Args, A, E>,
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

      const program = Effect.suspend(() => body(args, testInfo)).pipe(
        Effect.provide(runner.context),
        Effect.scoped,
        Effect.asVoid,
      );
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

const makeTester = <Args extends object>(
  effectTestType: TestType<Args & InternalFixtures, object>,
): EffectTester<Args> => {
  const makeRegistration = (
    method: EffectRegistration<Args & InternalFixtures>,
  ): EffectTest<Args> =>
    makeEffectTest((title, details, body) => {
      if (details === undefined) {
        method(title, body);
      } else {
        method(title, details, body);
      }
    });

  const tester = makeRegistration(effectTestType);
  const fail = makeRegistration(
    effectTestType.fail,
  ) as EffectTester<Args>["fail"];
  Object.defineProperties(fail, {
    only: { value: makeRegistration(effectTestType.fail.only) },
  });
  Object.defineProperties(tester, {
    only: { value: makeRegistration(effectTestType.only) },
    skip: { value: makeRegistration(effectTestType.skip) },
    fixme: { value: makeRegistration(effectTestType.fixme) },
    fail: { value: fail },
  });
  return tester as EffectTester<Args>;
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
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
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
) => PlaywrightTestMethods<T, W> = <
  T extends Pick<PlaywrightTestArgs, "context" | "page">,
  W extends Pick<PlaywrightWorkerArgs, "browser">,
>(
  testType: TestType<T, W>,
): PlaywrightTestMethods<T, W> => {
  const cached = augmentedTesters.get(testType);
  if (cached !== undefined) {
    return testType as PlaywrightTestMethods<T, W>;
  }
  if (Object.hasOwn(testType, "effect")) {
    throw new Error(
      'effect-playwright/test: the supplied TestType already defines "effect"',
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
            Context.make(PlaywrightBrowser, PlaywrightBrowser.make(browser)),
            Context.make(
              PlaywrightBrowserContext,
              PlaywrightBrowserContext.make(context),
            ),
            Context.make(PlaywrightPage, PlaywrightPage.make(page)),
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
  const tester = makeTester<T & W>(
    effectTestType as TestType<T & W & InternalFixtures, object>,
  );
  augmentedTesters.set(testType, tester as EffectTester<object>);
  Object.defineProperty(testType, "effect", { value: tester });
  return testType as PlaywrightTestMethods<T, W>;
};

/**
 * The standard Playwright Test API enhanced with `test.effect`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
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
 * Standalone alias for `test.effect`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { PlaywrightPage } from "effect-playwright";
 * import { expect, test } from "effect-playwright/test";
 *
 * test.effect("loads a page", () =>
 *   Effect.gen(function* () {
 *     const page = yield* PlaywrightPage;
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
