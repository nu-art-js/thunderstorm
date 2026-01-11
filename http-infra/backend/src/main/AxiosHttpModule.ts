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
import {ApiDef, BaseHttpModule_Class, BaseHttpRequest, TypedApi} from '@nu-art/thunderstorm-shared';
import {BadImplementationException, composeUrl, StaticLogger, StringMap} from '@nu-art/ts-common';
import {ApiError_GeneralErrorMessage, ApiErrorResponse, ResponseError} from '@nu-art/ts-common/core/exceptions/types';

// Axios v1+ import style
import axios, {AxiosRequestConfig as Axios_RequestConfig, AxiosResponse as Axios_Response, CanceledError} from 'axios';
import {Axios_ResponseType} from './types.js';

export class AxiosHttpModule_Class extends BaseHttpModule_Class {
	private requestOption: Axios_RequestConfig = {};

	init() {
		super.init();
		let origin = this.config.origin;
		if (!origin) return;

		if (origin?.endsWith('/')) origin = origin.substring(0, origin.length - 1);
		this.origin = origin;
	}

	createRequest<API extends TypedApi<any, any, any, any>>(apiDef: ApiDef<API>, data?: string): AxiosHttpRequest<API> {
		const request = new AxiosHttpRequest<API>(apiDef.path, data, this.shouldCompress())
			.setLogger(this)
			.setMethod(apiDef.method)
			.setTimeout(this.timeout)
			.setRequestOption(this.requestOption)
			.addHeaders(this.getDefaultHeaders());

		if (apiDef.fullUrl) request.setUrl(apiDef.fullUrl);
		else request.setOrigin(apiDef.baseUrl ?? this.origin).setRelativeUrl(apiDef.path);

		return request;
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}
}

export const AxiosHttpModule = new AxiosHttpModule_Class();

class AxiosHttpRequest<API extends TypedApi<any, any, any, any>> extends BaseHttpRequest<API> {
	private response?: Axios_Response<API['R']>;
	private cancelController: AbortController;
	protected status?: number;
	private requestOption: Axios_RequestConfig = {};

	constructor(requestKey: string, requestData?: string, shouldCompress?: boolean) {
		super(requestKey, requestData);
		this.compress = shouldCompress === undefined ? false : shouldCompress;

		this.cancelController = new AbortController();
	}

	getStatus(): number {
		if (!this.status) throw new BadImplementationException('Missing status..');
		return this.status;
	}

	getResponse(): any {
		return this.response?.data;
	}

	protected abortImpl(): void {
		this.cancelController.abort();
	}

	getErrorResponse(): ApiErrorResponse<ResponseError | ApiError_GeneralErrorMessage> {
		return { debugMessage: this.getResponse() };
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}

	protected executeImpl(): Promise<void> {
		const executor = async (resolve: () => void, reject: (error: any) => void) => {
			if (this.aborted) return resolve();

			const fullUrl = composeUrl(this.url, this.params);
			const body = this.body;

			if (typeof body === 'string') this.addHeader('Content-Length', `${body.length}`);

			const headers = Object.keys(this.headers).reduce((carry: StringMap, headerKey: string) => {
				carry[headerKey] = this.headers[headerKey].join('; ');
				return carry;
			}, {} as StringMap);

			const options: Axios_RequestConfig = {
				...this.requestOption,
				url: fullUrl,
				method: this.method as Axios_RequestConfig['method'],
				headers,
				timeout: this.timeout,
				signal: this.cancelController.signal, // ✅ Axios v1 cancellation
			};

			if (body) options.data = body;
			if (this.responseType) options.responseType = this.responseType as Axios_ResponseType;

			this.logger?.logDebug(options);

			try {
				this.response = await axios.request<API['R']>(options);
				this.status = this.response?.status ?? 200;
				return resolve();
			} catch (e: any) {
				// cancellation path in v1
				if (e instanceof CanceledError || (axios.isCancel && axios.isCancel(e)) || e?.code === 'ERR_CANCELED') {
					this.aborted = true;
					StaticLogger.logWarning('Api cancelled: ', e.message);
				}

				this.response = e?.response;
				this.status = this.response?.status ?? 500;
				return reject(e);
			}
		};

		return new Promise<void>(executor);
	}

	_getResponseHeader(headerKey: string): string | string[] | undefined {
		if (!this.response) throw new BadImplementationException(`axios didn't return yet`);
		return this.response.headers?.[headerKey as keyof typeof this.response.headers] as any;
	}
}
