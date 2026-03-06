# Changelog

All notable changes to this project will be documented in this file.

## 2.0.1

### Fixes

- Changed `PlaywrightRequest.frame` and `PlaywrightResponse.frame` to correctly return `Effect.Effect<PlaywrightFrameService, PlaywrightError>` and safely catch synchronous errors (e.g., for Service Worker requests).
- Changed `BrowserContext.pages` from an `Effect` property to a synchronous method (`pages()`) returning an array, since it does not throw errors.
- Changed `PlaywrightPage.setDefaultNavigationTimeout` and `PlaywrightPage.setDefaultTimeout` from `Effect` methods to synchronous methods, since they do not throw errors.

## 0.3.0

### ⚠️ Breaking Changes

- **Synchronous Safe Methods (Unwrapped Effects)**: To improve developer experience and align with Playwright, simple Playwright getters and safe methods that cannot fail have been unwrapped from `Effect` and are now completely synchronous. 
  - **Impact**: Any previous code that used `yield*` or `Effect.run*` on these methods will now result in type errors. You should now call them as regular synchronous methods without `yield*`.
  - **Affected Models and Methods**:
    - `PlaywrightBrowser`: `browserType()`, `contexts()`, `isConnected()`, `version()`
    - `PlaywrightDialog`: `defaultValue()`, `message()`, `type()`
    - `PlaywrightDownload`: `suggestedFilename()`, `url()`
    - `PlaywrightFileChooser`: `isMultiple()`
    - `PlaywrightFrame`: `name()`, `url()`
    - `PlaywrightPage`: `url()`
    - `PlaywrightRequest`: `headers()`, `isNavigationRequest()`, `method()`, `resourceType()`, `timing()`, `url()`
    - `PlaywrightResponse`: `fromServiceWorker()`, `headers()`, `ok()`, `status()`, `statusText()`, `url()`
    - `PlaywrightWorker`: `url()`

### Features

- **Page Methods Implementation**: Implemented a significant portion of the `PlaywrightPage` API, including:
  - `addInitScript`
  - `addScriptTag`
  - `addStyleTag`
  - `bringToFront`
  - `consoleMessages`
  - `content`
  - `context`
  - `dragAndDrop`
  - `emulateMedia`
  - `exposeFunction`
  - `frame`, `mainFrame`, and `opener`
  - `getBy*` locators
  - `goBack` and `goForward`
  - `isClosed`
  - `pageErrors`
  - `pause`
  - `pdf`
  - `requestGC`
  - `screenshot`
  - `setContent`
  - `set*` setters
  - `viewportSize`
  - `workers`
- **Input & Device Capabilities**: Added `keyboard`, `mouse`, `touchscreen`, and `clock` functionality to `Page`.

### Fixes

- Fixed `@since` docstrings across the codebase.
- Assorted linting fixes.

### Chores & Internal Tooling

- Updated dependencies (`pnpm update`).
- Added internal coverage scripts utilizing `Effect` to categorize methods.
- Expanded agent documentation (`agents.md`) and instructions.
