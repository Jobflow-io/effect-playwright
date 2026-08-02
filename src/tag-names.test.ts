import { assert, describe, it } from "@effect/vitest";
import { Browser } from "./browser";
import { BrowserContext } from "./browser-context";
import { Clock } from "./clock";
import { Credentials } from "./credentials";
import { Environment } from "./experimental/environment";
import { Frame } from "./frame";
import { FrameLocator } from "./frame-locator";
import { Keyboard } from "./keyboard";
import { Locator } from "./locator";
import { Mouse } from "./mouse";
import { Page } from "./page";
import { Playwright } from "./playwright";
import { Screencast } from "./screencast";
import { Touchscreen } from "./touchscreen";
import { Tracing } from "./tracing";
import { WebStorage } from "./web-storage";

const tags = [
  [Browser, "effect-playwright/browser/Browser"],
  [BrowserContext, "effect-playwright/browser-context/BrowserContext"],
  [Clock, "effect-playwright/clock/Clock"],
  [Credentials, "effect-playwright/credentials/Credentials"],
  [FrameLocator, "effect-playwright/frame-locator/FrameLocator"],
  [Frame, "effect-playwright/frame/Frame"],
  [Keyboard, "effect-playwright/keyboard/Keyboard"],
  [Locator, "effect-playwright/locator/Locator"],
  [Mouse, "effect-playwright/mouse/Mouse"],
  [Page, "effect-playwright/page/Page"],
  [Playwright, "effect-playwright/playwright/Playwright"],
  [Screencast, "effect-playwright/screencast/Screencast"],
  [Touchscreen, "effect-playwright/touchscreen/Touchscreen"],
  [Tracing, "effect-playwright/tracing/Tracing"],
  [WebStorage, "effect-playwright/web-storage/WebStorage"],
  [Environment, "effect-playwright/experimental/environment/Environment"],
] as const;

describe("runtime tag names", () => {
  for (const [TagClass, expectedKey] of tags) {
    it(expectedKey, () => {
      assert.strictEqual(TagClass.key, expectedKey);
    });
  }
});
