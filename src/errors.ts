import { Data } from "effect";
import { errors } from "playwright-core";

export type PlaywrightErrorReason = "Timeout" | "Unknown";

export class PlaywrightError extends Data.TaggedError("PlaywrightError")<{
  reason: PlaywrightErrorReason;
  cause: unknown;
}> {}

export function wrapError(error: unknown): PlaywrightError {
  if (error instanceof errors.TimeoutError) {
    return new PlaywrightError({
      reason: "Timeout",
      cause: error,
    });
  } else {
    return new PlaywrightError({
      reason: "Unknown",
      cause: error,
    });
  }
}
