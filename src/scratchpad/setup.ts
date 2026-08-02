import { Environment } from "effect-playwright/experimental";
import { chromium } from "playwright-core";

export const liveLayer = Environment.layer(chromium, {
  headless: false,
});
