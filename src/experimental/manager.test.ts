import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { PlaywrightBrowser } from "../browser";
import { PlaywrightManager } from "./manager";

layer(PlaywrightManager.Default)("PlaywrightManager", (it) => {
  it.scoped("should launch a browser", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage({ baseURL: "about:blank" });

      const title = yield* page.title;
      assert(title === "Blank", "Expected title to be 'Blank'");
    }).pipe(PlaywrightManager.provideBrowser),
  );
});
