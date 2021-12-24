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
import {ApiTypeBinder, ErrorResponse, HttpMethod} from "../../../shared/types";

import {BadImplementationException} from "@nu-art/ts-common";
import {gzip} from "zlib";
// noinspection TypeScriptPreferShortImport
import {HttpException} from "../../../shared/request-types";
// noinspection TypeScriptPreferShortImport
import {BaseHttpRequest} from "../../../shared/BaseHttpRequest";
import {BaseHttpModule_Class} from "../../../shared/BaseHttpModule";

export class XhrHttpModule_Class
	extends BaseHttpModule_Class {

	init() {
		super.init();
		const origin = this.config.origin;
		if (!origin)
			throw new BadImplementationException("Did you forget to set the origin config key for the HttpModule?");

		this.origin = origin;
	}

	createRequest<Binder extends ApiTypeBinder<any, any, any, any>>(method: HttpMethod, key: string, data?: string): XhrHttpRequest<Binder> {
		return new XhrHttpRequest<Binder>(key, data, this.shouldCompress())
			.setOrigin(this.origin)
			.setMethod(method)
			.setTimeout(this.timeout)
			.addHeaders(this.getDefaultHeaders())
			.setHandleRequestSuccess(this.handleRequestSuccess)
			.setHandleRequestFailure(this.handleRequestFailure)
			.setDefaultRequestHandler(this.processDefaultResponseHandlers);
	}

}

export const XhrHttpModule = new XhrHttpModule_Class();

class XhrHttpRequest<Binder extends ApiTypeBinder<any, any, any, any>>
	extends BaseHttpRequest<Binder> {

	private readonly xhr?: XMLHttpRequest;

	constructor(requestKey: string, requestData?: string, shouldCompress?: boolean) {
		super(requestKey, requestData);
		this.compress = shouldCompress === undefined ? true : shouldCompress;
	}

	getStatus(): number {
		const xhr = this.xhr;
		if (!xhr)
			throw new BadImplementationException("No xhr object!");

		return xhr.status;
	}

	protected getResponse() {
		const xhr = this.xhr;
		if (!xhr)
			throw new BadImplementationException("No xhr object!");

		return xhr.response;
	}

	protected abortImpl(): void {
		this.xhr?.abort();
	}

	getErrorResponse(): ErrorResponse<Binder["errors"]> {
		const rawResponse = this.getResponse();
		let response = undefined as unknown as ErrorResponse<Binder["errors"]>;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson() as unknown as ErrorResponse<Binder["errors"]>;
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

			// TODO: investigate which one should work
			this.xhr.onprogress = this.onProgressListener;
			this.xhr.upload.onprogress = this.onProgressListener;

			this.xhr.open(this.method, fullUrl);
			this.xhr.timeout = this.timeout;

			Object.keys(this.headers).forEach((key) => {
				xhr.setRequestHeader(key, this.headers[key].join("; "));
			});

			const body = this.body;
			if (typeof body === "string" && this.compress)
				return gzip(body, (error: Error | null, result: Buffer) => {
					if (error)
						return reject(error);

					xhr.send(result);
				});

			this.xhr.send(body as XMLHttpRequestBodyInit);
		});
	}

	getResponseHeader(headerKey: string): string | string[] | undefined {
		if (!this.xhr)
			throw new BadImplementationException("No xhr object!");

		if (!this.xhr.response)
			throw new BadImplementationException(`xhr didn't return yet`);

		const header = this.xhr.getResponseHeader(headerKey);
		if (!header)
			return undefined;

		return header;
	}
}
