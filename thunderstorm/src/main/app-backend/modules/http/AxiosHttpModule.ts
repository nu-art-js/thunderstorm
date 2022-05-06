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
import axios from 'axios';
import {ApiDef, ErrorResponse, TypedApi} from '../../../shared/types';
import {BadImplementationException, StringMap,} from '@nu-art/ts-common';
import {BaseHttpRequest, ErrorType} from '../../../shared/BaseHttpRequest';
import {BaseHttpModule_Class} from '../../../shared/BaseHttpModule';
import {Axios_CancelTokenSource, Axios_Method, Axios_RequestConfig, Axios_Response, Axios_ResponseType} from './types';


export class AxiosHttpModule_Class
	extends BaseHttpModule_Class {
	private requestOption: Axios_RequestConfig = {};

	init() {
		super.init();
		const origin = this.config.origin;
		if (origin)
			this.origin = origin;
	}

	createRequest<API extends TypedApi<any, any, any, any>>(apiDef: ApiDef<API>, data?: string): AxiosHttpRequest<API> {
		return new AxiosHttpRequest<API>(apiDef.path, data, this.shouldCompress())
			.setOrigin(this.origin)
			.setMethod(apiDef.method)
			.setTimeout(this.timeout)
			.addHeaders(this.getDefaultHeaders())
			.setHandleRequestSuccess(this.handleRequestSuccess)
			.setHandleRequestFailure(this.handleRequestFailure)
			.setDefaultRequestHandler(this.processDefaultResponseHandlers)
			.setRequestOption(this.requestOption);
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}

	// async downloadFile(url: string, outputFile: string, key = `Download file: ${url}`) {
	// 	const downloadRequest = await this.createRequest(HttpMethod.GET, key)
	// 		.setResponseType('arraybuffer')
	// 		.setUrl(url);
	//
	// 	const downloadResponse = await downloadRequest.executeSync();
	// 	const outputFolder = outputFile.substring(0, outputFile.lastIndexOf('/'));
	// 	if (!fs.existsSync(outputFolder))
	// 		fs.mkdirSync(outputFolder);
	//
	// 	fs.writeFileSync(outputFile, downloadResponse);
	// 	return outputFile;
	// }
}

export const AxiosHttpModule = new AxiosHttpModule_Class();

class AxiosHttpRequest<API extends TypedApi<any, any, any, any>>
	extends BaseHttpRequest<API> {
	private response?: Axios_Response<API['R']>;
	private cancelSignal: Axios_CancelTokenSource;
	protected status?: number;
	private requestOption: Axios_RequestConfig = {};

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

	getErrorResponse(): ErrorResponse<ErrorType> {
		return {debugMessage: this.getResponse()};
	}

	setRequestOption(requestOption: Axios_RequestConfig) {
		this.requestOption = requestOption;
		return this;
	}

	protected executeImpl(): Promise<void> {
		//loop through whatever preprocessor
		const executor = async (resolve: () => void, reject: (error: any) => void) => {
			if (this.aborted)
				return resolve();

			let nextOperator = this.url.indexOf('?') === -1 ? '?' : '&';
			const fullUrl = Object.keys(this.params).reduce((url: string, paramKey: string) => {
				const param: string | undefined = this.params[paramKey];
				if (!param)
					return url;

				const toRet = `${url}${nextOperator}${paramKey}=${encodeURIComponent(param)}`;
				nextOperator = '&';
				return toRet;
			}, this.url);

			// TODO set progress listener
			// this.xhr.upload.onprogress = this.onProgressListener;
			const body = this.body;
			if (body)
				this.addHeader('Content-Length', `${body.length}`);
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

			const options: Axios_RequestConfig = {
				...this.requestOption,
				url: fullUrl,
				method: this.method as Axios_Method,
				headers: headers,
				// TODO will probably need to use the abortController with a timeout for this.
				timeout: this.timeout,
				cancelToken: this.cancelSignal.token
			};

			if (body)
				options.data = body;

			if (this.responseType)
				options.responseType = this.responseType as Axios_ResponseType;

			try {
				this.response = await axios.request(options);
				this.status = this.response?.status || 200;
				return resolve();
			} catch (e: any) {
				// console.log('In catch');
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
		};
		return new Promise<void>(executor);
	}

	getResponseHeader(headerKey: string): string | string[] | undefined {
		if (!this.response)
			throw new BadImplementationException(`axios didn't return yet`);

		return this.response.headers[headerKey];
	}
}