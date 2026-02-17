---
name: implement-playwright-method
description: Implement a Playwright method in effect-playwright by analyzing source code and mapping types
---

## What I do

I guide you through implementing a Playwright method in the `effect-playwright` library. This involves analyzing the original Playwright source code to determine behavior (throwing vs. non-throwing) and mapping types to the Effect ecosystem (Effect, Option, Stream).

## When to use me

Use this skill when you need to add a missing method to `effect-playwright` or update an existing one.

## Procedure

### 1. Locate Playwright Source Code

First, find the implementation of the method in the Playwright codebase to understand its behavior.

- Look in `context/playwright/packages/playwright-core/src/client/`.
- Common files: `page.ts`, `locator.ts`, `browser.ts`, `frame.ts`, `elementHandle.ts`.

### 2. Analyze the Method

Determine if the method can throw and what it returns. **Do not blindly follow existing patterns in `effect-playwright` if they wrap safe synchronous methods in Effects.**

#### Can it throw?

- **Async / Promise-based**: If the method returns a `Promise`, it interacts with the Playwright server and **can throw** (e.g., timeouts, target closed).
  - **Mapping**: Map to `Effect<Return, PlaywrightError>`.
- **Sync but Unsafe**: If a synchronous method performs validation or logic that explicitly throws errors.
  - **Mapping**: Map to `Effect<Return, PlaywrightError>` (using `Effect.sync` or `Effect.try`).
- **Sync and Safe**: If the method purely returns a property or creates a new object without side effects or throwing (e.g., `url()`, `locator()`, `getByRole()`).
  - **Mapping**: **Map 1:1**. Return the value directly. Do NOT wrap in `Effect`.
  - **Preference**: Prefer 1:1 mappings over abstractions like getters. If Playwright uses a method `page.url()`, use `page.url()` in the effect wrapper, not a getter `page.url`.

#### Return Type Mapping

- **`Promise<T>`** -> `Effect<T, PlaywrightError>`
- **`Promise<void>`** -> `Effect<void, PlaywrightError>`
- **`T` (Safe Sync)** -> `T` (Direct return)
- **`T` (Factory)** -> `Wrapper<T>` (e.g., `PlaywrightLocator.Service`)
- **`T | null`** -> `Option<T>` (if sync) or `Effect<Option<T>, PlaywrightError>` (if async)
- **Playwright Object (e.g., `Page`)** -> **Wrapped Object (e.g., `PlaywrightPage`)**

### 3. Define the Interface

Add the method to the Service interface in the corresponding `src/X.ts` file (e.g., `PlaywrightPageService` in `src/page.ts`).

**Example (Async Method - Throws):**

```typescript
/**
 * Click the element.
 * @see {@link Page.click}
 */
readonly click: (
  selector: string,
  options?: Parameters<Page["click"]>[1]
) => Effect.Effect<void, PlaywrightError>;
```

**Example (Sync Factory - Safe):**

```typescript
/**
 * Creates a locator.
 * @see {@link Page.locator}
 */
readonly locator: (
  selector: string,
  options?: Parameters<Page["locator"]>[1]
) => typeof PlaywrightLocator.Service;
```

**Example (Sync Method - Safe):**

```typescript
/**
 * Returns the page URL.
 * @see {@link Page.url}
 */
readonly url: () => string;
```

**Example (Nullable Return):**

```typescript
/**
 * Returns the text content (Async).
 * @see {@link Locator.textContent}
 */
readonly textContent: Effect.Effect<Option.Option<string>, PlaywrightError>;
```

### 4. Implement the Method

Implement the method in the `make` function of the implementation class (e.g., `PlaywrightPage.make`).

- **Async Methods**: Use `useHelper(originalObject)`.

  ```typescript
  click: (selector, options) => use((p) => p.click(selector, options)),
  ```

- **Sync Safe Methods**: Return directly.

  ```typescript
  url: () => page.url(),
  ```

- **Factories**: Return the wrapped object directly.

  ```typescript
  locator: (selector, options) => PlaywrightLocator.make(page.locator(selector, options)),
  ```

- **Nullable Returns**: Use `Option.fromNullable`.

  ```typescript
  // Async nullable
  textContent: use((l) => l.textContent()).pipe(
    Effect.map(Option.fromNullable)
  ),

  // Sync nullable safe
  attribute: (name) => Option.fromNullable(element.getAttribute(name)),
  ```

- **Returning Playwright Objects**: Wrap them.
  ```typescript
  // Async returning object (e.g., waitForEvent returning a Page)
  waitForPopup: use((p) => p.waitForEvent("popup")).pipe(
    Effect.map(PlaywrightPage.make)
  ),
  ```

### 5. Verify

- Ensure types match `PlaywrightXService`.
- Run `npm run typecheck` (or equivalent) to verify implementation.
