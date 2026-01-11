import { Context, Effect } from "effect";
import type { UnknownException } from "effect/Cause";
import type { BrowserContext } from "playwright-core";
import { PlaywrightPage } from "./page";

export class PlaywrightBrowserContext extends Context.Tag(
  "cehs/backend/lib/playwright/PlaywrightBrowserContext",
)<
  PlaywrightBrowserContext,
  {
    readonly pages: Effect.Effect<Array<typeof PlaywrightPage.Service>>;
    readonly newPage: Effect.Effect<
      typeof PlaywrightPage.Service,
      UnknownException
    >;
    readonly close: Effect.Effect<void, UnknownException>;
  }
>() {
  static make(context: BrowserContext) {
    const use = <T>(f: (context: BrowserContext) => Promise<T>) =>
      Effect.tryPromise(() => f(context));
    return PlaywrightBrowserContext.of({
      pages: Effect.sync(() => context.pages().map(PlaywrightPage.make)),
      newPage: use(async (c) => PlaywrightPage.make(await c.newPage())),
      close: use((c) => c.close()),
    });
  }
}
