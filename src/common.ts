/**
 * Effect-aware wrappers for Playwright requests, responses, workers, dialogs,
 * file choosers, and downloads.
 *
 * @since 0.1.2
 */

import { Readable } from "node:stream";
import { Data, Effect, Option, Stream } from "effect";
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
import { useHelper } from "./utils";

/**
 * @category models
 * @since 0.1.2
 */
export class Request extends Data.TaggedClass(
  "effect-playwright/common/Request",
)<{
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
}> {
  static make(request: CoreRequest): Request {
    const use = useHelper(request);

    return new Request({
      allHeaders: use(() => request.allHeaders()),
      existingResponse: (): Option.Option<Response> =>
        Option.fromNullishOr(request.existingResponse()).pipe(
          Option.map(Response.make),
        ),
      failure: Option.liftNullishOr(request.failure),
      frame: Effect.try({
        try: () => makeFrame(request.frame()),
        catch: wrapError,
      }),
      headerValue: (name) =>
        use(() => request.headerValue(name)).pipe(
          Effect.map(Option.fromNullishOr),
        ),
      headers: () => request.headers(),
      headersArray: use(() => request.headersArray()),
      isNavigationRequest: () => request.isNavigationRequest(),
      method: () => request.method(),
      postData: Option.liftNullishOr(request.postData),
      postDataBuffer: Option.liftNullishOr(request.postDataBuffer),
      postDataJSON: use(() => request.postDataJSON()).pipe(
        Effect.map(Option.fromNullishOr),
      ),
      redirectedFrom: (): Option.Option<Request> =>
        Option.fromNullishOr(request.redirectedFrom()).pipe(
          Option.map(Request.make),
        ),
      redirectedTo: (): Option.Option<Request> =>
        Option.fromNullishOr(request.redirectedTo()).pipe(
          Option.map(Request.make),
        ),
      resourceType: () => request.resourceType(),
      response: use(() => request.response()).pipe(
        Effect.map(Option.fromNullishOr),
        Effect.map(Option.map(Response.make)),
      ),
      serviceWorker: () =>
        Option.fromNullishOr(request.serviceWorker()).pipe(
          Option.map(Worker.make),
        ),
      sizes: use(() => request.sizes()),
      timing: () => request.timing(),
      url: () => request.url(),
    });
  }
}

/**
 * @category models
 * @since 0.1.2
 */
export class Response extends Data.TaggedClass(
  "effect-playwright/common/Response",
)<{
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
}> {
  static make(response: CoreResponse) {
    const use = useHelper(response);

    return new Response({
      allHeaders: use(() => response.allHeaders()),
      body: use(() => response.body()),
      finished: use(() => response.finished()),
      frame: Effect.try({
        try: () => makeFrame(response.frame()),
        catch: wrapError,
      }),
      fromServiceWorker: () => response.fromServiceWorker(),
      headers: () => response.headers(),
      headersArray: use(() => response.headersArray()),
      headerValue: (name) =>
        use(() => response.headerValue(name)).pipe(
          Effect.map(Option.fromNullishOr),
        ),
      headerValues: (name) => use(() => response.headerValues(name)),
      httpVersion: use(() => response.httpVersion()),
      json: use(() => response.json()),
      ok: () => response.ok(),
      request: () => Request.make(response.request()),
      securityDetails: use(() => response.securityDetails()).pipe(
        Effect.map(Option.fromNullishOr),
      ),
      serverAddr: use(() => response.serverAddr()).pipe(
        Effect.map(Option.fromNullishOr),
      ),
      status: () => response.status(),
      statusText: () => response.statusText(),
      text: use(() => response.text()),
      url: () => response.url(),
    });
  }
}

/**
 * @category models
 * @since 0.1.2
 */
export class Worker extends Data.TaggedClass(
  "effect-playwright/common/Worker",
)<{
  evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
  ) => Effect.Effect<R, PlaywrightError>;
  url: () => string;
}> {
  static make(worker: CoreWorker) {
    const use = useHelper(worker);

    return new Worker({
      evaluate: <R, Arg>(f: PageFunction<Arg, R>, arg?: Arg) =>
        use((worker) =>
          worker.evaluate<R, Arg>(
            // Playwright's overload cannot preserve the wrapper's generic function type.
            f as unknown as Parameters<typeof worker.evaluate<R, Arg>>[0],
            arg as Arg,
          ),
        ),
      url: () => worker.url(),
    });
  }
}

/**
 * @category models
 * @since 0.1.2
 */
export class Dialog extends Data.TaggedClass(
  "effect-playwright/common/Dialog",
)<{
  accept: (promptText?: string) => Effect.Effect<void, PlaywrightError>;
  defaultValue: () => string;
  dismiss: Effect.Effect<void, PlaywrightError>;
  message: () => string;
  page: () => Option.Option<Page>;
  type: () => string;
}> {
  static make(dialog: CoreDialog) {
    const use = useHelper(dialog);

    return new Dialog({
      accept: (promptText) => use(() => dialog.accept(promptText)),
      defaultValue: () => dialog.defaultValue(),
      dismiss: use(() => dialog.dismiss()),
      message: () => dialog.message(),
      page: () =>
        Option.fromNullishOr(dialog.page()).pipe(Option.map(makePage)),
      type: () => dialog.type(),
    });
  }
}

/**
 * @category models
 * @since 0.1.2
 */
export class FileChooser extends Data.TaggedClass(
  "effect-playwright/common/FileChooser",
)<{
  element: () => ElementHandle;
  isMultiple: () => boolean;
  page: () => Page;
  setFiles: (
    files: Parameters<CoreFileChooser["setFiles"]>[0],
    options?: Parameters<CoreFileChooser["setFiles"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}> {
  static make(fileChooser: CoreFileChooser) {
    const use = useHelper(fileChooser);

    return new FileChooser({
      element: () => fileChooser.element(),
      isMultiple: () => fileChooser.isMultiple(),
      page: () => makePage(fileChooser.page()),
      setFiles: (files, options) =>
        use(() => fileChooser.setFiles(files, options)),
    });
  }
}

/**
 * @category models
 * @since 0.1.2
 */
export class Download extends Data.TaggedClass(
  "effect-playwright/common/Download",
)<{
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
}> {
  static make(download: CoreDownload) {
    const use = useHelper(download);

    return new Download({
      cancel: use(() => download.cancel()),
      stream: use(() =>
        download.createReadStream().then((s) => Readable.toWeb(s)),
      ).pipe(
        Effect.map((s) =>
          Stream.fromReadableStream({
            evaluate: () => s as ReadableStream<Uint8Array>,
            onError: wrapError,
          }),
        ),
        Stream.unwrap,
      ),
      delete: use(() => download.delete()),
      failure: use(() => download.failure()).pipe(
        Effect.map(Option.fromNullishOr),
      ),
      page: () => makePage(download.page()),
      path: use(() => download.path()).pipe(Effect.map(Option.fromNullishOr)),
      saveAs: (path) => use(() => download.saveAs(path)),
      suggestedFilename: () => download.suggestedFilename(),
      url: () => download.url(),
      use,
    });
  }
}
