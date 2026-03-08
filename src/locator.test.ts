/// <reference lib="dom" />
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { chromium } from "playwright-core";
import { PlaywrightBrowser } from "./browser";
import { PlaywrightEnvironment } from "./experimental";

layer(PlaywrightEnvironment.layer(chromium))("PlaywrightLocator", (it) => {
  it.scoped("should work", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();
      yield* page.goto("data:text/html,<title>Blank</title>");

      const title = page.locator("title");

      const titleText = yield* title.textContent();
      assert(titleText === "Blank", "Expected title to be 'Blank'");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("evaluate", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = `
          <div id="test">Test</div>
        `;
      });

      const locator = page.locator("#test");

      const result = yield* locator.evaluate((el) => {
        el.style.color = "red";
        return el.style.color;
      });

      assert(result === "red");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("waitFor", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();
      yield* page.setContent(`
        <button id="hidden-btn" style="display: none;">Hidden</button>
      `);

      const btn = page.locator("#hidden-btn");

      // Make it visible after a short delay
      yield* page.evaluate(() => {
        setTimeout(() => {
          const el = document.getElementById("hidden-btn");
          if (el) el.style.display = "block";
        }, 1);
      });

      // waitFor should wait until it becomes visible
      yield* btn.waitFor({ state: "visible" });

      const isVisible = yield* btn.evaluate(
        (el) => el.style.display === "block",
      );
      assert(isVisible === true);
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("kitchensink", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.evaluate(() => {
        document.body.innerHTML = `
          <div id="container">
            <button id="btn-1" class="btn" data-info="first">Button 1</button>
            <button id="btn-2" class="btn" data-info="second">Button 2</button>
            <input id="input-1" value="initial value" />
            <div id="html-content"><span>Hello</span></div>
            <label>
              Username
              <input type="text" id="username-input" value="john_doe" />
            </label>
            <input type="text" id="search-input" placeholder="Search..." />
            <img src="dummy.png" alt="A test image" id="test-image" />
            <span title="Hover me" id="test-title">Tooltip</span>
            <div data-testid="custom-test-id" id="test-id-element">Test ID Element</div>
            <input type="checkbox" id="checkbox-1" />
          </div>
        `;
      });

      const buttons = page.locator(".btn");
      const input = page.locator("#input-1");
      const htmlDiv = page.locator("#html-content");

      // textContent
      const btn1Text = yield* buttons.first().textContent();
      assert(btn1Text === "Button 1");

      // innerText
      const btn2InnerText = yield* buttons.nth(1).innerText();
      assert(btn2InnerText === "Button 2");

      // innerHTML
      const htmlContent = yield* htmlDiv.innerHTML();
      assert(htmlContent === "<span>Hello</span>");

      // allInnerTexts
      const allTexts = yield* buttons.allInnerTexts();
      assert.deepEqual(allTexts, ["Button 1", "Button 2"]);

      // allTextContents
      const allTextContents = yield* buttons.allTextContents();
      assert.deepEqual(allTextContents, ["Button 1", "Button 2"]);

      // boundingBox
      const box = yield* buttons.first().boundingBox();
      assert(Option.isSome(box));
      assert(typeof box.value.x === "number");

      // ariaSnapshot
      const snapshot = yield* buttons.first().ariaSnapshot();
      assert(typeof snapshot === "string");

      // describe / description
      const described = buttons.first().describe("first button");
      const desc = described.description();
      assert(Option.isSome(desc));
      assert(desc.value === "first button");

      // count
      const btnCount = yield* buttons.count;
      assert(btnCount === 2);

      // getAttribute
      const btn1Attr = yield* buttons.first().getAttribute("data-info");
      assert(btn1Attr === "first");

      // inputValue & fill
      const initialValue = yield* input.inputValue();
      assert(initialValue === "initial value");

      yield* input.fill("new value");
      const newValue = yield* input.inputValue();
      assert(newValue === "new value");

      // click
      yield* page.evaluate(() => {
        const win = window as Window & { clicked?: boolean };
        win.clicked = false;
        document.getElementById("btn-1")?.addEventListener("click", () => {
          win.clicked = true;
        });
      });

      yield* buttons.first().click();
      const isClicked = yield* page.evaluate(
        () => (window as Window & { clicked?: boolean }).clicked,
      );
      assert(isClicked === true);

      // check
      const checkbox = page.locator("#checkbox-1");
      const isCheckedInitial = yield* checkbox.evaluate(
        (el) => (el as HTMLInputElement).checked,
      );
      assert(isCheckedInitial === false);
      yield* checkbox.check();
      const isCheckedAfter = yield* checkbox.evaluate(
        (el) => (el as HTMLInputElement).checked,
      );
      assert(isCheckedAfter === true);

      // first, last, nth
      const firstId = yield* buttons.first().getAttribute("id");
      assert(firstId === "btn-1");
      const lastId = yield* buttons.last().getAttribute("id");
      assert(lastId === "btn-2");
      const nthId = yield* buttons.nth(1).getAttribute("id");
      assert(nthId === "btn-2");

      // locator
      const spanHtml = yield* htmlDiv.locator("span").innerHTML();
      assert(spanHtml === "Hello");

      // locator with PlaywrightLocatorService
      const spanLocator = page.locator("span");
      const nestedSpanHtml = yield* htmlDiv.locator(spanLocator).innerHTML();
      assert(nestedSpanHtml === "Hello");

      // getByRole
      const btnRole = page
        .locator("#container")
        .getByRole("button", { name: "Button 1" });
      const btnRoleText = yield* btnRole.textContent();
      assert(btnRoleText === "Button 1");

      // getByText
      const btnText = page.locator("#container").getByText("Button 2");
      const btnTextAttr = yield* btnText.getAttribute("data-info");
      assert(btnTextAttr === "second");

      // getByLabel
      const usernameInput = page.locator("#container").getByLabel("Username");
      const usernameValue = yield* usernameInput.inputValue();
      assert(usernameValue === "john_doe");

      // getByPlaceholder
      const searchInput = page
        .locator("#container")
        .getByPlaceholder("Search...");
      const searchInputId = yield* searchInput.getAttribute("id");
      assert(searchInputId === "search-input");

      // getByAltText
      const testImage = page.locator("#container").getByAltText("A test image");
      const testImageId = yield* testImage.getAttribute("id");
      assert(testImageId === "test-image");

      // getByTitle
      const testTitle = page.locator("#container").getByTitle("Hover me");
      const testTitleId = yield* testTitle.getAttribute("id");
      assert(testTitleId === "test-title");

      // getByTestId
      const testIdElement = page
        .locator("#container")
        .getByTestId("custom-test-id");
      const testIdElementId = yield* testIdElement.getAttribute("id");
      assert(testIdElementId === "test-id-element");

      // highlight
      yield* buttons.first().highlight();

      // screenshot
      const screenshotBuffer = yield* buttons.first().screenshot();
      assert(screenshotBuffer.length > 0);

      // toString
      const str = buttons.first().toString();
      assert(typeof str === "string");
      assert(str.includes("locator"));

      // State checks
      assert((yield* checkbox.isChecked()) === true);
      assert((yield* buttons.first().isVisible()) === true);
      assert((yield* buttons.first().isHidden()) === false);
      assert((yield* buttons.first().isEnabled()) === true);
      assert((yield* buttons.first().isDisabled()) === false);
      assert((yield* input.isEditable()) === true);

      // evaluate
      const evalResult = yield* buttons.first().evaluate((el, arg) => {
        return el.getAttribute("data-info") + arg;
      }, "-suffix");
      assert(evalResult === "first-suffix");

      // evaluateAll
      const evalAllRes = yield* buttons.evaluateAll(
        (els, prefix) => els.map((el) => prefix + el.id),
        "id:",
      );
      assert.deepEqual(evalAllRes, ["id:btn-1", "id:btn-2"]);

      // evaluateHandle
      const handle = yield* buttons.first().evaluateHandle((el) => el);
      const handleRes = yield* page.evaluate((el) => el.id, handle);
      assert(handleRes === "btn-1");

      // elementHandle
      const elHandleOption = yield* buttons.first().elementHandle();
      assert(Option.isSome(elHandleOption));
      const elHandleRes = yield* Effect.promise(() =>
        elHandleOption.value.evaluate((el) => el.id),
      );
      assert(elHandleRes === "btn-1");

      // elementHandles
      const handles = yield* buttons.elementHandles();
      assert(handles.length === 2);
      const firstHandleId = yield* Effect.promise(() =>
        handles[0].evaluate((el) => el.id),
      );
      assert(firstHandleId === "btn-1");

      // use
      const useResult = yield* buttons
        .first()
        .use((l) => l.evaluate((el) => el.id));
      assert(useResult === "btn-1");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped(
    "new methods: all, and, filter, or, page, frameLocator, contentFrame",
    () =>
      Effect.gen(function* () {
        const browser = yield* PlaywrightBrowser;
        const page = yield* browser.newPage();

        yield* page.evaluate(() => {
          document.body.innerHTML = `
          <div id="container">
            <button id="btn-1" class="btn test-and">Button 1</button>
            <button id="btn-2" class="btn">Button 2</button>
            <iframe id="test-iframe" name="test-iframe" srcdoc="<body><div id='in-frame'>In Frame</div></body>"></iframe>
          </div>
        `;
        });

        const buttons = page.locator(".btn");

        // all
        const allLocators = yield* buttons.all();
        assert(allLocators.length === 2);
        const firstId = yield* allLocators[0].getAttribute("id");
        assert(firstId === "btn-1");

        // filter
        const filtered = buttons.filter({ hasText: "Button 1" });
        const filteredId = yield* filtered.getAttribute("id");
        assert(filteredId === "btn-1");

        // and
        const andLocator = buttons.and(page.locator(".test-and"));
        const andId = yield* andLocator.getAttribute("id");
        assert(andId === "btn-1");

        // or
        const orLocator = page.locator("#btn-1").or(page.locator("#btn-2"));
        const orCount = yield* orLocator.count;
        assert(orCount === 2);

        // page
        const pageFromLocator = buttons.page();
        assert(pageFromLocator !== undefined);

        // frameLocator
        const frameLoc = page
          .locator("#container")
          .frameLocator("#test-iframe");
        const inFrameText = yield* frameLoc.locator("#in-frame").textContent();
        assert(inFrameText === "In Frame");

        // contentFrame
        const iframeElement = page.locator("#test-iframe");
        const contentFrame = iframeElement.contentFrame();
        const contentFrameText = yield* contentFrame
          .locator("#in-frame")
          .textContent();
        assert(contentFrameText === "In Frame");
      }).pipe(PlaywrightEnvironment.withBrowser),
  );

  it.scoped("action methods", () =>
    Effect.gen(function* () {
      const browser = yield* PlaywrightBrowser;
      const page = yield* browser.newPage();

      yield* page.setContent(`
          <div id="new-methods-container" style="padding-top: 2000px;">
            <input type="text" id="input-blur" />
            <input type="text" id="input-clear" value="clear me" />
            <button id="btn-dblclick">DblClick</button>
            <div id="div-event">Event</div>
            <div id="div-drag-source" style="width:50px;height:50px;background:red;">Source</div>
            <div id="div-drag-target" style="width:50px;height:50px;background:blue;">Target</div>
            <input type="text" id="input-focus" />
            <div id="div-hover">Hover</div>
            <input type="text" id="input-press" />
            <input type="text" id="input-press-seq" />
            <div id="div-scroll">Scroll</div>
            <select id="select-option">
              <option value="opt1">Opt 1</option>
              <option value="opt2">Opt 2</option>
            </select>
            <div id="div-select-text">Some text to select</div>
            <input type="checkbox" id="checkbox-checked" />
            <input type="file" id="input-file" />
            <input type="checkbox" id="checkbox-uncheck" checked />
          </div>
        `);

      // focus & blur
      const inputBlur = page.locator("#input-blur");
      yield* inputBlur.focus();
      assert(
        (yield* inputBlur.evaluate((el) => document.activeElement === el)) ===
          true,
      );
      yield* inputBlur.blur();
      assert(
        (yield* inputBlur.evaluate((el) => document.activeElement === el)) ===
          false,
      );

      // clear
      const inputClear = page.locator("#input-clear");
      yield* inputClear.clear();
      assert((yield* inputClear.inputValue()) === "");

      // dblclick
      const btnDblclick = page.locator("#btn-dblclick");
      yield* btnDblclick.evaluate((el) => {
        el.setAttribute("data-dblclicked", "false");
        el.addEventListener("dblclick", () => {
          el.setAttribute("data-dblclicked", "true");
        });
      });
      yield* btnDblclick.dblclick();
      assert(
        (yield* btnDblclick.evaluate((el) =>
          el.getAttribute("data-dblclicked"),
        )) === "true",
      );

      // dispatchEvent
      const divEvent = page.locator("#div-event");
      yield* divEvent.evaluate((el) => {
        el.setAttribute("data-custom-event-fired", "false");
        el.addEventListener("my-event", () => {
          el.setAttribute("data-custom-event-fired", "true");
        });
      });
      yield* divEvent.dispatchEvent("my-event");
      assert(
        (yield* divEvent.evaluate((el) =>
          el.getAttribute("data-custom-event-fired"),
        )) === "true",
      );

      // dragTo
      const dragSource = page.locator("#div-drag-source");
      const dragTarget = page.locator("#div-drag-target");
      yield* dragSource.dragTo(dragTarget);

      // hover
      const divHover = page.locator("#div-hover");
      yield* divHover.evaluate((el) => {
        el.setAttribute("data-hovered", "false");
        el.addEventListener("mouseenter", () => {
          el.setAttribute("data-hovered", "true");
        });
      });
      yield* divHover.hover();
      assert(
        (yield* divHover.evaluate((el) => el.getAttribute("data-hovered"))) ===
          "true",
      );

      // press
      const inputPress = page.locator("#input-press");
      yield* inputPress.press("A");
      assert((yield* inputPress.inputValue()) === "A");

      // pressSequentially
      const inputPressSeq = page.locator("#input-press-seq");
      yield* inputPressSeq.pressSequentially("Hello");
      assert((yield* inputPressSeq.inputValue()) === "Hello");

      // scrollIntoViewIfNeeded
      const divScroll = page.locator("#div-scroll");
      yield* divScroll.scrollIntoViewIfNeeded();
      const isIntersecting = yield* divScroll.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top >= 0 && rect.bottom <= window.innerHeight;
      });
      assert(isIntersecting === true);

      // selectOption
      const selectOpt = page.locator("#select-option");
      const selected = yield* selectOpt.selectOption("opt2");
      assert(selected[0] === "opt2");
      assert(
        (yield* selectOpt.evaluate((el: HTMLSelectElement) => el.value)) ===
          "opt2",
      );

      // selectText
      const divSelectText = page.locator("#div-select-text");
      yield* divSelectText.selectText();
      const selectedText = yield* page.evaluate(() =>
        window.getSelection()?.toString(),
      );
      assert(selectedText === "Some text to select");

      // setChecked
      const checkboxChecked = page.locator("#checkbox-checked");
      yield* checkboxChecked.setChecked(true);
      assert((yield* checkboxChecked.isChecked()) === true);

      // setInputFiles
      const inputFile = page.locator("#input-file");
      yield* inputFile.setInputFiles({
        name: "test.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("test"),
      });

      // uncheck
      const checkboxUncheck = page.locator("#checkbox-uncheck");
      yield* checkboxUncheck.uncheck();
      assert((yield* checkboxUncheck.isChecked()) === false);

      // tap
      const context = yield* browser.newContext({ hasTouch: true });
      const mobilePage = yield* context.newPage;
      yield* mobilePage.setContent('<button id="btn-tap">Tap</button>');
      const btnTap = mobilePage.locator("#btn-tap");
      yield* btnTap.evaluate((el) => {
        el.setAttribute("data-tapped", "false");
        el.addEventListener("click", () => {
          el.setAttribute("data-tapped", "true");
        });
      });
      yield* btnTap.tap();
      assert(
        (yield* btnTap.evaluate((el) => el.getAttribute("data-tapped"))) ===
          "true",
      );
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
