import { PlaywrightEnvironment } from "effect-playwright/experimental";
import { chromium } from "playwright-core";

export const liveLayer = PlaywrightEnvironment.layer(chromium, {
  headless: false,
});
