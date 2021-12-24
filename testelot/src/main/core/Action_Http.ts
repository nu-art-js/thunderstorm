/*
 * Testelot is a typescript scenario composing framework
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

/**
 * Created by TacB0sS on 3/18/17.
 */
import {Exception, ImplementationMissingException, ObjectTS, regexpCase,} from '@nu-art/ts-common';
import {Action} from './Action';
import * as fetch from 'node-fetch';

export enum HttpMethod {
	ALL = 'all',
	POST = 'post',
	GET = 'get',
	PATCH = 'patch',
	DELETE = 'delete',
	PUT = 'put',
	OPTIONS = 'options',
	HEAD = 'head',
}

export class Action_Http<T extends ObjectTS = any>
	extends Action {

	private readonly headers: { [key: string]: string | ((action: Action<any>) => string) } = {};
	private readonly method: HttpMethod;

	private params: any = {};

	private url!: string | ((action: Action<any>) => string);
	private body!: string | object | ((action: Action<any>) => string | object);

	private responseStatus: number = 200;
	private responseProcessor?: (response: any) => any;
	static global_resolveResponseBody: (action: Action<any>, response: fetch.Response) => Promise<any>;


	protected constructor(method: HttpMethod) {
		super(Action_Http);
		this.method = method;
	}

	public setUrl(url: string | ((action: Action<any>) => string)) {
		this.url = url;
		return this;
	}

	public setBody(body: string | T | ((action: Action<any>) => string | T)) {
		this.body = body;
		return this;
	}

	public setParams(params: object) {
		this.params = params;
		return this;
	}

	public addHeader(key: string, value: string | ((action: Action<any>) => string)) {
		this.headers[key] = value;
		return this;
	}

	public setResponseStatus(status: number) {
		this.responseStatus = status;
		return this;
	}

	public setResponseProcessor(validator?: (response: any) => void) {
		this.responseProcessor = validator;
		return this;
	}

	private resolveBody(): string {
		if (typeof this.body === 'function')
			this.body = this.body(this);

		if (typeof this.body === 'string')
			return this.body;

		this.addHeader('Accept', 'application/json');
		this.addHeader('Content-Type', 'application/json');

		return JSON.stringify(this.body, null, 2);
	}

	private resolveUrl() {
		if (typeof this.url === 'function')
			this.url = this.url(this);

		return this.url + `${this.toUrlParams()}`;
	}


	private toUrlParams() {
		if (!this.params)
			return '';

		if (typeof this.params === 'function')
			this.params = this.params();

		if (Object.keys(this.params).length === 0)
			return '';

		return `?${Object.keys(this.params).map((key) => {
			return `${key}=${this.params[key]}`;
		}).join('&')}`;
	}

	protected async execute() {
		const url = this.resolveUrl();
		const body = this.resolveBody();
		const headers: { [key: string]: string } = {};
		for (const key of Object.keys(this.headers)) {
			const value = this.headers[key];
			if (typeof value !== 'string') {
				headers[key] = value(this);
			} else
				headers[key] = value;
		}

		const requestBody: fetch.RequestInit = {
			headers: JSON.parse(JSON.stringify(headers)),
			body: body,
			method: this.method
		};

		this.logInfo(`----- Method: ${requestBody.method}`);
		this.logInfo(`-------- Uri: ${url}`);

		if (Object.keys(headers).length > 0) {
			this.logVerbose('-------- Headers --------');
			for (const key of Object.keys(headers)) {
				this.logVerbose(`  ${key}: ${headers[key]}`);
			}
			this.logVerbose('-------------------------');
		}

		if (requestBody.body) {
			this.logVerbose('--------- Request Body ----------');
			this.logVerbose(body);
			this.logVerbose('-------------------------');
		}

		return await this.executeHttpRequest(requestBody);
	}

	private async resolveResponseBody(response: fetch.Response): Promise<any> {
		const contentType = response.headers.get('Content-Type');
		if (!contentType)
			return;

		// @ts-ignore
		let match;
		switch (contentType) {
			case (match = regexpCase(contentType, '.*application/json.*')).input:
				return await response.json();

			case (match = regexpCase(contentType, '.*application/x-www-form-urlencoded.*')).input:
				return decodeURI((await response.text()));

			case (match = regexpCase(contentType, '^text\\/.*')).input:
				return await response.text();

			default:
				if (Action_Http.global_resolveResponseBody)
					return Action_Http.global_resolveResponseBody(this, response);
		}

		throw new ImplementationMissingException(`unhandled response with content-type: ${contentType}`);
	}

	private async executeHttpRequest(requestBody: fetch.RequestInit) {
		const response: fetch.Response = await fetch.default(this.resolveUrl(), requestBody);

		const status = response.status;
		let _responseBody: string = '';
		const expectedStatus = this.responseStatus;
		if (status !== expectedStatus || status >= 500 && status < 600) {
			try {
				_responseBody = await response.text();
			} catch (ignore:any) {
				this.logError(ignore);
			}

			this.logError(`Got Response code: ${status}`);
			this.logError(`Got Response body: ${_responseBody}`);

			throw new Exception(`wrong status code from server. Expected: ${expectedStatus}    received: ${status}`);
		}

		// we don't want to undefine what was already defined just because we failed...
		if (status !== 200 && this.writeKey)
			this.get(this.writeKey);

		let responseBody = await this.resolveResponseBody(response);
		if (this.responseProcessor)
			responseBody = this.responseProcessor(responseBody);

		if (responseBody) {
			this.logVerbose('--------- Response ----------');
			this.logVerbose(typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody);
			this.logVerbose('-------------------------');
		}

		return responseBody;
	}
}
