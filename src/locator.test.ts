/// <reference lib="dom" />
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
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
      // const spanLocator = page.locator("span");
      // const nestedSpanHtml = yield* htmlDiv.locator(spanLocator).innerHTML();
      // assert(nestedSpanHtml === "Hello");

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

      // evaluate
      const evalResult = yield* buttons.first().evaluate((el, arg) => {
        return el.getAttribute("data-info") + arg;
      }, "-suffix");
      assert(evalResult === "first-suffix");

      // use
      const useResult = yield* buttons
        .first()
        .use((l) => l.evaluate((el) => el.id));
      assert(useResult === "btn-1");
    }).pipe(PlaywrightEnvironment.withBrowser),
  );
});
