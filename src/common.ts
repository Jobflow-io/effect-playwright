import { Readable } from "node:stream";
import { Data, Effect, Option, Stream } from "effect";
import type {
  Dialog,
  Download,
  ElementHandle,
  FileChooser,
  Request,
  Response,
  Worker,
} from "playwright-core";
import { type PlaywrightError, wrapError } from "./errors";
import { PlaywrightFrame, type PlaywrightFrameService } from "./frame";
import { PlaywrightPage, type PlaywrightPageService } from "./page";
import type { PageFunction } from "./playwright-types";
import { useHelper } from "./utils";

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightRequest extends Data.TaggedClass("PlaywrightRequest")<{
  /**
   * An object with all the request HTTP headers associated with this request. The header names are lower-cased.
   * @see {@link Request.allHeaders}
   */
  allHeaders: Effect.Effect<
    Awaited<ReturnType<Request["allHeaders"]>>,
    PlaywrightError
  >;
  /**
   * The method returns null unless this request was a failed one.
   * @see {@link Request.failure}
   */
  failure: () => Option.Option<NonNullable<ReturnType<Request["failure"]>>>;
  /**
   * Returns the Frame that initiated this request.
   * @see {@link Request.frame}
   */
  frame: Effect.Effect<PlaywrightFrameService>;
  /**
   * Returns the value of the header matching the name. The name is case insensitive.
   * @see {@link Request.headerValue}
   */
  headerValue: (
    name: string,
  ) => Effect.Effect<Option.Option<string>, PlaywrightError>;
  /**
   * An object with the request HTTP headers. The header names are lower-cased.
   * @see {@link Request.headers}
   */
  headers: () => ReturnType<Request["headers"]>;
  /**
   * An array with all the request HTTP headers associated with this request.
   * @see {@link Request.headersArray}
   */
  headersArray: Effect.Effect<
    Awaited<ReturnType<Request["headersArray"]>>,
    PlaywrightError
  >;
  /**
   * Whether this request is driving frame's navigation.
   * @see {@link Request.isNavigationRequest}
   */
  isNavigationRequest: () => boolean;
  /**
   * Request's method (GET, POST, etc.)
   * @see {@link Request.method}
   */
  method: () => string;
  /**
   * Request's post body, if any.
   * @see {@link Request.postData}
   */
  postData: () => Option.Option<string>;
  /**
   * Request's post body in a binary form, if any.
   * @see {@link Request.postDataBuffer}
   */
  postDataBuffer: () => Option.Option<
    NonNullable<ReturnType<Request["postDataBuffer"]>>
  >;
  /**
   * Returns parsed request's body for form-urlencoded and JSON requests.
   * @see {@link Request.postDataJSON}
   */
  postDataJSON: Effect.Effect<
    Option.Option<NonNullable<Awaited<ReturnType<Request["postDataJSON"]>>>>,
    PlaywrightError
  >;
  /**
   * Request that was redirected by the server to this one, if any.
   * @see {@link Request.redirectedFrom}
   */
  redirectedFrom: () => Option.Option<PlaywrightRequest>;
  /**
   * New request issued by the browser if the server responded with redirect.
   * @see {@link Request.redirectedTo}
   */
  redirectedTo: () => Option.Option<PlaywrightRequest>;
  /**
   * Contains the request's resource type as it was perceived by the rendering engine.
   * @see {@link Request.resourceType}
   */
  resourceType: () => string;
  /**
   * Returns the matching Response object, or null if the response was not received due to error.
   * @see {@link Request.response}
   */
  response: Effect.Effect<Option.Option<PlaywrightResponse>, PlaywrightError>;
  /**
   * Returns the ServiceWorker that initiated this request.
   * @see {@link Request.serviceWorker}
   */
  serviceWorker: () => Option.Option<PlaywrightWorker>;
  /**
   * Returns resource size information for given request.
   * @see {@link Request.sizes}
   */
  sizes: Effect.Effect<Awaited<ReturnType<Request["sizes"]>>, PlaywrightError>;
  /**
   * Returns resource timing information for given request.
   * @see {@link Request.timing}
   */
  timing: () => ReturnType<Request["timing"]>;
  /**
   * URL of the request.
   * @see {@link Request.url}
   */
  url: () => string;
}> {
  static make(request: Request): PlaywrightRequest {
    const use = useHelper(request);

    return new PlaywrightRequest({
      allHeaders: use(() => request.allHeaders()),
      failure: Option.liftNullable(request.failure),
      frame: Effect.sync(() => PlaywrightFrame.make(request.frame())),
      headerValue: (name) =>
        use(() => request.headerValue(name)).pipe(
          Effect.map(Option.fromNullable),
        ),
      headers: () => request.headers(),
      headersArray: use(() => request.headersArray()),
      isNavigationRequest: () => request.isNavigationRequest(),
      method: () => request.method(),
      postData: Option.liftNullable(request.postData),
      postDataBuffer: Option.liftNullable(request.postDataBuffer),
      postDataJSON: use(() => request.postDataJSON()).pipe(
        Effect.map(Option.fromNullable),
      ),
      redirectedFrom: (): Option.Option<PlaywrightRequest> =>
        Option.fromNullable(request.redirectedFrom()).pipe(
          Option.map(PlaywrightRequest.make),
        ),
      redirectedTo: (): Option.Option<PlaywrightRequest> =>
        Option.fromNullable(request.redirectedTo()).pipe(
          Option.map(PlaywrightRequest.make),
        ),
      resourceType: () => request.resourceType(),
      response: use(() => request.response()).pipe(
        Effect.map(Option.fromNullable),
        Effect.map(Option.map(PlaywrightResponse.make)),
      ),
      serviceWorker: () =>
        Option.fromNullable(request.serviceWorker()).pipe(
          Option.map(PlaywrightWorker.make),
        ),
      sizes: use(() => request.sizes()),
      timing: () => request.timing(),
      url: () => request.url(),
    });
  }
}

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightResponse extends Data.TaggedClass("PlaywrightResponse")<{
  allHeaders: Effect.Effect<
    Awaited<ReturnType<Response["allHeaders"]>>,
    PlaywrightError
  >;
  body: Effect.Effect<Awaited<ReturnType<Response["body"]>>, PlaywrightError>;
  finished: Effect.Effect<
    Awaited<ReturnType<Response["finished"]>>,
    PlaywrightError
  >;
  frame: Effect.Effect<PlaywrightFrameService>;
  fromServiceWorker: Effect.Effect<boolean>;
  headers: () => ReturnType<Response["headers"]>;
  headersArray: Effect.Effect<
    Awaited<ReturnType<Response["headersArray"]>>,
    PlaywrightError
  >;
  headerValue: (
    name: string,
  ) => Effect.Effect<Option.Option<string>, PlaywrightError>;
  headerValues: (
    name: string,
  ) => Effect.Effect<
    Awaited<ReturnType<Response["headerValues"]>>,
    PlaywrightError
  >;
  json: Effect.Effect<Awaited<ReturnType<Response["json"]>>, PlaywrightError>;
  ok: Effect.Effect<boolean>;
  request: () => PlaywrightRequest;
  securityDetails: Effect.Effect<
    Option.Option<
      NonNullable<Awaited<ReturnType<Response["securityDetails"]>>>
    >,
    PlaywrightError
  >;
  serverAddr: Effect.Effect<
    Option.Option<NonNullable<Awaited<ReturnType<Response["serverAddr"]>>>>,
    PlaywrightError
  >;
  status: Effect.Effect<number>;
  statusText: Effect.Effect<string>;
  text: Effect.Effect<Awaited<ReturnType<Response["text"]>>, PlaywrightError>;
  url: () => string;
}> {
  static make(response: Response) {
    const use = useHelper(response);

    return new PlaywrightResponse({
      allHeaders: use(() => response.allHeaders()),
      body: use(() => response.body()),
      finished: use(() => response.finished()),
      frame: Effect.sync(() => PlaywrightFrame.make(response.frame())),
      fromServiceWorker: Effect.sync(() => response.fromServiceWorker()),
      headers: () => response.headers(),
      headersArray: use(() => response.headersArray()),
      headerValue: (name) =>
        use(() => response.headerValue(name)).pipe(
          Effect.map(Option.fromNullable),
        ),
      headerValues: (name) => use(() => response.headerValues(name)),
      json: use(() => response.json()),
      ok: Effect.sync(() => response.ok()),
      request: () => PlaywrightRequest.make(response.request()),
      securityDetails: use(() => response.securityDetails()).pipe(
        Effect.map(Option.fromNullable),
      ),
      serverAddr: use(() => response.serverAddr()).pipe(
        Effect.map(Option.fromNullable),
      ),
      status: Effect.sync(() => response.status()),
      statusText: Effect.sync(() => response.statusText()),
      text: use(() => response.text()),
      url: () => response.url(),
    });
  }
}

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightWorker extends Data.TaggedClass("PlaywrightWorker")<{
  evaluate: <R, Arg = void>(
    pageFunction: PageFunction<Arg, R>,
    arg?: Arg,
  ) => Effect.Effect<R, PlaywrightError>;
  url: () => string;
}> {
  static make(worker: Worker) {
    const use = useHelper(worker);

    return new PlaywrightWorker({
      // biome-ignore lint/suspicious/noExplicitAny: no idea how to type this.. but it's implementation only here
      evaluate: (f, arg) => use((w) => w.evaluate(f as any, arg)),
      url: () => worker.url(),
    });
  }
}

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightDialog extends Data.TaggedClass("PlaywrightDialog")<{
  accept: (promptText?: string) => Effect.Effect<void, PlaywrightError>;
  defaultValue: () => string;
  dismiss: Effect.Effect<void, PlaywrightError>;
  message: () => string;
  page: () => Option.Option<PlaywrightPageService>;
  type: () => string;
}> {
  static make(dialog: Dialog) {
    const use = useHelper(dialog);

    return new PlaywrightDialog({
      accept: (promptText) => use(() => dialog.accept(promptText)),
      defaultValue: () => dialog.defaultValue(),
      dismiss: use(() => dialog.dismiss()),
      message: () => dialog.message(),
      page: () =>
        Option.fromNullable(dialog.page()).pipe(
          Option.map(PlaywrightPage.make),
        ),
      type: () => dialog.type(),
    });
  }
}

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightFileChooser extends Data.TaggedClass(
  "PlaywrightFileChooser",
)<{
  element: () => ElementHandle;
  isMultiple: Effect.Effect<boolean>;
  page: () => PlaywrightPageService;
  setFiles: (
    files: Parameters<FileChooser["setFiles"]>[0],
    options?: Parameters<FileChooser["setFiles"]>[1],
  ) => Effect.Effect<void, PlaywrightError>;
}> {
  static make(fileChooser: FileChooser) {
    const use = useHelper(fileChooser);

    return new PlaywrightFileChooser({
      element: () => fileChooser.element(),
      isMultiple: Effect.sync(() => fileChooser.isMultiple()),
      page: () => PlaywrightPage.make(fileChooser.page()),
      setFiles: (files, options) =>
        use(() => fileChooser.setFiles(files, options)),
    });
  }
}

