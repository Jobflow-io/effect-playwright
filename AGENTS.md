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
- **Services:** Public functionality is grouped under the `Playwright` namespace. Runtime tags and service types share names (e.g., `Playwright.Page` and `Playwright.Browser`).
- **Resource Management:** Rely on Effect's `Scope` for automatic resource cleanup (browsers, contexts).

### Imports

- **Effect:** Import widely used modules from `effect` (e.g., `Effect`, `Context`, `Stream`).
- **Playwright:** Import types from `playwright-core`.
- **Internal:** Use relative imports (e.g., `./common`, `./errors`).
- **Public API:** Import wrapper APIs through `Playwright` from `effect-playwright`. Import the experimental browser spawner through `PlaywrightSpawner` from `effect-playwright/experimental`. Do not reintroduce top-level wrapper exports or the old `Environment` name.

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
  import { Playwright, chromium } from "effect-playwright";
  import { PlaywrightSpawner } from "effect-playwright/experimental";

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

- Features in `src/experimental/` may have different stability guarantees but should follow the same coding standards. The browser-spawning service lives in `src/experimental/playwright-spawner.ts` and is exported as `PlaywrightSpawner`.
