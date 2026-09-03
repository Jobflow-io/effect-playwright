# Effect-Playwright Agent Guidelines

This repository contains an Effect-based wrapper for Playwright. Follow these guidelines when writing code.

## 1. Build, Test, and Lint Commands

Use `pnpm` for all package management tasks.

- **Install Dependencies:** `pnpm install`
- **Build:** `pnpm build` (uses `tsdown`)
- **Run All Tests:** `pnpm test` (uses `vitest`)
- **Run Single Test File:** `pnpm test src/path/to/test.ts`
- **Type Check:** `pnpm type-check` (runs `tsc --noEmit`)
- **Check (Lint/Format):** `pnpm check` (runs `biome check --fix`)
- **Format:** `pnpm format` (uses `biome format --fix`)
- **Generate Docs:** `pnpm generate-docs`

## 2. Code Style & Conventions

### General Architecture

- **Effect-First:** All asynchronous operations must be wrapped in `Effect`.
- **Services:** Each service module exports a same-named interface and `Context.Service` value (for example, `Browser`). Core wrapper functionality is grouped under the `Playwright` namespace, where `Playwright.Browser` and similar names work in both type and value positions. Scoped browser provisioning is grouped under `PlaywrightSpawner`.
- **Constructors:** Wrap native Playwright objects with named functions such as `makeBrowser` and `makePage`. Do not add `*Service` aliases or static constructors on service values.
- **Resource Management:** Rely on Effect's `Scope` for automatic resource cleanup (browsers, contexts).

### Imports

- **Effect:** Import widely used modules from `effect` (e.g., `Effect`, `Context`, `Stream`).
- **Playwright:** Import types from `playwright-core`.
- **Internal:** Use relative imports (e.g., `./common`, `./errors`).
- **Public API:** Re-export canonical service names and named constructors directly from `src/playwright-api.ts`; do not add import-and-alias mappings. Consumers import the namespaces `Playwright` and `PlaywrightSpawner` from `effect-playwright`. Do not reintroduce top-level wrapper exports, `*Service` aliases, or the old `Environment` name.

### Error Handling

- **Typed Errors:** Use `PlaywrightError` for Playwright-related failures.
- **Return Types:** Methods that can throw should return `Effect.Effect<T, PlaywrightError>`.
- **Avoid Throwing:** Do not throw exceptions ever; utilize Effect's error handling.

### Documentation

- Use TSDoc for all public exports.
- Include `@since x.y.z` tags.
- Include `@example` blocks showing usage. Prefer runnable full examples over snippets.
- Link to underlying Playwright docs using `@see`.

## 3. Testing Guidelines

- **Framework:** Use `@effect/vitest` and `vitest`.
- **Structure:**

  ```typescript
  import { assert, layer } from "@effect/vitest";
  import { Effect } from "effect";
  import { Playwright, PlaywrightSpawner, chromium } from "effect-playwright";

  // Use the PlaywrightSpawner layer
  layer(PlaywrightSpawner.layer(chromium))("Suite Name", (it) => {
    it.scoped("should do something", () =>
      Effect.gen(function* () {
        const browser = yield* Playwright.Browser;
        const page = yield* browser.newPage();
        // ... test logic
        assert.strictEqual(1, 1);
      }).pipe(PlaywrightSpawner.withBrowser),
    );
  });
  ```

- **Assertions:** Use `assert` from `@effect/vitest`.
- **Scopes:** Use `it.scoped` for tests that require a scope.

## 4. Experimental Features

- Features in `src/experimental/` may have different stability guarantees but should follow the same coding standards.
