/**
 * Effect-aware wrappers for Playwright requests, responses, workers, dialogs,
 * file choosers, and downloads.
 *
 * @since 0.1.2
 */

import { Readable } from "node:stream";
import { Context, Effect, Option, Stream } from "effect";
import type {
  Dialog as CoreDialog,
  Download as CoreDownload,
  FileChooser as CoreFileChooser,
  Request as CoreRequest,
  Response as CoreResponse,
  Worker as CoreWorker,
  ElementHandle,
} from "playwright-core";
import { type PlaywrightError, wrapError } from "./errors";
import { type Frame, makeFrame } from "./frame";
import { makePage, type Page } from "./page";
import type { PageFunction } from "./playwright-types";
import { makeTracedUse, sanitizeUrl, tracedTry, urlAttributes } from "./tracer";

/**
 * @category models
 * @since 0.1.2
 */
export interface Request {
  /**
   * An object with all the request HTTP headers associated with this request. The header names are lower-cased.
   * @see {@link CoreRequest.allHeaders}
   */
  allHeaders: Effect.Effect<
    Awaited<ReturnType<CoreRequest["allHeaders"]>>,
    PlaywrightError
  >;
  /**
   * Returns the matching Response object, or null if the response was not received yet.
   * @see {@link CoreRequest.existingResponse}
   * @since 0.5.1
   */
  existingResponse: () => Option.Option<Response>;
  /**
   * The method returns null unless this request was a failed one.
   * @see {@link CoreRequest.failure}
   */
  failure: () => Option.Option<NonNullable<ReturnType<CoreRequest["failure"]>>>;
  /**
   * Returns the Frame that initiated this request.
   * @see {@link CoreRequest.frame}
   */
  frame: Effect.Effect<Frame, PlaywrightError>;
  /**
   * Returns the value of the header matching the name. The name is case insensitive.
   * @see {@link CoreRequest.headerValue}
   */
  headerValue: (
    name: string,
  ) => Effect.Effect<Option.Option<string>, PlaywrightError>;
  /**
   * An object with the request HTTP headers. The header names are lower-cased.
   * @see {@link CoreRequest.headers}
   */
  headers: () => ReturnType<CoreRequest["headers"]>;
  /**
   * An array with all the request HTTP headers associated with this request.
   * @see {@link CoreRequest.headersArray}
   */
  headersArray: Effect.Effect<
    Awaited<ReturnType<CoreRequest["headersArray"]>>,
    PlaywrightError
  >;
  /**
   * Whether this request is driving frame's navigation.
   * @see {@link CoreRequest.isNavigationRequest}
   */
  isNavigationRequest: () => boolean;
  /**
   * Request's method (GET, POST, etc.)
   * @see {@link CoreRequest.method}
   */
  method: () => string;
  /**
   * Request's post body, if any.
   * @see {@link CoreRequest.postData}
   */
  postData: () => Option.Option<string>;
  /**
   * Request's post body in a binary form, if any.
   * @see {@link CoreRequest.postDataBuffer}
   */
  postDataBuffer: () => Option.Option<
    NonNullable<ReturnType<CoreRequest["postDataBuffer"]>>
  >;
  /**
   * Returns parsed request's body for form-urlencoded and JSON requests.
   * @see {@link CoreRequest.postDataJSON}
   */
  postDataJSON: Effect.Effect<
    Option.Option<
      NonNullable<Awaited<ReturnType<CoreRequest["postDataJSON"]>>>
    >,
    PlaywrightError
  >;
  /**
   * Request that was redirected by the server to this one, if any.
   * @see {@link CoreRequest.redirectedFrom}
   */
  redirectedFrom: () => Option.Option<Request>;
  /**
   * New request issued by the browser if the server responded with redirect.
   * @see {@link CoreRequest.redirectedTo}
   */
  redirectedTo: () => Option.Option<Request>;
  /**
   * Contains the request's resource type as it was perceived by the rendering engine.
   * @see {@link CoreRequest.resourceType}
   */
  resourceType: () => string;
  /**
   * Returns the matching Response object, or null if the response was not received due to error.
   * @see {@link CoreRequest.response}
   */
  response: Effect.Effect<Option.Option<Response>, PlaywrightError>;
  /**
   * Returns the ServiceWorker that initiated this request.
   * @see {@link CoreRequest.serviceWorker}
   */
  serviceWorker: () => Option.Option<Worker>;
  /**
   * Returns resource size information for given request.
   * @see {@link CoreRequest.sizes}
   */
  sizes: Effect.Effect<
    Awaited<ReturnType<CoreRequest["sizes"]>>,
    PlaywrightError
  >;
  /**
   * Returns resource timing information for given request.
   * @see {@link CoreRequest.timing}
   */
  timing: () => ReturnType<CoreRequest["timing"]>;
  /**
   * URL of the request.
   * @see {@link CoreRequest.url}
   */
  url: () => string;
}

