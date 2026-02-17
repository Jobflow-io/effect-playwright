---
name: verify-playwright-method-throws
description: Analyze a Playwright method's source code to determine if it can throw errors (sync or async).
---

## What I do
I perform a deep analysis of a Playwright method's implementation to determine if it can throw an error. This involves tracing execution paths, checking for asynchronous operations (IPC calls), and identifying explicit `throw` statements or validations.

## When to use me
Use this skill when you need to decide whether a Playwright method should be wrapped in an `Effect` (if it can throw) or mapped 1:1 (if it is guaranteed safe).

## Procedure

### 1. Locate the Implementation
Find the method definition in the Playwright codebase.
- **Client-side Logic**: `context/playwright/packages/playwright-core/src/client/` (e.g., `page.ts`, `locator.ts`).
- **Protocol Definition**: `context/playwright/packages/protocol/src/protocol.yml` (can help identify commands).

### 2. Analyze Direct Implementation
Examine the method body.

- **Async / Promise-returning**:
    - Does it return a `Promise`?
    - Does it use `await`?
    - **Verdict**: Almost always **CAN THROW** (network errors, timeouts, target closed).

- **Synchronous**:
    - Does it contain `throw new Error(...)`?
    - Does it call other methods that might throw synchronously?
    - Does it validate arguments? (e.g., `assert(...)`, checks on `options`).

### 3. Trace Deep Calls (The "Deep Check")
If the method calls other internal methods, trace them.

- **IPC Calls**: Does it call `this._channel.send(...)` or similar?
    - **Verdict**: **CAN THROW** (connection issues, server-side errors).
- **Frame/Context Delegation**: Does it delegate to `this._mainFrame` or `this._context`?
    - **Action**: Check the implementation of the delegated method in `frame.ts` or `browserContext.ts`.
- **Utility Functions**: Does it call helpers like `assertMaxArguments`, `parseResult`, `serializeArgument`?
    - **Verdict**: These can throw validation errors.

### 4. Classify the Method

Based on the analysis, classify the method into one of two categories:

#### A. **Guaranteed Safe (Cannot Throw)**
- **Criteria**:
    - Synchronous.
    - No `throw` statements.
    - No calls to methods that throw.
    - No IPC / Protocol usage.
    - Pure data access (e.g., returning a private field, creating a wrapper).
- **Examples**:
    - `page.url()` (returns a string from local state).
    - `page.locator(...)` (creates a locator object).
    - `page.viewportSize()` (returns cached size).
- **Result**: **Map 1:1**. Do not wrap in Effect.

#### B. **Can Throw (Unsafe)**
- **Criteria**:
    - Returns a `Promise` (Async).
    - Performs IPC / Network calls.
    - Contains explicit validation that throws `Error`.
    - Accesses resources that might be closed/destroyed.
- **Examples**:
    - `page.click(...)` (Async, IPC).
    - `page.title()` (Async, IPC - even if it seems like a property).
    - `page.evaluate(...)` (Async, script execution).
    - `locator.elementHandle()` (Async).
- **Result**: **Wrap in `Effect<T, PlaywrightError>`**.

## Output Format
When reporting the result of this skill, please provide:
1.  **Method Name**: The method analyzed.
2.  **File Location**: Where the implementation was found.
3.  **Analysis**: Brief explanation of the code path (e.g., "Calls `this._channel.click`, which is an IPC call").
4.  **Conclusion**: "Can Throw" or "Cannot Throw".
