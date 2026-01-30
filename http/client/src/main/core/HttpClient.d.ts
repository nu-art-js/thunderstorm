import { Logger } from '@nu-art/ts-common';
import { HttpRequest } from './HttpRequest.js';
import { AxiosRequestConfig as Axios_RequestConfig, AxiosResponse as Axios_Response } from 'axios';
import { HttpException } from '../exceptions/HttpException.js';
import { ApiDef, GeneralApi } from '../types/api-types.js';
/**
 * HTTP client configuration.
 */
export type HttpConfig = {
    origin?: string;
    timeout?: number;
    compress?: boolean;
};
/**
 * HTTP client for creating and configuring typed HTTP requests.
 *
 * Manages default configuration (origin, timeout, compression, headers) and provides
 * a factory method for creating typed HttpRequest instances. All requests created
 * from this client inherit the default configuration and callbacks.
 *
 * Extends Logger for built-in logging capabilities.
 */
export declare class HttpClient extends Logger {
    protected origin?: string;
    protected timeout: number;
    protected compress: boolean;
    private readonly defaultHeaders;
    protected defaultOnComplete?: (response: unknown, input: unknown, request: HttpRequest<any>) => Promise<any>;
    protected defaultOnError?: (errorResponse: HttpException) => Promise<any>;
    private requestOption;
    static default: HttpClient;
    static setDefault(config: HttpConfig): void;
    /**
     * Creates a new HTTP client instance.
     *
     * @param config - Optional configuration (origin, timeout, compress)
     * @param label - Optional label for logging (defaults to 'HttpClient')
     */
    constructor(config?: HttpConfig, label?: string);
    /**
     * Sets the HTTP client configuration.
     *
     * Normalizes the origin URL by removing trailing slashes to ensure consistent
     * URL composition in requests.
     *
     * @param config - Configuration object
     */
    setConfig(config: HttpConfig): void;
    getOrigin(): string | undefined;
    getTimeout(): number;
    getRequestOption(): Axios_RequestConfig;
    shouldCompress(): boolean;
    /**
     * Sends the request (single boundary to the real world).
     * Override in tests to assert on options and return a mock response.
     */
    sendRequest(options: Axios_RequestConfig): Promise<Axios_Response>;
    setDefaultOnComplete: (defaultOnComplete: (response: unknown, input: unknown, request: HttpRequest<any>) => Promise<any>) => void;
    setDefaultOnError: (defaultOnError: (errorResponse: HttpException) => Promise<any>) => void;
    /**
     * Adds a default header that will be included in all requests created by this client.
     *
     * Headers can be static values (string or array) or functions that return values
     * (evaluated when creating requests). Functions are useful for dynamic headers
     * like authentication tokens.
     *
     * @param key - Header name
     * @param header - Header value (string, array, or function returning string/array)
     */
    addDefaultHeader(key: string, header: (() => string | string[]) | string | string[]): void;
    /**
     * Resolves default headers, evaluating functions and normalizing values.
     *
     * Converts all default header definitions into a flat object of string arrays.
     * Functions are called to get their return values. Throws if header value type
     * is invalid.
     *
     * @returns Object mapping header names to string arrays
     * @throws BadImplementationException if header value type is invalid
     */
    getDefaultHeaders(): {
        [k: string]: string | string[];
    };
    setRequestOption(requestOption: Axios_RequestConfig): this;
    /**
     * Creates a new typed HTTP request bound to this client.
     * The request reads config (origin, timeout, headers) from this client and calls sendRequest on it when executing.
     *
     * @template API - Typed API definition
     * @param apiDef - API definition with method, path, and optional timeout
     * @param data - Optional request data (used as request key identifier)
     * @returns HttpRequest instance ready for setUrlParams/setBodyAsJson and execute()
     */
    createRequest<API extends GeneralApi>(apiDef: ApiDef<API>, data?: string): HttpRequest<API>;
}