/**
 * Service for a {@link Request}.
 *
 * @category services
 * @since 0.1.2
 */
export const Request = Context.Service<Request>(
  "effect-playwright/common/Request",
);

/**
 * Creates a `Request` from a Playwright `Request` instance.
 *
 * @param request - The Playwright `Request` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeRequest = (request: CoreRequest): Request => {
  const { traced } = makeTracedUse(
    request,
    "Request",
    () => ({
      "http.request.method": request.method(),
      ...urlAttributes(request.url()),
    }),
    () => sanitizeUrl(request.url()),
  );

  return Request.of({
    allHeaders: traced("allHeaders", (r) => r.allHeaders()),
    existingResponse: (): Option.Option<Response> =>
      Option.fromNullishOr(request.existingResponse()).pipe(
        Option.map(makeResponse),
      ),
    failure: () => Option.fromNullishOr(request.failure()),
    frame: tracedTry("Request", "frame", () => makeFrame(request.frame()), {
      getTarget: () => sanitizeUrl(request.url()),
    }),
    headerValue: (name) =>
      traced("headerValue", (r) => r.headerValue(name)).pipe(
        Effect.map(Option.fromNullishOr),
      ),
    headers: () => request.headers(),
    headersArray: traced("headersArray", (r) => r.headersArray()),
    isNavigationRequest: () => request.isNavigationRequest(),
    method: () => request.method(),
    postData: () => Option.fromNullishOr(request.postData()),
    postDataBuffer: () => Option.fromNullishOr(request.postDataBuffer()),
    postDataJSON: tracedTry("Request", "postDataJSON", () =>
      request.postDataJSON(),
    ).pipe(Effect.map(Option.fromNullishOr)),
    redirectedFrom: (): Option.Option<Request> =>
      Option.fromNullishOr(request.redirectedFrom()).pipe(
        Option.map(makeRequest),
      ),
    redirectedTo: (): Option.Option<Request> =>
      Option.fromNullishOr(request.redirectedTo()).pipe(
        Option.map(makeRequest),
      ),
    resourceType: () => request.resourceType(),
    response: traced("response", (r) => r.response()).pipe(
      Effect.map(Option.fromNullishOr),
      Effect.map(Option.map(makeResponse)),
    ),
    serviceWorker: () =>
      Option.fromNullishOr(request.serviceWorker()).pipe(
        Option.map(makeWorker),
      ),
    sizes: traced("sizes", (r) => r.sizes()),
    timing: () => request.timing(),
    url: () => request.url(),
  });
};

/**
 * @category models
 * @since 0.1.2
 */
export interface Response {
  allHeaders: Effect.Effect<
    Awaited<ReturnType<CoreResponse["allHeaders"]>>,
    PlaywrightError
  >;
  body: Effect.Effect<
    Awaited<ReturnType<CoreResponse["body"]>>,
    PlaywrightError
  >;
  finished: Effect.Effect<
    Awaited<ReturnType<CoreResponse["finished"]>>,
    PlaywrightError
  >;
  frame: Effect.Effect<Frame, PlaywrightError>;
  fromServiceWorker: () => boolean;
  headers: () => ReturnType<CoreResponse["headers"]>;
  headersArray: Effect.Effect<
    Awaited<ReturnType<CoreResponse["headersArray"]>>,
    PlaywrightError
  >;
  headerValue: (
    name: string,
  ) => Effect.Effect<Option.Option<string>, PlaywrightError>;
  headerValues: (
    name: string,
  ) => Effect.Effect<
    Awaited<ReturnType<CoreResponse["headerValues"]>>,
    PlaywrightError
  >;
  /**
   * Returns the HTTP version of the response.
   * @see {@link CoreResponse.httpVersion}
   * @since 0.5.1
   */
  httpVersion: Effect.Effect<
    Awaited<ReturnType<CoreResponse["httpVersion"]>>,
    PlaywrightError
  >;
  json: Effect.Effect<
    Awaited<ReturnType<CoreResponse["json"]>>,
    PlaywrightError
  >;
  ok: () => boolean;
  request: () => Request;
  securityDetails: Effect.Effect<
    Option.Option<
      NonNullable<Awaited<ReturnType<CoreResponse["securityDetails"]>>>
    >,
    PlaywrightError
  >;
  serverAddr: Effect.Effect<
    Option.Option<NonNullable<Awaited<ReturnType<CoreResponse["serverAddr"]>>>>,
    PlaywrightError
  >;
  status: () => number;
  statusText: () => string;
  text: Effect.Effect<
    Awaited<ReturnType<CoreResponse["text"]>>,
    PlaywrightError
  >;
  url: () => string;
}

