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
	DeriveErrorType,
	DeriveResponseType,
	ErrorResponse,
	HttpMethod
} from "../../../shared/types";

import {
	BadImplementationException,
	StringMap,
} from "@nu-art/ts-common";
import {BaseHttpRequest} from "../../../shared/BaseHttpRequest";
import axios, {
	AxiosRequestConfig,
	AxiosResponse,
	CancelTokenSource,
	Method
} from 'axios';
import {BaseHttpModule_Class} from "../../../shared/BaseHttpModule";

export class AxiosHttpModule_Class
	extends BaseHttpModule_Class {

	createRequest<Binder extends ApiTypeBinder<any, any, any, any>>(method: HttpMethod, key: string, data?: string): AxiosHttpRequest<DeriveRealBinder<Binder>> {
		return new AxiosHttpRequest<DeriveRealBinder<Binder>>(key, data, this.shouldCompress())
			.setOrigin(this.origin)
			.setMethod(method)
			.setTimeout(this.timeout)
			.addHeaders(this.getDefaultHeaders())
			.setHandleRequestSuccess(this.handleRequestSuccess)
			.setHandleRequestFailure(this.handleRequestFailure)
			.setDefaultRequestHandler(this.processDefaultResponseHandlers);
	}

}

export type DeriveRealBinder<Binder> = Binder extends ApiTypeBinder<infer U, infer R, infer B, infer P> ? ApiTypeBinder<U, R, B, P> : void;

export const AxiosHttpModule = new AxiosHttpModule_Class();

class AxiosHttpRequest<Binder extends ApiTypeBinder<any, any, any, any>>
	extends BaseHttpRequest<Binder> {
	private response?: AxiosResponse<DeriveResponseType<DeriveRealBinder<Binder>>>;
	private cancelSignal: CancelTokenSource;
	protected status?: number;
	private requestOption: AxiosRequestConfig = {};

	constructor(requestKey: string, requestData?: string, shouldCompress?: boolean) {
		super(requestKey, requestData);
		this.compress = shouldCompress === undefined ? false : shouldCompress;
		this.cancelSignal = axios.CancelToken.source();
	}

	getStatus(): number {
		if (!this.status)
			throw new BadImplementationException('Missing status..');

		return this.status;
	}

	getResponse(): any {
		return this.response?.data;
	}

	protected resolveResponse() {
		return this.getResponse();
	}

	protected abortImpl(): void {
		this.cancelSignal.cancel(`Request with key: '${this.key}' aborted by the user.`);
	}

	getErrorResponse(): ErrorResponse<DeriveErrorType<Binder>> {
		return {debugMessage: this.getResponse()};
	}

	setRequestOption(requestOption: AxiosRequestConfig) {
		this.requestOption = requestOption;
		return this;
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
				...this.requestOption,
				url: fullUrl,
				method: this.method as Method,
				headers: headers,
				// TODO will probably need to use the abortController with a timeout for this.
				timeout: this.timeout,
				cancelToken: this.cancelSignal.token
			};

			if (body)
				options.data = body;

			try {
				console.log('before I call');
				this.response = await axios.request(options);
				console.log('After I call');
				this.status = this.response?.status || 200;
				return resolve();
			} catch (e) {
				console.log('In catch');
				// TODO handle this here
				// 	if (xhr.readyState === 4 && xhr.status === 0) {
				// 		reject(new HttpException(404, this.url));
				// 		return;
				// 	}

				if (axios.isCancel(e)) {
					// Should already be set when I abort but just in case its aborted somehow else
					this.aborted = true;
					console.log('Api cancelled: ', e.message);
				}

				this.response = e.response;
				this.status = this.response?.status || 500;
				return reject(e);
			}
		});
	}
}
