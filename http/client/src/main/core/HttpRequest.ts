/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

// noinspection TypeScriptPreferShortImport
import {_keys, asArray, BadImplementationException, exists, isErrorOfType, Logger, MimeType_json, StringMap} from '@nu-art/ts-common';
import {composeUrl} from '../utils/utils.js';
import {ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError} from '@nu-art/ts-common/core/exceptions/types';

// Axios v1+ import style
import {AxiosRequestConfig as Axios_RequestConfig, AxiosResponse as Axios_Response, CanceledError, ResponseType} from 'axios';
import {HttpException} from '../exceptions/HttpException.js';
import {TS_Progress} from '../types/error-types.js';
import type {HttpClient} from './HttpClient.js';
import {ApiDef, HttpMethod, GeneralApi} from '../types/api-types.js';

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
export class HttpRequest<API extends GeneralApi>
	extends Logger {
	key: string;
	requestData!: any;

	protected origin?: string;
	protected headers: { [s: string]: string[] } = {};
	protected method: HttpMethod = HttpMethod.GET;
	protected timeout: number = 10000;
	protected body!: API['B'];
	protected url!: string;
	protected params: { [K in keyof API['P']]?: API['P'][K] } = {};
	protected responseType!: string;

	protected label: string;
	protected onProgressListener!: (ev: TS_Progress) => void;
	protected aborted: boolean = false;
	protected compress: boolean;

	private onCompleted?: ((response: API['R'], input: (API['P'] | API['B']), request: HttpRequest<API>) => Promise<any>);
	private onError?: (errorResponse: HttpException<API['E']>) => Promise<any>;

	private response?: Axios_Response<API['R']>;
	private cancelController: AbortController;
	protected status?: number;
	private requestOption: Axios_RequestConfig = {};

	private readonly client: HttpClient;

	/**
	 * Creates a new HTTP request bound to a client.
	 * Config (origin, timeout, headers) is taken from the client; execute() calls client.sendRequest().
	 *
	 * @param apiDef - API definition (method, path, optional timeout)
	 * @param client - HttpClient that provides config and performs the send
	 * @param requestData - Optional data (used as request key identifier)
	 */
	constructor(apiDef: ApiDef<API>, client: HttpClient, requestData?: any) {
		const label = `http request: ${apiDef.path}${requestData ? ` ${requestData}` : ''}`;
		super(label);
		this.client = client;
		this.key = apiDef.path;
		this.requestData = requestData;
		this.label = label;
		this.method = apiDef.method as HttpMethod;
		this.compress = client.shouldCompress();
		this.timeout = apiDef.timeout ?? client.getTimeout();
		this.setRequestOption(client.getRequestOption());
		this.addHeaders(client.getDefaultHeaders());
		this.setOrigin(client.getOrigin()).setRelativeUrl(apiDef.path);

		this.cancelController = new AbortController();
		this.logVerbose('HttpRequest created', {key: this.key, requestData, compress: this.compress, timeout: this.timeout});
	}

	resolveTypedException(exception: HttpException<any> | unknown): API['E'] | undefined {
		if (isErrorOfType(exception, HttpException))
			return (exception as HttpException<API['E']>).errorResponse?.error;
	}

	getRequestData() {
		return this.requestData;
	}

	setOrigin(origin?: string) {
		this.origin = origin;
		return this;
	}

	setOnProgressListener(onProgressListener: (ev: TS_Progress) => void) {
		this.onProgressListener = onProgressListener;
		return this;
	}

	setLabel(label: string) {
		this.label = label;
		return this;
	}

	public setMethod(method: HttpMethod) {
		this.method = method;
		return this;
	}

	public setResponseType(responseType: string) {
		this.responseType = responseType;
		return this;
	}

	public setUrlParams(params: API['P']) {
		if (!params)
			return this;

		_keys(params).forEach((key) => {
			const param = params[key];
			return param && typeof param === 'string' && this.setUrlParam(key, param);
		});

		return this;
	}

	setUrlParam<K extends keyof API['P'] = keyof API['P']>(key: K, value: API['P'][K]) {
		delete this.params[key];
		this.params[key] = value;
		return this;
	}

	public setUrl(url: string) {
		this.url = url;
		return this;
	}

	getUrl() {
		return this.url;
	}

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
	public setRelativeUrl(relativeUrl: string) {
		if (!this.origin)
			throw new BadImplementationException('if you want to use relative urls, you need to set an origin');

		if (relativeUrl.startsWith('/'))
			relativeUrl = relativeUrl.substring(1);

		this.url = `${this.origin}/${relativeUrl}`;
		return this;
	}

	setTimeout(timeout: number) {
		this.timeout = timeout;
		return this;
	}

	setHeaders(headers: { [s: string]: string | string[] }) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.setHeader(key, headers[key]));
		return this;
	}

	addHeaders(headers: { [s: string]: string | string[] }) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.addHeader(key, headers[key]));
		return this;
	}

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
	setHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();

		delete this.headers[key];
		return this.addHeader(key, value);
	}

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
	addHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();
		return this._addHeaderImpl(key, value);
	}

	removeHeader(key: string) {
		delete this.headers[key];
		return this;
	}

	protected _addHeaderImpl(key: string, value: string | string[]) {
		const values: string[] = asArray(value);

		if (!this.headers[key])
			this.headers[key] = values;
		else
			this.headers[key].push(...values);

		this.logVerbose(`Added ${value} header`, value);

		return this;
	}

	protected prepareJsonBody(bodyObject: API['B']): any {
		return bodyObject;
	}

	setBodyAsJson(bodyObject: API['B'], compress?: boolean) {
		this.setHeader('content-type', MimeType_json);
		this.setBody(this.prepareJsonBody(bodyObject), compress);
		return this;
	}

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
	setBody(bodyAsString: any, _compress?: boolean) {
		this.body = bodyAsString;
		this.compress = _compress === undefined ? this.compress : _compress;
		if (typeof bodyAsString === 'string') {
			if (this.compress)
				this.setHeader('Content-encoding', 'gzip');
			// Set content-type for plain text if not already set
			if (!this.headers['content-type'] && !this.headers['Content-Type'])
				this.setHeader('Content-Type', 'text/plain');
		}

		return this;
	}

	isValidStatus(statusCode: number) {
		return statusCode >= 200 && statusCode < 300;
	}

	protected print() {
		this.logInfo(`Url: ${this.url}`);
		this.logInfo(`Params:`, this.params);
		this.logInfo(`Headers:`, this.headers);
	}

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
	async execute(print = false): Promise<API['R']> {
		this.logVerbose('Executing HTTP request', {method: this.method, key: this.key});

		if (print)
			this.print();

		if (this.aborted) {
			this.logWarning('Request was aborted before execution');
			const httpException = new HttpException(0, this);
			await this.onError?.(httpException);
			throw httpException;
		}

		const fullUrl = composeUrl(this.url, this.params);
		const body = this.body;

		this.logDebug('Composed URL', {url: this.url, params: this.params, fullUrl});

		if (typeof body === 'string') {
			this.addHeader('Content-Length', `${body.length}`);
		}

		const headers = Object.keys(this.headers).reduce((carry: StringMap, headerKey: string) => {
			carry[headerKey] = this.headers[headerKey].join('; ');
			return carry;
		}, {} as StringMap);

		this.logDebug('Prepared headers', headers);

		const options: Axios_RequestConfig = {
			...this.requestOption,
			url: fullUrl,
			method: this.method as Axios_RequestConfig['method'],
			headers,
			timeout: this.timeout,
			signal: this.cancelController.signal,
		};

		if (body) {
			options.data = body;
			this.logVerbose('Request body set', {bodyType: typeof body, bodyLength: typeof body === 'string' ? body.length : 'object'});
		}

		if (this.responseType) {
			options.responseType = this.responseType as ResponseType;
			this.logVerbose(`Response type set: ${this.responseType}`);
		}

		// Set up progress listener if configured
		if (this.onProgressListener) {
			options.onDownloadProgress = (progressEvent: any) => {
				this.onProgressListener({
					loaded: progressEvent.loaded || 0,
					total: progressEvent.total || 0,
					lengthComputable: progressEvent.lengthComputable !== false,
					target: progressEvent
				});
			};
			options.onUploadProgress = (progressEvent: any) => {
				this.onProgressListener({
					loaded: progressEvent.loaded || 0,
					total: progressEvent.total || 0,
					lengthComputable: progressEvent.lengthComputable !== false,
					target: progressEvent
				});
			};
		}

		this.logDebug('Request options', options);

		this.logInfo(`Calling: ${this.method} - ${fullUrl}`);

		try {
			this.response = await this.client.sendRequest(options) as Axios_Response<API['R']>;
			this.status = this.response?.status ?? 200;
			this.logVerbose('Response received', {status: this.status, headers: this.response.headers});
		} catch (e: any) {
			// cancellation path in v1
			if (e instanceof CanceledError || e?.code === 'ERR_CANCELED') {
				this.aborted = true;
				this.logWarning('Request cancelled', e.message);
				const httpException = new HttpException(0, this);
				await this.onError?.(httpException);
				throw httpException;
			}

			// Extract response and status from Axios error
			this.response = e?.response;
			this.status = this.response?.status ?? 500;
			this.logError('Request failed', {status: this.status, error: e.message});

			// Convert AxiosError to HttpException for non-2xx status codes
			if (!this.isValidStatus(this.status)) {
				const errorResponse = this.getErrorResponse();
				const httpException = new HttpException<API['E']>(this.status, this, errorResponse);
				await this.onError?.(httpException);
				throw httpException;
			}

			// For other errors (network, timeout, etc.), still throw HttpException
			const errorResponse = this.getErrorResponse();
			const httpException = new HttpException<API['E']>(this.status, this, errorResponse);
			await this.onError?.(httpException);
			throw httpException;
		}

		const status = this.getStatus();
		this.logDebug('Response status', {status});

		if (this.aborted) {
			this.logWarning('Request was aborted after response');
			const httpException = new HttpException(status, this);
			await this.onError?.(httpException);
			throw httpException;
		}

		// Status validation is already handled in catch block for errors
		// This check is for successful responses that might have invalid status (shouldn't happen)
		if (!this.isValidStatus(status)) {
			this.logWarning('Invalid response status', {status, expectedRange: '200-299'});
			const errorResponse = this.getErrorResponse();
			const httpException = new HttpException<API['E']>(status, this, errorResponse);
			await this.onError?.(httpException);
			throw httpException;
		}

		let response: API['R'] = this.getResponse();
		const requestData = this.body || this.params;

		if (!exists(response)) {
			this.logVerbose('Empty response received');
			await this.onCompleted?.(response, requestData, this);
			return response;
		}

		// Convert Buffer to ArrayBuffer for arraybuffer response type (Node.js compatibility)
		if (this.responseType === 'arraybuffer' && Buffer.isBuffer(response)) {
			const buffer = response as unknown as Buffer;
			const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
			response = arrayBuffer as unknown as API['R'];
			this.logVerbose('Converted Buffer to ArrayBuffer for arraybuffer response type');
		}

		try {
			response = JSON.parse(response as unknown as string) as API['R'];
			this.logVerbose('Response parsed as JSON');
		} catch (ignore: any) {
			this.logVerbose('Response is not JSON, returning as-is');
		}

		this.logInfo(`Request completed successfully`, {status, method: this.method, url: fullUrl});
		await this.onCompleted?.(response, requestData, this);
		return response;
	}

	clearOnCompleted = () => {
		delete this.onCompleted;
	};

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
	private setCallback<T extends (...args: any[]) => Promise<any>>(
		existingCallback: T | undefined,
		newCallback: T | undefined,
		setter: (callback: T | undefined) => void
	): this {
		if (!newCallback)
			return this;

		if (existingCallback && newCallback) {
			const _existing = existingCallback;
			setter((async (...args: Parameters<T>) => {
				await _existing(...args);
				await newCallback(...args);
			}) as T);
		} else
			setter(newCallback);

		return this;
	}

	setOnCompleted = (onCompleted?: (response: API['R'], input: API['P'] | API['B'], request: HttpRequest<API>) => Promise<any>) => {
		return this.setCallback(
			this.onCompleted,
			onCompleted,
			(callback) => {
				this.onCompleted = callback;
			}
		);
	};

	setOnError(onError?: (errorResponse: HttpException<API['E']>) => Promise<any>) {
		return this.setCallback(
			this.onError,
			onError,
			(callback) => {
				this.onError = callback;
			}
		);
	}

	getStatus(): number {
		if (!this.status) throw new BadImplementationException('Missing status..');
		return this.status;
	}

	getResponse(): any {
		return this.response?.data;
	}

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
	getRawResponse(): Axios_Response<API['R']> {
		if (!this.response) throw new BadImplementationException('Response not available. Call execute() first.');
		return this.response;
	}

	/**
	 * Extracts error response from the HTTP response.
	 *
	 * Returns a basic error response structure with the raw response data
	 * as the debug message. Used when status validation fails.
	 *
	 * @returns Error response structure with debug message
	 */
	getErrorResponse(): ApiErrorResponse<ResponseError | ApiError_GeneralErrorMessage> {
		return {debugMessage: this.getResponse()};
	}

	private abortImpl(): void {
		this.cancelController.abort();
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}

	_getResponseHeader(headerKey: string): string | string[] | undefined {
		if (!this.response) throw new BadImplementationException(`axios didn't return yet`);
		const headers = this.response.headers;
		if (!headers)
			return undefined;

		const direct = (headers as Record<string, string | string[] | undefined>)[headerKey];
		if (direct !== undefined)
			return direct;

		const lower = headerKey.toLowerCase();
		const matchKey = Object.keys(headers).find(k => k.toLowerCase() === lower);
		if (!matchKey)
			return undefined;

		return (headers as Record<string, string | string[] | undefined>)[matchKey];
	}

	getResponseHeader(headerKey: string): string | string[] | undefined {
		try {
			return this._getResponseHeader(headerKey);
		} catch (e: any) {
			this.logError(`Response headers not available yet. Request may not have completed.`, e);
		}
	}

	/**
	 * Aborts the HTTP request.
	 *
	 * Marks the request as aborted and triggers the AbortController signal,
	 * which cancels the underlying Axios request. If executed before the request
	 * completes, the execute() method will throw an HttpException with status 0.
	 */
	abort() {
		this.aborted = true;
		this.abortImpl();
	}
}
