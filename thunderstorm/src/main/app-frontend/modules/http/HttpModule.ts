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
	addItemToArray,
	BadImplementationException,
	Module,
	removeItemFromArray,
} from "@nu-art/ts-common";
import {gzip} from "zlib";
// noinspection TypeScriptPreferShortImport
import {
	HttpException,
	RequestErrorHandler,
	RequestSuccessHandler,
	ResponseHandler
} from "../../../shared/request-types";
// noinspection TypeScriptPreferShortImport
import {BaseHttpRequest} from "../../../shared/BaseHttpRequest";

type HttpConfig = {
	origin?: string
	timeout?: number
	compress?: boolean
}
export type DeriveRealBinder<Binder> = Binder extends ApiTypeBinder<infer U, infer R, infer B, infer P> ? ApiTypeBinder<U, R, B, P> : void;

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
		return this.config.compress;
	}

	addDefaultHeader(key: string, header: (() => string | string[]) | string | string[]) {
		this.defaultHeaders[key] = header;
	}

	init() {
		const origin = this.config.origin;
		if (!origin)
			throw new BadImplementationException('Did you forget to set the origin config key for the HttpModule?');

		this.origin = origin.replace("${hostname}", window.location.hostname).replace("${protocol}", window.location.protocol);
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
					throw new BadImplementationException("Headers values can only be of type: (() => string | string[]) | string | string[] ");
			}

			return toRet;
		}, {} as { [k: string]: string | string[] });

		return new HttpRequest<DeriveRealBinder<Binder>>(key, data, this.shouldCompress())
			.setOrigin(this.origin)
			.setMethod(method)
			.setTimeout(this.timeout)
			.addHeaders(defaultHeaders)
			.setHandleRequestSuccess(this.handleRequestSuccess)
			.setHandleRequestFailure(this.handleRequestFailure)
			.setDefaultRequestHandler(this.processDefaultResponseHandlers)
			;
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

	handleRequestFailure: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		const feError = request.getErrorMessage();
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

	handleRequestSuccess: RequestSuccessHandler = (request: BaseHttpRequest<any>) => {
		const feMessage = request.getSuccessMessage();

		this.logInfo(`Http request for key '${request.key}' completed`);
		if (feMessage)
			this.logInfo(` + FE message:  ${feMessage}`);

		for (const successHandler of this.defaultSuccessHandlers) {
			successHandler(request);
		}
	};

	processDefaultResponseHandlers = (httpRequest: BaseHttpRequest<any>) => {
		let resolved = false;
		for (const responseHandler of this.defaultResponseHandler) {
			resolved = resolved || responseHandler(httpRequest);
		}

		return resolved;
	};
}

export const HttpModule = new HttpModule_Class();

export class HttpRequest<Binder extends ApiTypeBinder<any, any, any, any>, E = DeriveErrorType<DeriveRealBinder<Binder>>>
	extends BaseHttpRequest<Binder> {

	readonly xhr?: XMLHttpRequest;

	constructor(requestKey: string, requestData?: string, shouldCompress?: boolean) {
		super(requestKey, requestData);
		this.compress = shouldCompress === undefined ? true : shouldCompress;
	}

	getStatus(): number {
		const xhr = this.xhr;
		if (!xhr)
			throw new BadImplementationException('No xhr object!');

		return xhr.status;
	}

	getResponse() {
		const xhr = this.xhr;
		if (!xhr)
			throw new BadImplementationException('No xhr object!');

		return xhr.response;
	}

	abortImpl(): void {
		this.xhr?.abort();
	}

	getErrorResponse(): ErrorResponse<DeriveErrorType<Binder>> {
		const rawResponse = this.getResponse();
		let response = undefined as unknown as ErrorResponse<DeriveErrorType<Binder>>;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson() as unknown as ErrorResponse<DeriveErrorType<Binder>>;
			} catch (e) {
				response = {debugMessage: rawResponse};
			}
		}
		return response;
	}

	protected executeImpl(): Promise<void> {
		//loop through whatever preprocessor
		return new Promise<void>((resolve, reject) => {
			if (this.aborted)
				return resolve();

			const xhr = new XMLHttpRequest();
			// @ts-ignore
			// noinspection JSConstantReassignment
			this.xhr = xhr;
			this.xhr.onreadystatechange = () => {
				if (xhr.readyState !== 4)
					return;

				resolve();
			};

			this.xhr.onerror = (err) => {
				if (xhr.readyState === 4 && xhr.status === 0) {
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

			let nextOperator = "?";
			if (this.url.indexOf("?") !== -1) {
				nextOperator = "&";
			}

			const fullUrl = Object.keys(this.params).reduce((url: string, paramKey: string) => {
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
				xhr.setRequestHeader(key, this.headers[key].join('; '));
			});

			const body = this.body;
			if (typeof body === "string" && this.compress)
				return gzip(body, (error: Error | null, result: Buffer) => {
					if (error)
						return reject(error);

					xhr.send(result);
				});

			this.xhr.send(body as BodyInit);
		});
	}
}
