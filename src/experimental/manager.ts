import {
  Playwright,
  PlaywrightBrowser,
  PlaywrightPage,
} from "@jobflow/effect-playwright";
import { Effect } from "effect";
import { chromium } from "playwright-core";

export class PlaywrightManager extends Effect.Service<PlaywrightManager>()(
  "@jobflow/effect-playwright/manager/PlaywrightManager",
  {
    effect: Effect.gen(function* () {
      const playwright = yield* Playwright;
      return {
        provideBrowser: () =>
          Effect.gen(function* () {
            const browser = yield* playwright.launchScoped(chromium, {
              headless: false,
            });
            return Effect.provideService(PlaywrightBrowser, browser);
          }),
        providePage: () =>
          Effect.gen(function* () {
            const browser = yield* playwright.launchScoped(chromium, {
              headless: false,
            });
            const page = yield* browser.newPage();
            return Effect.provideService(PlaywrightPage, page);
          }),
      };
    }),
    dependencies: [Playwright.layer],
    accessors: true,
  },
) {}