/**
 * Service for a {@link Response}.
 *
 * @category services
 * @since 0.1.2
 */
export const Response = Context.Service<Response>(
  "effect-playwright/common/Response",
);

/**
 * Creates a `Response` from a Playwright `Response` instance.
 *
 * @param response - The Playwright `Response` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeResponse = (response: CoreResponse): Response => {
  const { traced } = makeTracedUse(
    response,
    "Response",
    () => ({
      "http.response.status_code": response.status(),
      ...urlAttributes(response.url()),
    }),
    () => sanitizeUrl(response.url()),
  );

  return Response.of({
    allHeaders: traced("allHeaders", (r) => r.allHeaders()),
    body: traced("body", (r) => r.body()),
    finished: traced("finished", (r) => r.finished()),
    frame: tracedTry("Response", "frame", () => makeFrame(response.frame()), {
      getTarget: () => sanitizeUrl(response.url()),
    }),
    fromServiceWorker: () => response.fromServiceWorker(),
    headers: () => response.headers(),
    headersArray: traced("headersArray", (r) => r.headersArray()),
    headerValue: (name) =>
      traced("headerValue", (r) => r.headerValue(name)).pipe(
        Effect.map(Option.fromNullishOr),
      ),
    headerValues: (name) => traced("headerValues", (r) => r.headerValues(name)),
    httpVersion: traced("httpVersion", (r) => r.httpVersion()),
    json: traced("json", (r) => r.json()),
    ok: () => response.ok(),
    request: () => makeRequest(response.request()),
    securityDetails: traced("securityDetails", (r) => r.securityDetails()).pipe(
      Effect.map(Option.fromNullishOr),
    ),
    serverAddr: traced("serverAddr", (r) => r.serverAddr()).pipe(
      Effect.map(Option.fromNullishOr),
    ),
    status: () => response.status(),
    statusText: () => response.statusText(),
    text: traced("text", (r) => r.text()),
    url: () => response.url(),
  });
};

/**
 * @category models
 * @since 0.1.2
 */
export interface Worker {
  evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
  ) => Effect.Effect<R, PlaywrightError>;
  url: () => string;
}

/**
 * Service for a {@link Worker}.
 *
 * @category services
 * @since 0.1.2
 */
export const Worker = Context.Service<Worker>(
  "effect-playwright/common/Worker",
);

/**
 * Creates a `Worker` from a Playwright `Worker` instance.
 *
 * @param worker - The Playwright `Worker` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeWorker = (worker: CoreWorker): Worker => {
  const { traced } = makeTracedUse(
    worker,
    "Worker",
    () => urlAttributes(worker.url()),
    () => sanitizeUrl(worker.url()),
  );

  return Worker.of({
    evaluate: <R, Arg>(f: PageFunction<Arg, R>, arg?: Arg) =>
      traced("evaluate", (worker) =>
        worker.evaluate<R, Arg>(
          // Playwright's overload cannot preserve the wrapper's generic function type.
          f as unknown as Parameters<typeof worker.evaluate<R, Arg>>[0],
          arg as Arg,
        ),
      ),
    url: () => worker.url(),
  });
};

/**
 * @category models
 * @since 0.1.2
 */
export interface Dialog {
  accept: (promptText?: string) => Effect.Effect<void, PlaywrightError>;
  defaultValue: () => string;
  dismiss: Effect.Effect<void, PlaywrightError>;
  message: () => string;
  page: () => Option.Option<Page>;
  type: () => string;
}

/**
 * Service for a {@link Dialog}.
 *
 * @category services
 * @since 0.1.2
 */
