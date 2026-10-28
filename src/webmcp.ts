/**
 * Effect service wrapper for tools registered through the WebMCP browser API.
 *
 * @since 0.9.0
 */

import { Context, type Effect } from "effect";
import type { WebMCP as CoreWebMCP } from "playwright-core";
import type { PlaywrightError } from "./errors";
import { useHelper } from "./utils";

/**
 * Hints a page provides about a WebMCP tool.
 *
 * @category models
 * @since 0.9.0
 */
export interface WebMCPToolAnnotations {
  /** The tool does not modify any state. */
  readonly readOnly?: boolean;
  /** The tool output may contain third-party content. */
  readonly untrustedContent?: boolean;
  /** The tool takes a consequential action, such as placing an order. */
  readonly consequential?: boolean;
}

/**
 * A tool registered by a frame through the WebMCP browser API.
 *
 * @see {@link CoreWebMCP.tools}
 * @category models
 * @since 0.9.0
 */
export interface WebMCPTool {
  /** Tool name, unique within the frame. */
  readonly name: string;
  /** Tool description. */
  readonly description: string;
  /** JSON Schema of the tool input, when the page provides one. */
  readonly inputSchema?: unknown;
  /** Hints the page provides about the tool. */
  readonly annotations?: WebMCPToolAnnotations;
}

/**
 * Tools that a frame registers through the experimental
 * [WebMCP](https://webmachinelearning.github.io/webmcp/) browser API.
 *
 * **Gotchas**
 *
 * WebMCP must be enabled when the browser launches. In Chromium, pass
 * `--enable-features=WebMCP`; WebKit does not support it. `Page.webmcp` only
 * covers the main frame, so child frames list their tools through their own
 * `Frame.webmcp`.
 *
 * @example
 * ```ts
 * import { Effect } from "effect";
 * import { Playwright } from "effect-playwright";
 * import { chromium } from "playwright-core";
 *
 * const program = Effect.gen(function* () {
 *   const playwright = yield* Playwright.Playwright;
 *   const browser = yield* playwright.launchScoped(chromium, {
 *     args: ["--enable-features=WebMCP"],
 *   });
 *   const page = yield* browser.newPage();
 *   yield* page.goto("https://example.com");
 *
 *   const tools = yield* page.webmcp.tools();
 *   const result = yield* page.webmcp.callTool("add", { a: 2, b: 40 });
 *   return { tools, result };
 * }).pipe(Effect.scoped, Effect.provide(Playwright.layer));
 * ```
 *
 * @see {@link CoreWebMCP}
 * @category models
 * @since 0.9.0
 */
export interface WebMCP {
  /**
   * Calls a tool registered by the frame and returns its result.
   *
   * The result is whatever the tool's `execute` function resolved to. A result
   * with `isError: true` succeeds as is; the effect fails when the tool is not
   * registered or its `execute` function throws.
   *
   * @see {@link CoreWebMCP.callTool}
   * @since 0.9.0
   */
  readonly callTool: (
    name: string,
    input?: unknown,
    options?: Parameters<CoreWebMCP["callTool"]>[2],
  ) => Effect.Effect<unknown, PlaywrightError>;

  /**
   * Returns the tools currently registered by the frame.
   *
   * Fails if the browser was launched without WebMCP support.
   *
   * @see {@link CoreWebMCP.tools}
   * @since 0.9.0
   */
  readonly tools: (
    options?: Parameters<CoreWebMCP["tools"]>[0],
  ) => Effect.Effect<ReadonlyArray<WebMCPTool>, PlaywrightError>;
}

/**
 * @category services
 * @since 0.9.0
 */
export const WebMCP = Context.Service<WebMCP>(
  "effect-playwright/webmcp/WebMCP",
);

/**
 * Creates `WebMCP` from a Playwright `WebMCP` instance.
 *
 * @param webmcp - The Playwright `WebMCP` instance to wrap.
 * @category constructors
 * @since 0.9.0
 */
export const makeWebMCP = (webmcp: CoreWebMCP): WebMCP => {
  const use = useHelper(webmcp);
  return WebMCP.of({
    callTool: (name, input, options) =>
      use((w) => w.callTool(name, input, options)),
    tools: (options) => use((w) => w.tools(options)),
  });
};
