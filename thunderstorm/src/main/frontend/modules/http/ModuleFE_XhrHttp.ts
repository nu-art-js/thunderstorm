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
import {ApiDef, ErrorResponse, TypedApi} from '../../../shared/types';

import {BadImplementationException, composeUrl} from '@nu-art/ts-common';
// noinspection TypeScriptPreferShortImport
import {BaseHttpModule_Class, BaseHttpRequest, ErrorType, HttpException} from '../../../shared';
// noinspection TypeScriptPreferShortImport
import {gzipSync} from 'zlib';


export class ModuleFE_XhrHttp_Class
	extends BaseHttpModule_Class {

	init() {
		super.init();
		let origin = this.config.origin;
		if (!origin)
			throw new BadImplementationException('Did you forget to set the origin config key for the HttpModule?');

		if (origin?.endsWith('/'))
			origin = origin.substring(0, origin.length - 1);

		this.origin = origin;
	}

	createRequest<API extends TypedApi<any, any, any, any>>(apiDef: ApiDef<API>, data?: string): XhrHttpRequest<API> {
		const request = new XhrHttpRequest<API>(apiDef.path, data, this.shouldCompress())
			.setLogger(this)
			.setMethod(apiDef.method)
			.setTimeout(this.timeout)
			.addHeaders(this.getDefaultHeaders());

		if (apiDef.fullUrl)
			request.setUrl(apiDef.fullUrl);
		else
			request
				.setOrigin(this.origin)
				.setRelativeUrl(apiDef.path);

		return request;
	}
}

export const ModuleFE_XhrHttp = new ModuleFE_XhrHttp_Class();

class XhrHttpRequest<Binder extends TypedApi<any, any, any, any>>
	extends BaseHttpRequest<Binder> {

	private readonly xhr?: XMLHttpRequest;

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

	protected getResponse() {
		const xhr = this.xhr;
		if (!xhr)
			throw new BadImplementationException('No xhr object!');

		return xhr.response;
	}

	protected abortImpl(): void {
		this.xhr?.abort();
	}

	getErrorResponse(): ErrorResponse<ErrorType> {
		const rawResponse = this.getResponse();
		let response = undefined as unknown as ErrorResponse<ErrorType>;
		if (rawResponse) {
			try {
				response = rawResponse && JSON.parse(rawResponse as unknown as string) as ErrorResponse<ErrorType>;
			} catch (e: any) {
				response = {debugMessage: rawResponse};
			}
		}
		return response;
	}

	protected prepareJsonBody(bodyObject: any) {
		return JSON.stringify(bodyObject);
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

			const fullUrl = composeUrl(this.url, this.params);

			// TODO: investigate which one should work
			this.xhr.onprogress = this.onProgressListener;
			this.xhr.upload.onprogress = this.onProgressListener;

			this.xhr.open(this.method, fullUrl);
			this.xhr.timeout = this.timeout;

			Object.keys(this.headers).forEach((key) => {
				xhr.setRequestHeader(key, this.headers[key].join('; '));
			});

			let body: any = this.body;
			if (typeof body === 'string' && this.compress)
				try {
					body = gzipSync(this.body);
				} catch (error) {
					return reject(error);
				}

			return this.xhr.send(body);
		});
	}

	getResponseHeader(headerKey: string): string | string[] | undefined {
		if (!this.xhr)
			throw new BadImplementationException('No xhr object!');

		if (!this.xhr.response)
			throw new BadImplementationException(`xhr didn't return yet`);

		// Chrome bug, if the response header is not present then it throws an error (not really problematic but just annoying)
		// https://trackjs.com/blog/refused-unsafe-header/
		if (this.xhr.getAllResponseHeaders().indexOf(headerKey) < 0)
			return undefined;

		const header = this.xhr.getResponseHeader(headerKey);
		if (!header)
			return undefined;

		return header;
	}
}