export const Dialog = Context.Service<Dialog>(
  "effect-playwright/common/Dialog",
);

/**
 * Creates a `Dialog` from a Playwright `Dialog` instance.
 *
 * @param dialog - The Playwright `Dialog` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeDialog = (dialog: CoreDialog): Dialog => {
  const { traced } = makeTracedUse(dialog, "Dialog", () => ({
    "playwright.dialog.type": dialog.type(),
  }));

  return Dialog.of({
    accept: (promptText) => traced("accept", (d) => d.accept(promptText)),
    defaultValue: () => dialog.defaultValue(),
    dismiss: traced("dismiss", (d) => d.dismiss()),
    message: () => dialog.message(),
    page: () => Option.fromNullishOr(dialog.page()).pipe(Option.map(makePage)),
    type: () => dialog.type(),
  });
};

/**
 * @category models
 * @since 0.1.2
 */
export interface FileChooser {
  element: () => ElementHandle;
  isMultiple: () => boolean;
  page: () => Page;
  setFiles: (
    files: Parameters<CoreFileChooser["setFiles"]>[0],
    options?: Parameters<CoreFileChooser["setFiles"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}

/**
 * Service for a {@link FileChooser}.
 *
 * @category services
 * @since 0.1.2
 */
export const FileChooser = Context.Service<FileChooser>(
  "effect-playwright/common/FileChooser",
);

/**
 * Creates a `FileChooser` from a Playwright `FileChooser` instance.
 *
 * @param fileChooser - The Playwright `FileChooser` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeFileChooser = (fileChooser: CoreFileChooser): FileChooser => {
  const { traced } = makeTracedUse(fileChooser, "FileChooser");

  return FileChooser.of({
    element: () => fileChooser.element(),
    isMultiple: () => fileChooser.isMultiple(),
    page: () => makePage(fileChooser.page()),
    setFiles: (files, options) =>
      traced("setFiles", (fc) => fc.setFiles(files, options)),
  });
};

/**
 * @category models
 * @since 0.1.2
 */
export interface Download {
  cancel: Effect.Effect<void, PlaywrightError>;
  /**
   * Creates a stream of the download data.
   * @category event streams
   * @since 0.2.0
   */
  stream: Stream.Stream<Uint8Array, PlaywrightError>;
  delete: Effect.Effect<void, PlaywrightError>;
  failure: Effect.Effect<Option.Option<string | null>, PlaywrightError>;
  page: () => Page;
  path: Effect.Effect<Option.Option<string | null>, PlaywrightError>;
  saveAs: (path: string) => Effect.Effect<void, PlaywrightError>;
  suggestedFilename: () => string;
  url: () => string;
  use: <R>(
    f: (download: CoreDownload) => Promise<R>,
  ) => Effect.Effect<R, PlaywrightError>;
}

/**
 * Service for a {@link Download}.
 *
 * @category services
 * @since 0.1.2
 */
export const Download = Context.Service<Download>(
  "effect-playwright/common/Download",
);

/**
 * Creates a `Download` from a Playwright `Download` instance.
 *
 * @param download - The Playwright `Download` instance to wrap.
 * @category constructors
 * @since 0.1.2
 */
export const makeDownload = (download: CoreDownload): Download => {
  const { traced, use } = makeTracedUse(
    download,
    "Download",
    () => urlAttributes(download.url()),
    () => sanitizeUrl(download.url()),
  );

  return Download.of({
    cancel: traced("cancel", (d) => d.cancel()),
    stream: traced("stream", (d) =>
      d.createReadStream().then((s) => Readable.toWeb(s)),
    ).pipe(
      Effect.map((s) =>
        Stream.fromReadableStream({
          evaluate: () => s as ReadableStream<Uint8Array>,
          onError: wrapError,
        }),
      ),
      Stream.unwrap,
    ),
    delete: traced("delete", (d) => d.delete()),
    failure: traced("failure", (d) => d.failure()).pipe(
      Effect.map(Option.fromNullishOr),
    ),
    page: () => makePage(download.page()),
    path: traced("path", (d) => d.path()).pipe(
      Effect.map(Option.fromNullishOr),
    ),
    saveAs: (path) => traced("saveAs", (d) => d.saveAs(path)),
    suggestedFilename: () => download.suggestedFilename(),
    url: () => download.url(),
    use,
  });
};
