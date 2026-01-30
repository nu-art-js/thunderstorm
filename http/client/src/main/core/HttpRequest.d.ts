import { Logger } from '@nu-art/ts-common';
import { ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError } from '@nu-art/ts-common/core/exceptions/types';
import { AxiosRequestConfig as Axios_RequestConfig, AxiosResponse as Axios_Response } from 'axios';
import { HttpException } from '../exceptions/HttpException.js';
import { TS_Progress } from '../types/error-types.js';
import type { HttpClient } from './HttpClient.js';
import { ApiDef, HttpMethod, GeneralApi } from '../types/api-types.js';
/**
 * Typed HTTP request with fluent builder API and comprehensive logging.
 *
 * Provides a type-safe, chainable interface for building and executing HTTP requests.
 * Extends Logger for built-in request lifecycle logging (verbose, debug, info, warning, error).
 *
 * Features:
 * - Type-safe request/response handling via TypedApi generics
 * - Fluent builder pattern for configuration
 * - Automatic JSON parsing of responses
 * - Request cancellation via AbortController
 * - Callback chaining for error and completion handlers
 * - Comprehensive logging at all stages
 *
 * @template API - Typed API definition specifying method, response, body, params, and error types
 */
export declare class HttpRequest<API extends GeneralApi> extends Logger {
    key: string;
    requestData: any;
    protected origin?: string;
    protected headers: {
        [s: string]: string[];
    };
    protected method: HttpMethod;
    protected timeout: number;
    protected body: API['B'];
    protected url: string;
    protected params: {
        [K in keyof API['P']]?: API['P'][K];
    };
    protected responseType: string;
    protected label: string;
    protected onProgressListener: (ev: TS_Progress) => void;
    protected aborted: boolean;
    protected compress: boolean;
    private onCompleted?;
    private onError?;
    private response?;
    private cancelController;
    protected status?: number;
    private requestOption;
    private readonly client;
    /**
     * Creates a new HTTP request bound to a client.
     * Config (origin, timeout, headers) is taken from the client; execute() calls client.sendRequest().
     *
     * @param apiDef - API definition (method, path, optional timeout)
     * @param client - HttpClient that provides config and performs the send
     * @param requestData - Optional data (used as request key identifier)
     */
    constructor(apiDef: ApiDef<API>, client: HttpClient, requestData?: any);
    resolveTypedException(exception: HttpException<any> | unknown): API['E'] | undefined;
    getRequestData(): any;
    setOrigin(origin?: string): this;
    setOnProgressListener(onProgressListener: (ev: TS_Progress) => void): this;
    setLabel(label: string): this;
    setMethod(method: HttpMethod): this;
    setResponseType(responseType: string): this;
    setUrlParams(params: API['P']): this;
    setUrlParam<K extends keyof API['P'] = keyof API['P']>(key: K, value: API['P'][K]): this;
    setUrl(url: string): this;
    getUrl(): string;
    /**
     * Sets a relative URL path, composing it with the origin.
     *
     * Automatically removes leading slashes from the relative path and combines
     * with origin. Requires origin to be set first.
     *
     * @param relativeUrl - Relative path (leading slash is removed if present)
     * @returns This instance for chaining
     * @throws BadImplementationException if origin is not set
     */
    setRelativeUrl(relativeUrl: string): this;
    setTimeout(timeout: number): this;
    setHeaders(headers: {
        [s: string]: string | string[];
    }): this;
    addHeaders(headers: {
        [s: string]: string | string[];
    }): this;
    /**
     * Sets a header, replacing any existing values for the key.
     *
     * Header keys are normalized to lowercase. Multiple calls to setHeader
     * for the same key will replace previous values.
     *
     * @param _key - Header name (case-insensitive, normalized to lowercase)
     * @param value - Header value(s)
     * @returns This instance for chaining
     */
    setHeader(_key: string, value: string | string[]): this;
    /**
     * Adds a header value, appending to existing values if the key already exists.
     *
     * Header keys are normalized to lowercase. Multiple values for the same header
     * are joined with '; ' when the request is executed.
     *
     * @param _key - Header name (case-insensitive, normalized to lowercase)
     * @param value - Header value(s) to append
     * @returns This instance for chaining
     */
    addHeader(_key: string, value: string | string[]): this;
    removeHeader(key: string): this;
    protected _addHeaderImpl(key: string, value: string | string[]): this;
    protected prepareJsonBody(bodyObject: API['B']): any;
    setBodyAsJson(bodyObject: API['B'], compress?: boolean): this;
    /**
     * Sets the request body.
     *
     * If compression is enabled and body is a string, automatically adds
     * 'Content-encoding: gzip' header.
     *
     * @param bodyAsString - Request body (any type)
     * @param _compress - Override compression setting (optional)
     * @returns This instance for chaining
     */
    setBody(bodyAsString: any, _compress?: boolean): this;
    isValidStatus(statusCode: number): boolean;
    protected print(): void;
    /**
     * Executes the HTTP request and returns the typed response.
     *
     * Process:
     * 1. Validates request isn't aborted
     * 2. Composes full URL with query parameters
     * 3. Prepares headers (joins multiple values with '; ')
     * 4. Sends request via Axios
     * 5. Validates response status (200-299 considered success)
     * 6. Attempts JSON parsing (falls back to raw response if not JSON)
     * 7. Calls completion/error callbacks
     *
     * Automatically handles:
     * - Request cancellation (AbortController)
     * - Error response parsing
     * - JSON response parsing
     * - Callback execution (onError for failures, onCompleted for success)
     *
     * @param print - If true, logs request details (URL, params, headers) before execution
     * @returns Typed response data (API['R'])
     * @throws HttpException if request fails or returns non-2xx status
     */
    execute(print?: boolean): Promise<API['R']>;
    clearOnCompleted: () => void;
    /**
     * Generic callback chaining helper.
     *
     * Chains multiple callbacks of the same type, executing them in order.
     * If an existing callback exists, both are executed (existing first, then new).
     *
     * @template T - Callback function type
     * @param existingCallback - Previously set callback (if any)
     * @param newCallback - New callback to add
     * @param setter - Function to set the final callback
     * @returns This instance for chaining
     */
    private setCallback;
    setOnCompleted: (onCompleted?: (response: API["R"], input: API["P"] | API["B"], request: HttpRequest<API>) => Promise<any>) => this;
    setOnError(onError?: (errorResponse: HttpException<API['E']>) => Promise<any>): this;
    getStatus(): number;
    getResponse(): any;
    /**
     * Gets the full Axios response object.
     *
     * Returns the complete Axios response including:
     * - status, statusText
     * - headers (full object)
     * - data (response body)
     * - config (request configuration)
     *
     * Useful when you need access to response metadata beyond just the body,
     * such as response headers, status text, or the full request configuration.
     *
     * @returns Full Axios response object
     * @throws BadImplementationException if response is not yet available (execute() hasn't been called)
     */
    getRawResponse(): Axios_Response<API['R']>;
    /**
     * Extracts error response from the HTTP response.
     *
     * Returns a basic error response structure with the raw response data
     * as the debug message. Used when status validation fails.
     *
     * @returns Error response structure with debug message
     */
    getErrorResponse(): ApiErrorResponse<ResponseError | ApiError_GeneralErrorMessage>;
    private abortImpl;
    setRequestOption(requestOption: Axios_RequestConfig): this;
    _getResponseHeader(headerKey: string): string | string[] | undefined;
    getResponseHeader(headerKey: string): string | string[] | undefined;
    /**
     * Aborts the HTTP request.
     *
     * Marks the request as aborted and triggers the AbortController signal,
     * which cancels the underlying Axios request. If executed before the request
     * completes, the execute() method will throw an HttpException with status 0.
     */
    abort(): void;
}
