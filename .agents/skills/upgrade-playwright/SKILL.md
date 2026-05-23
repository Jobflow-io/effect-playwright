---
name: upgrade-playwright
description: Upgrade playwright-core and update effect-playwright to match new APIs and breaking changes.
---

# Upgrade Playwright Skill

This skill guides you through upgrading the `playwright-core` dependency and ensuring `effect-playwright` stays up to date with new APIs and breaking changes.

## Process

### 1. Check for Updates

First, determine if an update is available and what the versions are.

Use `pnpm outdated playwright-core` for this.

### 2. Analyze Release Notes

Research the changes between the current version and the target version using the official raw markdown source for the best accuracy.

- **URL:** `https://raw.githubusercontent.com/microsoft/playwright/main/docs/src/release-notes-js.md`
- **Method:** Fetch the URL above.
- **Analysis:** 
    - Extract sections for all versions between your current version and the target version (inclusive).
    - Focus on headings: `Breaking Changes ⚠️`, `New APIs`, and `Deprecations`.
    - Note changes to specific classes (e.g., `Page`, `Locator`, `BrowserContext`).

### 3. Update Dependencies

Update the version in `package.json`. Make sure to update BOTH `playwright-core` and the `playwright` dev dependency (if present) to the same version to ensure browser binaries match the library.

```bash
pnpm add playwright-core@latest
pnpm add -D playwright@latest
pnpm exec playwright install
```

### 4. Identify Required Changes

#### A. Breaking Changes & Deprecations
- Search the codebase for any APIs mentioned in the "Breaking Changes" or "Deprecated" sections.
- Use `rg` to find usages.

#### B. New APIs
- Systematically check the `New APIs` section of the release notes.
- For each new method on a core class (`Page`, `Browser`, etc.), check if `effect-playwright` should expose it.
- Use `ls src` to find the corresponding wrapper file.
- Use `rg` to see if the method is already implemented.
- **Note on API Design:** If an existing property-like wrapper (e.g., `readonly consoleMessages: Effect<...>`) now has options in Playwright, convert it to a method (e.g., `readonly consoleMessages: (options?) => Effect<...>`).

### 5. Implementation

* **Create New Wrappers:** For significant new namespaces (e.g., `Screencast`), create a new file (e.g., `src/screencast.ts`) and expose it through the parent service.
* **Fix Breakages:** Address any type errors or removed APIs.
* **Update Tests:** Check `src/*.test.ts` for any tests that broke due to API changes (especially property-to-method conversions).
* **Add New APIs:** Systematically add wrappers for new Playwright methods.
* **Update Docs:** If any global defaults changed, update the relevant documentation.
* **Use Subagents:** For complex migrations or large sets of new APIs, delegate to subagents using the `implement-playwright-method` skill.

### 6. Verification

- Run `pnpm exec biome check --write .` to ensure code style and lint rules are followed.
- Run `pnpm type-check`.
- Run `pnpm test` to ensure no regressions.
- Ensure no temporary files remain
- Do NOT commit unless explicitly requested

## Common Gotchas

- **Browser Binary Mismatch:** If tests fail with "Executable doesn't exist", you likely updated `playwright-core` but not `playwright`, or forgot to run `pnpm exec playwright install`.
- **New Namespaces:** Large additions like `Page.screencast` should be their own Service and Tag, following the pattern of `PlaywrightClock` or `PlaywrightKeyboard`.

## Example: Analyzing 1.60.0

If upgrading to 1.60.0, the release notes mention:
- `locator.drop()`: New method.
- `browser.on('context')`: New event.
- `BrowserContext` mirrors lifecycle events.
- `Locator.ariaRef()` removed.

You would then:
1. `rg "ariaRef" src` to see if we wrapped it (and remove if so).
2. Use `implement-playwright-method` to add `drop` to `src/locator.ts`.
3. Check if we need to expose the new events in `BrowserContext`.