/**
 * @category model
 * @since 0.1.2
 */
export class PlaywrightDownload extends Data.TaggedClass("PlaywrightDownload")<{
  cancel: Effect.Effect<void, PlaywrightError>;
  /**
   * Creates a stream of the download data.
   * @category custom
   * @since 0.2.0
   */
  stream: Stream.Stream<Uint8Array, PlaywrightError>;
  delete: Effect.Effect<void, PlaywrightError>;
  failure: Effect.Effect<Option.Option<string | null>, PlaywrightError>;
  page: () => PlaywrightPageService;
  path: Effect.Effect<Option.Option<string | null>, PlaywrightError>;
  saveAs: (path: string) => Effect.Effect<void, PlaywrightError>;
  suggestedFilename: Effect.Effect<string>;
  url: () => string;
  use: <R>(
    f: (download: Download) => Promise<R>,
  ) => Effect.Effect<R, PlaywrightError>;
}> {
  static make(download: Download) {
    const use = useHelper(download);

    return new PlaywrightDownload({
      cancel: use(() => download.cancel()),
      stream: use(() =>
        download.createReadStream().then((s) => Readable.toWeb(s)),
      ).pipe(
        Effect.map((s) =>
          Stream.fromReadableStream(
            () => s as ReadableStream<Uint8Array>,
            wrapError,
          ),
        ),
        Stream.unwrap,
      ),
      delete: use(() => download.delete()),
      failure: use(() => download.failure()).pipe(
        Effect.map(Option.fromNullable),
      ),
      page: () => PlaywrightPage.make(download.page()),
      path: use(() => download.path()).pipe(Effect.map(Option.fromNullable)),
      saveAs: (path) => use(() => download.saveAs(path)),
      suggestedFilename: Effect.sync(() => download.suggestedFilename()),
      url: () => download.url(),
      use,
    });
  }
}
