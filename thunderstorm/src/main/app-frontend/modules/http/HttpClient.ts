/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {
	__stringify,
	StringMap
} from "@ir/ts-common";
import {
	ErrorResponse,
	HttpMethod
} from "../../..";
import {
	ApiException,
	promisifyRequest,
	RequestOptions
} from "../../../backend";

export const createFormData = (filename: string, buffer: Buffer) => ({file: {value: buffer, options: {filename}}});

export class HttpClient {

	private defaultHeaders!: Headers;
	private readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	setDefaultHeaders(defaultHeaders: Headers) {
		this.defaultHeaders = defaultHeaders
	}

	form(path: string, buffer: Buffer, headers?: Headers) {
		const request: RequestOptions = {
			headers: {...this.defaultHeaders, headers},
			uri: `${this.baseUrl}${path}`,
			formData: createFormData('logs.zip', buffer),
			method: HttpMethod.POST,
		};
		return this.executeRequest(request);
	}

	get(path: string, _params?: StringMap, headers?: Headers) {
		let url = `${this.baseUrl}${path}`;

		let nextOperator = "?";
		if (url.indexOf("?") !== -1)
			nextOperator = "&";

		if (_params)
			url = Object.keys(_params).reduce((fullUrl: string, paramKey: string) => {
				const param: string | undefined = _params[paramKey];
				if (!param)
					return url;

				const temp = `${fullUrl}${nextOperator}${paramKey}=${encodeURIComponent(param)}`;
				nextOperator = "&";
				return temp;
			}, url);

		const request: RequestOptions = {
			headers: {...this.defaultHeaders, headers},
			uri: `${url}`,
			method: HttpMethod.GET,
			json: true
		};
		return this.executeRequest(request);
	}

	post(path: string, body: any, headers?: Headers) {
		const request: RequestOptions = {
			headers: {...this.defaultHeaders, headers},
			uri: `${this.baseUrl}${path}`,
			body,
			method: HttpMethod.POST,
			json: true
		};
		return this.executeRequest(request);

	}

	put(path: string, body: any, headers?: Headers) {
		const request: RequestOptions = {
			headers: {...this.defaultHeaders, headers},
			uri: `${this.baseUrl}${path}`,
			body,
			method: HttpMethod.PUT,
			json: true
		};
		return this.executeRequest(request);
	}

	private executeRequest = async (body: RequestOptions) => {
		const response = await promisifyRequest(body, false);
		const statusCode = response.statusCode;
		if (statusCode >= 200 && statusCode < 300)
			return response.toJSON().body;

		const errorResponse: ErrorResponse<any> = response.body;
		if (!errorResponse)
			throw new ApiException(statusCode, `Http request failed without error message: ${__stringify(body, true)}`);

		throw new ApiException<any>(statusCode, `Http request failed: ${errorResponse} \n For Request: ${__stringify(body, true)}`);
	};
}
