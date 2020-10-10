/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Alan Ben
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
	StringMap,
} from "@nu-art/ts-common";
import {BaseHttpRequest} from "../../../shared/BaseHttpRequest";
import axios, {
	AxiosRequestConfig,
	AxiosResponse,
	CancelTokenSource,
	Method
} from 'axios';
import {
	RequestErrorHandler,
	RequestSuccessHandler,
	ResponseHandler
} from "../_imports";

type HttpConfig = {
	origin?: string
	timeout?: number
	compress?: boolean
}

export class BeHttpModule_Class
	extends Module<HttpConfig> {

	private defaultErrorHandlers: RequestErrorHandler<any>[] = [];
	private defaultSuccessHandlers: RequestSuccessHandler[] = [];

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
		this.timeout = this.config.timeout || this.timeout;
	}

	public createRequest = <Binder extends ApiTypeBinder<U, R, B, P> = ApiTypeBinder<void, void, void, {}>, U extends string = DeriveUrlType<Binder>, R = DeriveResponseType<Binder>, B = DeriveBodyType<Binder>, P extends QueryParams = DeriveQueryType<Binder>>(method: HttpMethod, key: string, data?: string): BeHttpRequest<DeriveRealBinder<Binder>> => {
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

		return new BeHttpRequest<DeriveRealBinder<Binder>>(key, data, this.shouldCompress())
			.setMethod(method)
			.setTimeout(this.timeout)
			.addHeaders(defaultHeaders)
			.setHandleRequestSuccess(this.handleRequestSuccess)
			.setHandleRequestFailure(this.handleRequestFailure)
			.setDefaultRequestHandler(this.processDefaultResponseHandlers);
	};

	processDefaultResponseHandlers = (httpRequest: BaseHttpRequest<any, any, any, any, any>) => {
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

	handleRequestFailure: RequestErrorHandler<any> = (request: BaseHttpRequest<any, any, any, any, any>, resError?: ErrorResponse<any>) => {
		const error = request.getErrorMessage();

		this.logError(`Http request for key '${request.key}' failed...`);
		if (error)
			this.logError(` + Error:  ${error}`);

		for (const errorHandler of this.defaultErrorHandlers) {
			errorHandler(request, resError);
		}
	};

	handleRequestSuccess: RequestSuccessHandler = (request: BaseHttpRequest<any, any, any, any, any>) => {
		const message = request.getSuccessMessage();

		this.logInfo(`Http request for key '${request.key}' completed`);
		if (message)
			this.logInfo(` + Message:  ${message}`);

		for (const successHandler of this.defaultSuccessHandlers) {
			successHandler(request);
		}
	};
}

export type DeriveRealBinder<Binder> = Binder extends ApiTypeBinder<infer U, infer R, infer B, infer P> ? ApiTypeBinder<U, R, B, P> : void;

export const BeHttpModule = new BeHttpModule_Class();

export class BeHttpRequest<Binder extends ApiTypeBinder<any, any, any, any>>
	extends BaseHttpRequest<Binder> {
	private response?: AxiosResponse<DeriveResponseType<DeriveRealBinder<Binder>>>;
	private cancelSignal: CancelTokenSource;

	constructor(requestKey: string, requestData?: string, shouldCompress?: boolean) {
		super(requestKey, requestData);
		this.compress = shouldCompress === undefined ? true : shouldCompress;
		this.cancelSignal = axios.CancelToken.source();
	}

	getStatus(): number {
		if (!this.response)
			throw new BadImplementationException('Missing response object..');

		return this.response?.status;
	}

	getResponse(): any {
		if (!this.response)
			throw new BadImplementationException('Missing response object..');

		return this.response.data;
	}

	protected resolveResponse() {
		return this.getResponse();
	}

	abortImpl(): void {
		this.cancelSignal.cancel(`Request with key: '${this.key}' aborted by the user.`);
	}

	getErrorResponse(): ErrorResponse<DeriveErrorType<Binder>> {
		return {debugMessage: this.getResponse()};
	}

	protected executeImpl(): Promise<void> {
		//loop through whatever preprocessor
		return new Promise<void>(async (resolve, reject) => {
			if (this.aborted)
				return resolve();

			let nextOperator = this.url.indexOf("?") === -1 ? "?" : "&";

			const fullUrl = Object.keys(this.params).reduce((url: string, paramKey: string) => {
				const param: string | undefined = this.params[paramKey];
				if (!param)
					return url;

				const toRet = `${url}${nextOperator}${paramKey}=${encodeURIComponent(param)}`;
				nextOperator = "&";
				return toRet;
			}, this.url);

			// TODO set progress listener
			// this.xhr.upload.onprogress = this.onProgressListener;
			const body = this.body;

			// TODO add zipping of body
			// if (typeof body === "string" && this.compress)
			// 	return gzip(body, (error: Error | null, result: Buffer) => {
			// 		if (error)
			// 			return reject(error);
			//
			// 		xhr.send(result);
			// 	});
			//
			// this.xhr.send(body as BodyInit);

			const headers = Object.keys(this.headers).reduce((carry: StringMap, headerKey: string) => {
				carry[headerKey] = this.headers[headerKey].join('; ');
				return carry;
			}, {} as StringMap);

			const options: AxiosRequestConfig = {
				url: fullUrl,
				method: this.method as Method,
				headers: headers,
				// TODO will probably need to use the abortController with a timeout for this.
				timeout: this.timeout,
				cancelToken: this.cancelSignal.token,
				// this is a ui thing. not backend
				// onDownloadProgress: (progressEvent: ProgressEvent) => {
				// }
			};
			//{
			//   onDownloadProgress: progressEvent => {
			//     const total = parseFloat(progressEvent.currentTarget.responseHeaders['Content-Length'])
			//     const current = progressEvent.currentTarget.response.length
			//
			//     let percentCompleted = Math.floor(current / total * 100)
			//     console.log('completed: ', percentCompleted)
			//   }
			// }

			if (body)
				options.data = body;

			let response: AxiosResponse<DeriveResponseType<DeriveRealBinder<Binder>>>;
			try {
				response = await axios.request(options);
			} catch (e) {
				// TODO handle this here
				// 	if (xhr.readyState === 4 && xhr.status === 0) {
				// 		reject(new HttpException(404, this.url));
				// 		return;
				// 	}
				//
				if (axios.isCancel(e)) {
					// Should already be set when I abort but just in case its aborted somehow else
					this.aborted = true;
					console.log('Api cancelled: ', e.message);
				}

				response = e.response;
			}
			this.response = response;
			resolve();
		});
	}
}
