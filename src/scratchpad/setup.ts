import { PlaywrightSpawner } from "effect-playwright";
import { chromium } from "playwright-core";

export const liveLayer = PlaywrightSpawner.layer(chromium, {
  headless: false,
});
