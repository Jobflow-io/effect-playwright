import { PlaywrightSpawner } from "effect-playwright/experimental";
import { chromium } from "playwright-core";

export const liveLayer = PlaywrightSpawner.layer(chromium, {
  headless: false,
});
