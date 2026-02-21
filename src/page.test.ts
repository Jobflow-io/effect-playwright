import { assert, layer } from "@effect/vitest";
import { Effect, Fiber, Option, Ref, Stream } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

type TestWindow = Window & {
  timerFired?: boolean;
  clicked?: boolean;
  clickCoords?: { x: number; y: number } | null;
  magicValue?: number;
};

layer(PlaywrightEnvironment.layer(chromium))("PlaywrightPage", (it) => {
  it.scoped("goto should navigate to a URL", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Using about:blank to avoid external network dependencies in tests if possible,
      // but goto is usually used for real URLs. Let's use about:blank first.
      yield* page.goto("about:blank");
      const url = yield* page.use((p) => Promise.resolve(p.url()));
      assert(url === "about:blank");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("setContent should set the page content", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setContent("<h1>Hello World</h1>");
      const content = yield* page.content;
      assert(content.includes("<h1>Hello World</h1>"));
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("title should return the page title", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("data:text/html,<title>Test Page</title>");
      const title = yield* page.title;
      assert(title === "Test Page");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("content should return the page content", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto(
        "data:text/html,<html><head><title>Content</title></head><body><h1>Hello</h1></body></html>",
      );
      const content = yield* page.content;
      assert(content.includes("<h1>Hello</h1>"));
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("click should click an element", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        const win = window as TestWindow;
        document.body.innerHTML =
          '<button id="mybutton" onclick="window.clicked = true">Click Me</button>';
        win.clicked = false;
      });

      yield* page.click("#mybutton");

      const clicked = yield* page.evaluate(
        () => (window as TestWindow).clicked,
      );
      assert(clicked === true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("goto should work with options", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank", { waitUntil: "domcontentloaded" });
      const url = yield* page.use((p) => Promise.resolve(p.url()));
      assert(url === "about:blank");
    }).pipe(PlaywrightEnvironment.withBrowser),
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
      }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("evaluate should run code with a single value arg", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const result = yield* page.evaluate((val: number) => val * 2, 21);
      assert(result === 42);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("click should work with options", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        const win = window as TestWindow;
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
        () => (window as TestWindow).clickCoords,
      );
      assert(coords !== null);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("use should allow accessing raw playwright page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const content = yield* page.use((p) => p.content());
      assert(typeof content === "string");
    }).pipe(PlaywrightEnvironment.withBrowser),
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
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("getBy* methods should work", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = `
          <button role="button">Click Me</button>
          <span>Hello World</span>
          <label for="input">Label Text</label>
          <input id="input" />
          <div data-testid="test-id">Test Content</div>
          <img alt="Alt Text" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" />
          <input placeholder="Placeholder Text" />
          <div title="Title Text">Hover Me</div>
        `;
      });

      const byRole = yield* page.getByRole("button").textContent();
      assert(byRole === "Click Me");

      const byText = yield* page.getByText("Hello World").textContent();
      assert(byText === "Hello World");

      const byLabel = yield* page.getByLabel("Label Text").getAttribute("id");
      assert(byLabel === "input");

      const byTestId = yield* page.getByTestId("test-id").textContent();
      assert(byTestId === "Test Content");

      const byAltText = yield* page
        .getByAltText("Alt Text")
        .getAttribute("alt");
      assert(byAltText === "Alt Text");

      const byPlaceholder = yield* page
        .getByPlaceholder("Placeholder Text")
        .getAttribute("placeholder");
      assert(byPlaceholder === "Placeholder Text");

      const byTitle = yield* page.getByTitle("Title Text").textContent();
      assert(byTitle === "Hover Me");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("waitForURL should work with History API", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");
      yield* page.evaluate(() => {
        history.pushState({}, "", "#test-history");
      });

      yield* page.waitForURL((url) => url.hash === "#test-history");
      const url = page.url();
      assert(url.endsWith("#test-history"));
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("filechooser event should work", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = '<input type="file" id="fileinput" />';
      });

      const fileChooser = yield* page
        .eventStream("filechooser")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.locator("#fileinput").click();

      const results = yield* Fiber.join(fileChooser).pipe(Effect.flatten);

      assert(results.isMultiple() === false, "isMultiple should be false");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("waitForLoadState should resolve", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Using about:blank and history API to simulate some activity, but networkidle is tricky on blank page.
      // load and domcontentloaded are safer.
      yield* page.goto("about:blank");

      // Wait for 'load' state which should already be true or happen quickly
      yield* page.waitForLoadState("load");

      // No assertion needed other than it doesn't timeout/error
      assert.ok(true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
  it.scoped("url property should update after navigation", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const url1 = "data:text/html,<h1>Page 1</h1>";
      yield* page.goto(url1);
      assert.strictEqual(page.url(), url1);

      const url2 = "data:text/html,<h1>Page 2</h1>";
      yield* page.goto(url2);
      assert.strictEqual(page.url(), url2);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("goBack and goForward should navigate through history", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const url1 = "data:text/html,<h1>Page 1</h1>";
      yield* page.goto(url1);

      const url2 = "data:text/html,<h1>Page 2</h1>";
      yield* page.goto(url2);
      assert.strictEqual(page.url(), url2, "URL should be updated to url2");

      yield* page.goBack();
      assert.strictEqual(page.url(), url1, "URL should be updated to url1");

      yield* page.goForward();
      assert.strictEqual(page.url(), url2, "URL should be updated to url2");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("requestGC should execute without error", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.requestGC;
      assert.ok(true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("clock should allow fast forwarding time", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      // Install clock
      yield* page.clock.install({ time: new Date("2024-01-01T00:00:00.000Z") });

      yield* page.evaluate(() => {
        (window as TestWindow).timerFired = false;
        setTimeout(() => {
          (window as TestWindow).timerFired = true;
        }, 10000);
      });

      let timerFired = yield* page.evaluate(
        () => (window as TestWindow).timerFired,
      );
      assert.strictEqual(timerFired, false);

      yield* page.clock.fastForward(10000);

      timerFired = yield* page.evaluate(
        () => (window as TestWindow).timerFired,
      );
      assert.strictEqual(timerFired, true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("clock should allow fast forwarding time on context", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const context = yield* browser.newContext();
      const page = yield* context.newPage;

      // Install clock on context
      yield* context.clock.install({
        time: new Date("2024-01-01T00:00:00.000Z"),
      });

      yield* page.evaluate(() => {
        (window as TestWindow).timerFired = false;
        setTimeout(() => {
          (window as TestWindow).timerFired = true;
        }, 10000);
      });

      let timerFired = yield* page.evaluate(
        () => (window as TestWindow).timerFired,
      );
      assert.strictEqual(timerFired, false);

      yield* context.clock.fastForward(10000);

      timerFired = yield* page.evaluate(
        () => (window as TestWindow).timerFired,
      );
      assert.strictEqual(timerFired, true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("addInitScript should execute script before page load", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.addInitScript(() => {
        (window as TestWindow).magicValue = 42;
      });

      yield* page.goto("about:blank");

      const magicValue = yield* page.evaluate(
        () => (window as TestWindow).magicValue,
      );
      assert.strictEqual(magicValue, 42);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("keyboard should allow typing text", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = '<input id="input" />';
        document.getElementById("input")?.focus();
      });

      yield* page.keyboard.type("Hello Effect");

      const value = yield* page.evaluate(
        () => (document.getElementById("input") as HTMLInputElement).value,
      );
      assert.strictEqual(value, "Hello Effect");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("mouse should allow dispatching events", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML =
          '<div id="target" style="width: 100px; height: 100px; background: red;"></div>';
        const target = document.getElementById("target");
        if (target) {
          target.addEventListener("click", () => {
            (window as TestWindow).clicked = true;
          });
        }
      });

      yield* page.mouse.click(50, 50);

      const clicked = yield* page.evaluate(
        () => (window as TestWindow).clicked,
      );
      assert.strictEqual(clicked, true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("touchscreen should allow dispatching events", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const context = yield* browser.newContext({ hasTouch: true });
      const page = yield* context.newPage;

      yield* page.evaluate(() => {
        document.body.innerHTML =
          '<div id="target" style="width: 100px; height: 100px; background: red;"></div>';
        const target = document.getElementById("target");
        if (target) {
          target.addEventListener("touchstart", (e) => {
            const win = window as TestWindow;
            win.clicked = true;
            win.clickCoords = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          });
        }
      });

      yield* page.touchscreen.tap(50, 50);

      const clicked = yield* page.evaluate(
        () => (window as TestWindow).clicked,
      );
      assert.strictEqual(clicked, true);

      const coords = yield* page.evaluate(
        () => (window as TestWindow).clickCoords,
      );
      assert.deepStrictEqual(coords, { x: 50, y: 50 });
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("screenshot should capture an image", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("data:text/html,<h1>Screenshot Test</h1>");
      const buffer = yield* page.screenshot({ type: "png" });

      assert(Buffer.isBuffer(buffer));
      assert(buffer.length > 0);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("pdf should capture a PDF", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("data:text/html,<h1>PDF Test</h1>");
      const buffer = yield* page.pdf();

      assert(Buffer.isBuffer(buffer));
      assert(buffer.length > 0);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("addScriptTag should add a script tag to the page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      yield* page.addScriptTag({ content: "window.magicValue = 42;" });

      const magicValue = yield* page.evaluate(
        () => (window as TestWindow).magicValue,
      );
      assert.strictEqual(magicValue, 42);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("addStyleTag should add a style tag to the page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      yield* page.evaluate(() => {
        document.body.innerHTML = '<div id="test-div">Hello</div>';
      });

      yield* page.addStyleTag({
        content: "#test-div { color: rgb(255, 0, 0); }",
      });

      const color = yield* page.evaluate(() => {
        const el = document.getElementById("test-div");
        return el ? window.getComputedStyle(el).color : null;
      });
      assert.strictEqual(color, "rgb(255, 0, 0)");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
  it.scoped("bringToFront should bring the page to the front", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const context = yield* browser.newContext();
      const page1 = yield* context.newPage;
      const page2 = yield* context.newPage;

      yield* page1.bringToFront;
      yield* page2.bringToFront;

      // Ensure no errors are thrown
      assert.ok(true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("consoleMessages should return console messages", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      yield* page.evaluate(() => {
        console.log("Hello from page");
        console.warn("Warning from page");
      });

      const messages = yield* page.consoleMessages;

      assert.strictEqual(messages.length, 2);
      assert.strictEqual(messages[0].text(), "Hello from page");
      assert.strictEqual(messages[1].text(), "Warning from page");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("pageerror event should work", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      const errorFiber = yield* page
        .eventStream("pageerror")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.evaluate(() => {
        setTimeout(() => {
          throw new Error("Test Error");
        }, 0);
      });

      const errorOpt = yield* Fiber.join(errorFiber);
      const error = Option.getOrThrow(errorOpt);
      assert.strictEqual(error.message, "Test Error");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("pageErrors should return all page errors", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      const errorFiber = yield* page
        .eventStream("pageerror")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.evaluate(() => {
        setTimeout(() => {
          throw new Error("Test Error");
        }, 0);
      });

      yield* Fiber.join(errorFiber);

      const errors = yield* page.pageErrors;
      assert.ok(errors.length >= 1);
      assert.strictEqual(errors[0].message, "Test Error");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("context should return the associated browser context", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const context = yield* browser.newContext();
      const page = yield* context.newPage;

      const pageContext = page.context();

      // we can't do direct reference equality because they are wrapper objects,
      // but we can check if it has the right methods and doesn't crash
      const pages = yield* pageContext.pages;
      assert.strictEqual(pages.length, 1);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("dragAndDrop should drag and drop an element", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = `
          <div id="source" style="width: 50px; height: 50px; background: red;" draggable="true"></div>
          <div id="target" style="width: 100px; height: 100px; background: blue; position: absolute; top: 200px; left: 200px;"></div>
        `;

        const target = document.getElementById("target");
        if (target) {
          target.addEventListener("drop", (e) => {
            e.preventDefault();
            (window as TestWindow).magicValue = 42;
          });
          target.addEventListener("dragover", (e) => {
            e.preventDefault();
          });
        }
      });

      yield* page.dragAndDrop("#source", "#target");

      const magicValue = yield* page.evaluate(
        () => (window as TestWindow).magicValue,
      );
      assert.strictEqual(magicValue, 42);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("emulateMedia should emulate media features", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      // emulate dark mode
      yield* page.emulateMedia({ colorScheme: "dark" });

      let isDark = yield* page.evaluate(
        () => window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
      assert.strictEqual(isDark, true);

      // emulate light mode
      yield* page.emulateMedia({ colorScheme: "light" });

      isDark = yield* page.evaluate(
        () => window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
      assert.strictEqual(isDark, false);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped(
    "exposeFunction should expose an function that runs an effect",
    () =>
      Effect.gen(function* () {
        const browser = yield* PlaywrightBrowser;
        const page = yield* browser.newPage();

        const ref = yield* Ref.make(0);

        yield* page.exposeFunction("myCustomEffect", () =>
          Ref.updateAndGet(ref, (n) => n + 1),
        );

        const result = yield* page.evaluate(async () => {
          // @ts-expect-error
          return await window.myCustomEffect();
        });

        assert.strictEqual(yield* Ref.get(ref), 1, "Ref value is 1");
        assert.strictEqual(result, 1, "Return value is 1");
      }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("exposeFunction should work with Effect.fn", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const ref = yield* Ref.make(0);

      // Effect.fn usage
      yield* page.exposeFunction(
        "myCustomEffectFn",
        Effect.fn(function* (num: number) {
          return yield* Ref.updateAndGet(ref, (n) => n + num);
        }),
      );

      const result = yield* page.evaluate(async () => {
        // @ts-expect-error
        return await window.myCustomEffectFn(15);
      });

      assert.strictEqual(yield* Ref.get(ref), 15, "Ref value is 15");
      assert.strictEqual(result, 15, "Return value is 15");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("exposeEffect should expose an effect", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const ref = yield* Ref.make(0);

      yield* page.exposeEffect(
        "myCustomEffect",
        Ref.updateAndGet(ref, (n) => n + 1),
      );

      const result = yield* page.evaluate(async () => {
        // @ts-expect-error
        return await window.myCustomEffect();
      });

      assert.strictEqual(yield* Ref.get(ref), 1, "Ref value is 1");
      assert.strictEqual(result, 1, "Return value is 1");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("frame should return an Option of PlaywrightFrame", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.use((p) =>
        p.setContent('<iframe name="test-frame" id="test-frame"></iframe>'),
      );

      const frameOpt = page.frame("test-frame");
      assert(Option.isSome(frameOpt), "Frame should be Some");

      const frameOptByName = page.frame({ name: "test-frame" });
      assert(Option.isSome(frameOptByName), "Frame should be Some");

      const nonExistentFrame = page.frame("foo");
      assert(Option.isNone(nonExistentFrame), "Frame should be None");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("isClosed should return the closed state of the page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      assert.strictEqual(page.isClosed(), false);

      yield* page.close;

      assert.strictEqual(page.isClosed(), true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("mainFrame should return the main frame", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      const mainFrame = page.mainFrame();
      assert.ok(mainFrame);

      const url = mainFrame.url();
      assert.strictEqual(url, "about:blank");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("opener should return the opener page", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.goto("about:blank");

      const popupFiber = yield* page
        .eventStream("popup")
        .pipe(Stream.runHead, Effect.fork);

      yield* page.evaluate(() => {
        window.open("about:blank");
      });

      const popupOpt = yield* Fiber.join(popupFiber);
      const popup = Option.getOrThrow(popupOpt);

      const openerOpt = yield* popup.opener;
      assert(Option.isSome(openerOpt), "Opener should be Some");

      const opener = Option.getOrThrow(openerOpt);
      const url = opener.url();
      assert.strictEqual(url, "about:blank");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("setViewportSize should update viewport dimensions", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setViewportSize({ width: 600, height: 400 });
      const size = yield* page.evaluate(() => ({
        width: window.innerWidth,
        height: window.innerHeight,
      }));

      assert.strictEqual(size.width, 600);
      assert.strictEqual(size.height, 400);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("setExtraHTTPHeaders should not crash", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setExtraHTTPHeaders({ "x-custom-header": "test-value" });
      assert.ok(true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("setDefaultNavigationTimeout should not crash", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setDefaultNavigationTimeout(1000);
      assert.ok(true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("setDefaultTimeout should influence timeouts", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setDefaultTimeout(1);

      const result = yield* page
        .locator("#non-existent")
        .click()
        .pipe(Effect.flip);

      assert.strictEqual(result._tag, "PlaywrightError");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
