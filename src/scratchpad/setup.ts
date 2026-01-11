import { PlaywrightEnvironment } from "@jobflow/effect-playwright/experimental";
import { chromium } from "playwright-core";

export const liveLayer = PlaywrightEnvironment.layer(chromium);
