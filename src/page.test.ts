import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightManager } from "./experimental/manager";

layer(PlaywrightManager.Default)("PlaywrightPage", (it) => {
  it.scoped("goto should navigate to a URL", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Using about:blank to avoid external network dependencies in tests if possible,
      // but goto is usually used for real URLs. Let's use about:blank first.
      yield* page.goto("about:blank");
      const url = yield* page.use((p) => Promise.resolve(p.url()));
      assert(url === "about:blank");
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("title should return the page title", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("data:text/html,<title>Test Page</title>");
      const title = yield* page.title;
      assert(title === "Test Page");
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("click should click an element", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        const win = window as Window & { clicked?: boolean };
        document.body.innerHTML =
          '<button id="mybutton" onclick="window.clicked = true">Click Me</button>';
        win.clicked = false;
      });

      yield* page.click("#mybutton");

      const clicked = yield* page.evaluate(
        () => (window as Window & { clicked?: boolean }).clicked,
      );
      assert(clicked === true);
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("goto should work with options", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank", { waitUntil: "domcontentloaded" });
      const url = yield* page.use((p) => Promise.resolve(p.url()));
      assert(url === "about:blank");
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped(
    "evaluate should run code in the page context with destructured arg",
    () =>
      Effect.gen(function* () {
        const browser = yield* PlaywrightBrowser;
        const page = yield* browser.newPage();

        const result = yield* page.evaluate(
          ([a, b]: readonly [number, number]) => a + b,
          [10, 20] as const,
        );
        assert(result === 30);
      }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("evaluate should run code with a single value arg", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const result = yield* page.evaluate((val: number) => val * 2, 21);
      assert(result === 42);
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("click should work with options", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        const win = window as Window & {
          clickCoords?: { x: number; y: number } | null;
        };
        document.body.innerHTML =
          '<button id="mybutton" style="width: 100px; height: 100px">Click Me</button>';
        win.clickCoords = null;
        document.getElementById("mybutton")?.addEventListener("click", (e) => {
          win.clickCoords = { x: e.clientX, y: e.clientY };
        });
      });

      // Click at a specific position relative to the element
      yield* page.click("#mybutton", { position: { x: 10, y: 10 } });

      const coords = yield* page.evaluate(
        () =>
          (window as Window & { clickCoords?: { x: number; y: number } | null })
            .clickCoords,
      );
      assert(coords !== null);
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("use should allow accessing raw playwright page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const content = yield* page.use((p) => p.content());
      assert(typeof content === "string");
    }).pipe(PlaywrightManager.provideBrowser),
  );

  it.scoped("locator should work with options", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = `
          <div class="test">One</div>
          <div class="test" data-id="target">Two</div>
        `;
      });

      const locator = page.locator(".test", { hasText: "Two" });
      const text = yield* locator.textContent();
      assert(text === "Two");

      const attr = yield* locator.getAttribute("data-id");
      assert(attr === "target");
    }).pipe(PlaywrightManager.provideBrowser),
  );
});
