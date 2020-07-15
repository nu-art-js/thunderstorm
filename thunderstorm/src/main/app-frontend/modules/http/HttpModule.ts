/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// noinspection TypeScriptPreferShortImport
import {
	ApiTypeBinder,
	DeriveBodyType,
	DeriveErrorType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	ErrorResponse,
	HttpMethod,
	QueryParams
} from "../../../shared/types";

import {
	_keys,
	addItemToArray,
	BadImplementationException,
	Module,
	removeItemFromArray,
} from "@nu-art/ts-common";
import {gzip} from "zlib";

type HttpConfig = {
	origin: string
	timeout: number
	compress: boolean
}

export interface OnRequestListener {
	__onRequestCompleted: (key: string, success: boolean, requestData?: string) => void;
}

export type RequestErrorHandler<E extends void | object> = (request: HttpRequest<any>, resError?: ErrorResponse<any>) => void;
export type RequestSuccessHandler = (request: HttpRequest<any>) => void;
export type ResponseHandler = (request: HttpRequest<any>) => boolean;

export class HttpModule_Class
	extends Module<HttpConfig> {

	private defaultErrorHandlers: RequestErrorHandler<any>[] = [];
	private defaultSuccessHandlers: RequestSuccessHandler[] = [];

	private origin!: string;
	private timeout: number = 10000;
	private readonly defaultResponseHandler: ResponseHandler[] = [];
	private readonly defaultHeaders: { [s: string]: (() => string | string[]) | string | string[] } = {};

	constructor() {
		super();
		this.setDefaultConfig({compress: true});
	}

	shouldCompress() {
		return this.config.compress
	}

	addDefaultHeader(key: string, header: (() => string | string[]) | string | string[]) {
		this.defaultHeaders[key] = header;
	}

	init() {
		this.origin = this.config.origin.replace("${hostname}", window.location.hostname).replace("${protocol}", window.location.protocol);
		this.timeout = this.config.timeout || this.timeout;
	}

	protected validate(): void {
		if (!this.origin)
			throw new Error("MUST specify server origin path, e.g. 'https://localhost:3000'");
	};

	public createRequest = <Binder extends ApiTypeBinder<U, R, B, P> = ApiTypeBinder<void, void, void, {}>, U extends string = DeriveUrlType<Binder>, R = DeriveResponseType<Binder>, B = DeriveBodyType<Binder>, P extends QueryParams = DeriveQueryType<Binder>>(method: HttpMethod, key: string, data?: string): HttpRequest<DeriveRealBinder<Binder>> => {
		const defaultHeaders = Object.keys(this.defaultHeaders).reduce((toRet, _key) => {
			const defaultHeader = this.defaultHeaders[_key];
			switch (typeof defaultHeader) {
				case "string":
					toRet[_key] = [defaultHeader];
					break;

				case "function":
					toRet[_key] = defaultHeader();
					break;

				case "object":
					if (Array.isArray(defaultHeader)) {
						toRet[_key] = defaultHeader;
						break;
					}

				case "boolean":
				case "number":
				case "symbol":
				case "bigint":
				case "undefined":
					throw new BadImplementationException("Headers values can only be of type: (() => string | string[]) | string | string[] ")
			}

			return toRet;
		}, {} as { [k: string]: string | string[] });

		return new HttpRequest<DeriveRealBinder<Binder>>(key, data)
			.setOrigin(this.origin)
			.setMethod(method)
			.setTimeout(this.timeout)
			.addHeaders(defaultHeaders);
	};

	processDefaultResponseHandlers = (httpRequest: HttpRequest<any>) => {
		let resolved = false;
		for (const responseHandler of this.defaultResponseHandler) {
			resolved = resolved || responseHandler(httpRequest);
		}

		return resolved;
	};

	addDefaultResponseHandler(defaultResponseHandler: ResponseHandler) {
		addItemToArray(this.defaultResponseHandler, defaultResponseHandler);
	}

	removeDefaultResponseHandler(defaultResponseHandler: ResponseHandler) {
		removeItemFromArray(this.defaultResponseHandler, defaultResponseHandler);
	}

	setErrorHandlers(defaultErrorHandlers: RequestErrorHandler<any>[]) {
		this.defaultErrorHandlers = defaultErrorHandlers;
	}

	setSuccessHandlers(defaultErrorHandlers: RequestSuccessHandler[]) {
		this.defaultSuccessHandlers = defaultErrorHandlers;
	}

	handleRequestFailure: RequestErrorHandler<any> = (request: HttpRequest<any>, resError?: ErrorResponse<any>) => {
		const feError = request.errorMessage;
		const beError = resError?.debugMessage;

		this.logError(`Http request for key '${request.key}' failed...`);
		if (feError)
			this.logError(` + FE error:  ${feError}`);

		if (beError)
			this.logError(` + BE error:  ${beError}`);

		for (const errorHandler of this.defaultErrorHandlers) {
			errorHandler(request, resError);
		}
	};

	handleRequestSuccess: RequestSuccessHandler = (request: HttpRequest<any>) => {
		const feMessage = request.successMessage;

		this.logInfo(`Http request for key '${request.key}' completed`);
		if (feMessage)
			this.logInfo(` + FE message:  ${feMessage}`);

		for (const successHandler of this.defaultSuccessHandlers) {
			successHandler(request);
		}
	}
}

