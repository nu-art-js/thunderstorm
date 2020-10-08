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
	addItemToArray,
	BadImplementationException,
	Module,
	removeItemFromArray,
} from "@nu-art/ts-common";
import {BaseHttpRequest} from "./BaseHttpRequest";
import {
	RequestErrorHandler,
	RequestSuccessHandler,
	ResponseHandler
} from "./request-types";
import {
	ApiTypeBinder,
	DeriveBodyType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	ErrorResponse,
	HttpMethod,
	QueryParams
} from "./types";

type HttpConfig = {
	origin?: string
	timeout?: number
	compress?: boolean
}

export abstract class BaseHttpModule_Class<MyRequest extends BaseHttpRequest<any>>
	extends Module<HttpConfig> {

	protected defaultErrorHandlers: RequestErrorHandler<any>[] = [];
	protected defaultSuccessHandlers: RequestSuccessHandler[] = [];

	protected timeout: number = 10000;
	protected readonly defaultResponseHandler: ResponseHandler[] = [];
	protected readonly defaultHeaders: { [s: string]: (() => string | string[]) | string | string[] } = {};

	protected constructor() {
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

	public createRequest = <Binder extends ApiTypeBinder<U, R, B, P> = ApiTypeBinder<void, void, void, {}>, U extends string = DeriveUrlType<Binder>, R = DeriveResponseType<Binder>, B = DeriveBodyType<Binder>, P extends QueryParams = DeriveQueryType<Binder>>(method: HttpMethod, key: string, data?: string): MyRequest<DeriveRealBinder<Binder>> => {
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


		return this.buildRequest(key, data)
		           .setMethod(method)
		           .setTimeout(this.timeout)
		           .addHeaders(defaultHeaders)
		           .setHandleRequestSuccess(this.handleRequestSuccess)
		           .setHandleRequestFailure(this.handleRequestFailure) as BaseHttpRequest<DeriveRealBinder<Binder>>;
	};

	protected abstract buildRequest(requestKey: string, requestData?: string): BaseHttpRequest<any>

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