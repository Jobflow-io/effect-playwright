# Changelog

All notable changes to this project will be documented in this file.

## 0.7.0

### Breaking Changes

- **Namespaced Playwright API**: All wrapper tags, canonical service types, model classes, option types, and errors now live under the root `Playwright` namespace. Tags and service types share names, so `Playwright.Browser`, `Playwright.Page`, and the other service names work in both value and type positions. Implementation-only `*Service` names are no longer exported, and wrapper constructors use names such as `Playwright.makeBrowser` and `Playwright.makePage` instead of static `make` methods. Browser engine exports remain top-level.
- **PlaywrightSpawner**: Renamed the experimental `Environment` namespace and service to `PlaywrightSpawner`. Use `PlaywrightSpawner.PlaywrightSpawner`, `PlaywrightSpawner.layer`, and `PlaywrightSpawner.withBrowser`.


## 0.6.0

### Features

- **Playwright Test Shared Layers**: Added `layer` and `test.layer` to `effect-playwright/test`, with worker-scoped acquisition, nested layer composition, shared memoization, and custom fixture support.

## 0.5.0

### ⚠️ Breaking Changes

- **Page Property-to-Method Conversions**: Converted `PlaywrightPage.consoleMessages` and `PlaywrightPage.pageErrors` from simple `Effect` properties to methods taking optional options parameters, resolving to `Effect.Effect<...>` to align with playwright-core 1.60.
  - **Impact**: Any code utilizing these as properties (e.g. `const messages = yield* page.consoleMessages`) will now cause type errors. They must be called as methods (e.g. `const messages = yield* page.consoleMessages()`).

### Features

- **Playwright 1.60.0 Upgrade**: Upgraded underlying `playwright-core` and development dependency `playwright` to version `1.60.0`.
- **Re-exported Browser Creators**: Re-exported `chromium`, `firefox`, and `webkit` directly from `effect-playwright`, allowing users to import them directly from the library rather than needing `playwright-core`.
- **CLI Wrapper**: Added an `effect-playwright` CLI wrapper which forwards commands directly to the `playwright-core` CLI.
- **New Tracing Service**: Added `PlaywrightTracing` and `PlaywrightTracingService` to provide structured tracing capabilities on `PlaywrightBrowserContext`.
- **New Screencast Service**: Added `PlaywrightScreencast` and `PlaywrightScreencastService` to provide structured screencast recording capabilities on `PlaywrightPage`.
- **Expanded Page Methods**: Implemented and wrapped additional `Page` APIs:
  - `hideHighlight` - Clears all element highlights.
  - `clearConsoleMessages` - Clears stored console messages.
  - `clearPageErrors` - Clears stored page errors.
  - `requests` - Returns the most recent network requests.
  - `pickLocator` - Enters interactive locator picking mode.
  - `cancelPickLocator` - Cancels locator picking mode.
  - `ariaSnapshot` - Captures the ARIA snapshot of the page.
- **Expanded Locator Methods**: Implemented and wrapped additional `Locator` APIs:
  - `hideHighlight` - Hides the element highlight previously added by highlight.
  - `drop` - Drops the locator.
  - `normalize` - Normalizes the locator.
  - Updated `highlight` to accept optional options parameter.
- **Expanded Browser & Context Methods**: Implemented and wrapped additional APIs:
  - Added `bind` and `unbind` to `PlaywrightBrowser`.
  - Added `setStorageState` to `PlaywrightBrowserContext`.
- **New Event Streams**: Added several new event mappings:
  - Added the `context` event stream to `PlaywrightBrowser` (maps to `PlaywrightBrowserContext`).
  - Added `download` (maps to `PlaywrightDownload`), `frameattached`, `framedetached`, `framenavigated` (map to `PlaywrightFrame`), and `pageclose`, `pageload` (map to `PlaywrightPage`) event streams to `PlaywrightBrowserContext`.

## 0.4.0

### Fixes

- Changed `PlaywrightRequest.frame` and `PlaywrightResponse.frame` to correctly return `Effect.Effect<PlaywrightFrameService, PlaywrightError>` and safely catch synchronous errors (e.g., for Service Worker requests).
- Changed `BrowserContext.pages` from an `Effect` property to a synchronous method (`pages()`) returning an array, since it does not throw errors.
- Changed `PlaywrightPage.setDefaultNavigationTimeout` and `PlaywrightPage.setDefaultTimeout` from `Effect` methods to synchronous methods, since they do not throw errors.

Minor bump because these are technically breaking changes.

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