export type DeriveRealBinder<Binder> = Binder extends ApiTypeBinder<infer U, infer R, infer B, infer P> ? ApiTypeBinder<U, R, B, P> : void;

export const HttpModule = new HttpModule_Class();


export class HttpException
	extends Error {
	constructor(responseCode: number, url: string) {
		super(`${responseCode} - ${url}`);
	}
}

export class HttpRequest<Binder extends ApiTypeBinder<U, R, B, P>,
	U extends string = DeriveUrlType<Binder>,
	R = DeriveResponseType<Binder>,
	B = DeriveBodyType<Binder>,
	P extends QueryParams = DeriveQueryType<Binder>,
	E extends void | object = DeriveErrorType<Binder>> {

	readonly key: string;
	readonly requestData!: string | undefined;
	readonly errorMessage!: string;
	readonly successMessage!: string;
	readonly xhr!: XMLHttpRequest;

	private origin!: string;
	private headers: { [s: string]: string[] } = {};
	private method: HttpMethod = HttpMethod.GET;
	private timeout: number = 10000;
	private body!: BodyInit;
	private url!: string;
	private params: { [K in keyof P]?: P[K] } = {};
	private onProgressListener!: (ev: ProgressEvent) => void;

	private label!: string;
	private onResponseListener!: (response: R) => void;
	private handleRequestSuccess: RequestSuccessHandler = HttpModule.handleRequestSuccess;
	private handleRequestFailure: RequestErrorHandler<E> = HttpModule.handleRequestFailure;
	private aborted: boolean = false;
	private compress: boolean;

	constructor(requestKey: string, requestData?: string) {
		this.key = requestKey;
		this.requestData = requestData;
		this.compress = HttpModule.shouldCompress();
	}

	getErrorMessage() {
		return this.errorMessage;
	}

	getRequestData() {
		return this.requestData;
	}

	setOrigin(origin: string) {
		this.origin = origin;
		return this;
	}

	setOnError(errorMessage: string | RequestErrorHandler<E>) {
		if (typeof errorMessage === "string") {
			// @ts-ignore
			// noinspection JSConstantReassignment
			this.errorMessage = errorMessage;
		} else
			this.handleRequestFailure = errorMessage;

		return this;
	}

	setOnSuccessMessage(successMessage: string) {
		// @ts-ignore
		// noinspection JSConstantReassignment
		this.successMessage = successMessage;
		return this;
	}

	setOnResponseListener(listener: (response: R) => void) {
		this.onResponseListener = listener;
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

	public setUrlParams(params: P) {
		if (!params)
			return this;

		_keys(params).forEach((key) => {
			const param = params[key];
			return param && typeof param === "string" && this.setUrlParam(key, param);
		});

		return this;
	}

	setUrlParam<K extends keyof P = keyof P>(key: K, value: P[K]) {
		delete this.params[key];
		this.params[key] = value;
		return this;
	}

	public setUrl(url: string) {
		this.url = url;
		return this;
	}

	public setRelativeUrl(relativeUrl: U) {
		this.url = this.origin + relativeUrl;
		return this;
	}

	setTimeout(timeout: number) {
		this.timeout = timeout;
		return this;
	}

	setOnProgressListener(onProgressListener: (ev: ProgressEvent) => void) {
		this.onProgressListener = onProgressListener;
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

	setHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();

		delete this.headers[key];
		return this.addHeader(key, value);
	}

	addHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();
		return this._addHeaderImpl(key, value);
	}

	removeHeader(key: string) {
		delete this.headers[key];
		return this
	}

	private _addHeaderImpl(key: string, value: string | string[]) {
		const values: string[] = Array.isArray(value) ? value : [value];

		if (!this.headers[key])
			this.headers[key] = values;
		else
			this.headers[key].push(...values);

		return this;
	}

	setJsonBody(bodyObject: B, compress?: boolean) {
		this.setHeaders({"content-type": "application/json"});
		this.setBody(JSON.stringify(bodyObject), compress);
		return this;
	}

	setBody(bodyAsString: BodyInit, _compress?: boolean) {
		this.body = bodyAsString;
		this.compress = _compress === undefined ? HttpModule.shouldCompress() : _compress;
		if (typeof bodyAsString === "string" && this.compress)
			this.setHeader("Content-encoding", "gzip");

		return this;
	}

	asJson() {
		if (!this.xhr)
			throw new BadImplementationException("No xhr object... maybe you didn't wait for the request to return??");

		const response = this.xhr.response;
		if (!response)
			throw new BadImplementationException("No xhr.response...");

		return JSON.parse(response) as R;
	}

	asText() {
		if (!this.xhr)
			throw new BadImplementationException("No xhr object... maybe you didn't wait for the request to return??");

		return this.xhr.response as R;
	}

	private resolveResponse() {
		const rawResponse = this.xhr && this.xhr.response;
		let response: R = undefined as unknown as R;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson();
			} catch (e) {
				response = this.asText()
			}
		}
		return response;
	}

	async executeSync(): Promise<R> {
		await this.executeImpl();
		if (this.xhr.status !== 200)
			throw new HttpException(this.xhr.status, this.url);


		return this.resolveResponse();
	}

	execute(responseHandler?: (response: R) => Promise<void> | void) {

		// @ts-ignore
		HttpModule.runAsync(this.label || `http request: ${this.key}`, async () => {
			await this.executeImpl();

			if (this.aborted)
				return;

			if (HttpModule.processDefaultResponseHandlers(this))
				return;

			if (this.xhr.status !== 200)
				return this.handleRequestFailure(this, this.getErrorResponse());

			const response = this.resolveResponse();

			this.onResponseListener && this.onResponseListener(response);
			responseHandler && await responseHandler(response);
			this.handleRequestSuccess(this);
		});
		return this;
	}

	getErrorResponse(): ErrorResponse<E> {
		const rawResponse = this.xhr && this.xhr.response;
		let response: ErrorResponse<E> = undefined as unknown as ErrorResponse<E>;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson() as unknown as ErrorResponse<E>;
			} catch (e) {
				response = {debugMessage: rawResponse};
			}
		}
		return response;
	}

	abort() {
		this.aborted = true;
		this.xhr && this.xhr.abort();
	}

	private executeImpl() {
		return new Promise<void>((resolve, reject) => {
			if (this.aborted)
				return resolve();

			// @ts-ignore
			// noinspection JSConstantReassignment
			this.xhr = new XMLHttpRequest();
			this.xhr.onreadystatechange = () => {
				if (this.xhr.readyState !== 4)
					return;

				resolve();
			};

			this.xhr.onerror = (err) => {
				if (this.xhr.readyState === 4 && this.xhr.status === 0) {
					reject(new HttpException(404, this.url));
					return;
				}

				reject(err);
			};

			this.xhr.ontimeout = (err) => {
				reject(err);
			};

			this.xhr.onload = (err) => {
				// HttpModule.logVerbose("onload");
			};

			this.xhr.onloadstart = (err) => {
				// HttpModule.logVerbose("onloadstart");
			};

			this.xhr.onloadend = (err) => {
				// HttpModule.logVerbose("onloadend");
			};

			this.xhr.onabort = (err) => {
				// HttpModule.logVerbose("onabort");
			};

			let nextOperator = "?"
			if (this.url.indexOf("?") !== -1) {
				nextOperator = "&";
			}

			const fullUrl = _keys(this.params).reduce((url: string, paramKey: keyof P) => {
				const param: string | undefined = this.params[paramKey];
				if (!param)
					return url;

				const toRet = `${url}${nextOperator}${paramKey}=${encodeURIComponent(param)}`;
				nextOperator = "&";
				return toRet;
			}, this.url);

			this.xhr.upload.onprogress = this.onProgressListener;
			this.xhr.open(this.method, fullUrl);
			this.xhr.timeout = this.timeout;

			Object.keys(this.headers).forEach((key) => {
				this.xhr.setRequestHeader(key, this.headers[key].join('; '));
			});

			const body = this.body;
			if (typeof body === "string" && this.compress)
				return gzip(body, (error: Error | null, result: Buffer) => {
					if (error)
						return reject(error);

					this.xhr.send(result);
				});

			this.xhr.send(body);
		});
	}
}
