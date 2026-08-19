import { assert, describe, it } from "@effect/vitest";
import { Playwright } from "effect-playwright";
import { PlaywrightSpawner } from "effect-playwright/experimental";

const tags = [
  [Playwright.Browser, "effect-playwright/browser/Browser"],
  [
    Playwright.BrowserContext,
    "effect-playwright/browser-context/BrowserContext",
  ],
  [Playwright.Clock, "effect-playwright/clock/Clock"],
  [Playwright.Credentials, "effect-playwright/credentials/Credentials"],
  [Playwright.FrameLocator, "effect-playwright/frame-locator/FrameLocator"],
  [Playwright.Frame, "effect-playwright/frame/Frame"],
  [Playwright.Keyboard, "effect-playwright/keyboard/Keyboard"],
  [Playwright.Locator, "effect-playwright/locator/Locator"],
  [Playwright.Mouse, "effect-playwright/mouse/Mouse"],
  [Playwright.Page, "effect-playwright/page/Page"],
  [Playwright.Playwright, "effect-playwright/playwright/Playwright"],
  [Playwright.Screencast, "effect-playwright/screencast/Screencast"],
  [Playwright.Touchscreen, "effect-playwright/touchscreen/Touchscreen"],
  [Playwright.Tracing, "effect-playwright/tracing/Tracing"],
  [Playwright.WebStorage, "effect-playwright/web-storage/WebStorage"],
  [
    PlaywrightSpawner.PlaywrightSpawner,
    "effect-playwright/experimental/playwright-spawner/PlaywrightSpawner",
  ],
] as const;

const models = [
  Playwright.Dialog,
  Playwright.Download,
  Playwright.FileChooser,
  Playwright.PlaywrightError,
  Playwright.Request,
  Playwright.Response,
  Playwright.Worker,
] as const;

describe("runtime tag names", () => {
  for (const [TagClass, expectedKey] of tags) {
    it(expectedKey, () => {
      assert.strictEqual(TagClass.key, expectedKey);
    });
  }
});

describe("runtime model exports", () => {
  for (const ModelClass of models) {
    it(ModelClass.name, () => {
      assert.strictEqual(typeof ModelClass, "function");
    });
  }
});
