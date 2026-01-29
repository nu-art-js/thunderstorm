/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

// noinspection TypeScriptPreferShortImport
import {BadImplementationException, Logger} from '@nu-art/ts-common';
import {HttpRequest} from './HttpRequest.js';

// Axios v1+ import style
import axios, {AxiosRequestConfig as Axios_RequestConfig, AxiosResponse as Axios_Response} from 'axios';
import {HttpException} from '../exceptions/HttpException.js';
import {ApiDef, GeneralApi} from '../types/api-types.js';

/**
 * HTTP client configuration.
 */
export type HttpConfig = {
	origin?: string
	timeout?: number
	compress?: boolean
}

/**
 * HTTP client for creating and configuring typed HTTP requests.
 *
 * Manages default configuration (origin, timeout, compression, headers) and provides
 * a factory method for creating typed HttpRequest instances. All requests created
 * from this client inherit the default configuration and callbacks.
 *
 * Extends Logger for built-in logging capabilities.
 */
export class HttpClient_Class extends Logger {
	protected origin?: string;
	protected timeout: number = 10000;
	protected compress: boolean = true;
	private readonly defaultHeaders: { [s: string]: (() => string | string[]) | string | string[] } = {};
	protected defaultOnComplete?: (response: unknown, input: unknown, request: HttpRequest<any>) => Promise<any>;
	protected defaultOnError?: (errorResponse: HttpException) => Promise<any>;
	private requestOption: Axios_RequestConfig = {};

	/**
	 * Creates a new HTTP client instance.
	 *
	 * @param config - Optional configuration (origin, timeout, compress)
	 * @param label - Optional label for logging (defaults to 'HttpClient')
	 */
	constructor(config?: HttpConfig, label: string = 'HttpClient') {
		super(label);
		if (config) {
			this.setConfig(config);
		}
	}

	/**
	 * Sets the HTTP client configuration.
	 *
	 * Normalizes the origin URL by removing trailing slashes to ensure consistent
	 * URL composition in requests.
	 *
	 * @param config - Configuration object
	 */
	setConfig(config: HttpConfig) {
		if (config.timeout !== undefined)
			this.timeout = config.timeout;

		if (config.compress !== undefined)
			this.compress = config.compress;

		if (config.origin) {
			let origin = config.origin;
			if (origin.endsWith('/'))
				origin = origin.substring(0, origin.length - 1);
			this.origin = origin;
		}
	}

	getOrigin() {
		return this.origin;
	}

	getTimeout(): number {
		return this.timeout;
	}

	getRequestOption(): Axios_RequestConfig {
		return this.requestOption;
	}

	shouldCompress() {
		return this.compress;
	}

	/**
	 * Sends the request (single boundary to the real world).
	 * Override in tests to assert on options and return a mock response.
	 */
	async sendRequest(options: Axios_RequestConfig): Promise<Axios_Response> {
		return axios.request(options);
	}

	setDefaultOnComplete = (defaultOnComplete: (response: unknown, input: unknown, request: HttpRequest<any>) => Promise<any>) => {
		this.defaultOnComplete = defaultOnComplete;
	};

	setDefaultOnError = (defaultOnError: (errorResponse: HttpException) => Promise<any>) => {
		this.defaultOnError = defaultOnError;
	};

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
	addDefaultHeader(key: string, header: (() => string | string[]) | string | string[]) {
		this.defaultHeaders[key] = header;
	}

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
	getDefaultHeaders() {
		return Object.keys(this.defaultHeaders).reduce((toRet, _key) => {
			const defaultHeader = this.defaultHeaders[_key];
			const key = _key.toLowerCase();
			switch (typeof defaultHeader) {
				case 'string':
					toRet[key] = [defaultHeader];
					break;

			case 'function':
				const functionResult = defaultHeader();
				// Wrap string results in array, keep arrays as-is
				toRet[key] = typeof functionResult === 'string' ? [functionResult] : functionResult;
				break;

				case 'object':
					if (Array.isArray(defaultHeader)) {
						toRet[key] = defaultHeader;
						break;
					}

				// eslint-disable-next-line no-fallthrough
				case 'boolean':
				case 'number':
				case 'symbol':
				case 'bigint':
				case 'undefined':
					throw new BadImplementationException(`Headers values can only be of type: (() => string | string[]) | string | string[], got type ${typeof defaultHeader} `);
			}

			return toRet;
		}, {} as { [k: string]: string | string[] });
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}

	/**
	 * Creates a new typed HTTP request bound to this client.
	 * The request reads config (origin, timeout, headers) from this client and calls sendRequest on it when executing.
	 *
	 * @template API - Typed API definition
	 * @param apiDef - API definition with method, path, and optional timeout
	 * @param data - Optional request data (used as request key identifier)
	 * @returns HttpRequest instance ready for setUrlParams/setBodyAsJson and execute()
	 */
	createRequest<API extends GeneralApi>(apiDef: ApiDef<API>, data?: string): HttpRequest<API> {
		const request = new HttpRequest<API>(apiDef, this, data);
		if (this.defaultOnError)
			request.setOnError(this.defaultOnError);
		if (this.defaultOnComplete)
			request.setOnCompleted(this.defaultOnComplete);
		return request;
	}
}

export const HttpClient = new HttpClient_Class();
