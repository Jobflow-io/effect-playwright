import { Effect } from "effect";
import { wrapError } from "./errors";

/** @internal */
export const useHelper =
  <Wrap>(api: Wrap) =>
  <A>(userFunction: (api: Wrap) => Promise<A>) =>
    Effect.tryPromise(() => userFunction(api)).pipe(Effect.mapError(wrapError));
