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
import {_keys, BadImplementationException, Logger} from '@nu-art/ts-common';
import {ErrorResponse, HttpMethod, TypedApi} from './types';
import {HttpException, TS_Progress} from './request-types';


export type ErrorType = any

export abstract class BaseHttpRequest<API extends TypedApi<any, any, any, any>> {

	key: string;
	requestData!: any;

	protected origin?: string;
	protected headers: { [s: string]: string[] } = {};
	protected method: HttpMethod = HttpMethod.GET;
	protected timeout: number = 10000;
	protected body!: API['B'];
	protected url!: string;
	protected params: { [K in keyof API['P']]?: API['P'][K] } = {};
	protected responseType!: string;

	protected label: string;
	protected onProgressListener!: (ev: TS_Progress) => void;
	protected aborted: boolean = false;
	protected compress: boolean;
	protected logger?: Logger;
	private onCompleted?: ((response: API['R'], input: (API['P'] | API['B'])) => Promise<any>) | undefined;

	constructor(requestKey: string, requestData?: any) {
		this.key = requestKey;
		this.requestData = requestData;
		this.label = `http request: ${requestKey}${requestData ? ` ${requestData}` : ''}`;
		this.compress = false;
	}

	setLogger(logger?: Logger) {
		this.logger = logger;
		return this;
	}

	getRequestData() {
		return this.requestData;
	}

	setOrigin(origin?: string) {
		this.origin = origin;
		return this;
	}

	setOnProgressListener(onProgressListener: (ev: TS_Progress) => void) {
		this.onProgressListener = onProgressListener;
		return this;
	}

	setLabel(label: string) {
		this.label = label;
		return this;
	}

	public setMethod(method: HttpMethod) {
		this.method = method;
		return this;
	}

	public setResponseType(responseType: string) {
		this.responseType = responseType;
		return this;
	}

	public setUrlParams(params: API['P']) {
		if (!params)
			return this;

		_keys(params).forEach((key) => {
			const param = params[key];
			return param && typeof param === 'string' && this.setUrlParam(key, param);
		});

		return this;
	}

	setUrlParam<K extends keyof API['P'] = keyof API['P']>(key: K, value: API['P'][K]) {
		delete this.params[key];
		this.params[key] = value;
		return this;
	}

	public setUrl(url: string) {
		this.url = url;
		return this;
	}

	public setRelativeUrl(relativeUrl: string) {
		if (!this.origin)
			throw new BadImplementationException('if you want to use relative urls, you need to set an origin');

		this.url = this.origin + relativeUrl;
		this.url.replace(/\/\//g, '/');
		return this;
	}

	setTimeout(timeout: number) {
		this.timeout = timeout;
		return this;
	}

	setHeaders(headers: { [s: string]: string | string[] }) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.setHeader(key, headers[key]));
		return this;
	}

	addHeaders(headers: { [s: string]: string | string[] }) {
		if (!headers)
			return this;

		Object.keys(headers).forEach((key) => this.addHeader(key, headers[key]));
		return this;
	}

	setHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();

		delete this.headers[key];
		return this.addHeader(key, value);
	}

	addHeader(_key: string, value: string | string[]) {
		const key = _key.toLowerCase();
		return this._addHeaderImpl(key, value);
	}

	removeHeader(key: string) {
		delete this.headers[key];
		return this;
	}

	protected _addHeaderImpl(key: string, value: string | string[]) {
		const values: string[] = Array.isArray(value) ? value : [value];

		if (!this.headers[key])
			this.headers[key] = values;
		else
			this.headers[key].push(...values);

		return this;
	}

	setJsonBody(bodyObject: API['B'], compress?: boolean) {
		this.setHeader('content-type', 'application/json');
		this.setBody(this.prepareJsonBody(bodyObject), compress);
		return this;
	}

	protected prepareJsonBody(bodyObject: API['B']): any {
		return bodyObject;
	}

	setBody(bodyAsString: any, _compress?: boolean) {
		this.body = bodyAsString;
		this.compress = _compress === undefined ? this.compress : _compress;
		if (typeof bodyAsString === 'string' && this.compress)
			this.setHeader('Content-encoding', 'gzip');

		return this;
	}

	asJson(): API['R'] {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException('No xhr.response...');

		return JSON.parse(response as unknown as string) as API['R'];
	}

	asText() {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException('No xhr object... maybe you didn\'t wait for the request to return??');

		return response;
	}

	isValidStatus(statusCode: number) {
		return statusCode >= 200 && statusCode < 300;
	}

	async executeSync(): Promise<API['R']> {
		await this.executeImpl();
		const status = this.getStatus();

		if (this.aborted)
			throw new HttpException(status, this.url);// should be status 0

		if (!this.isValidStatus(status)) {
			const errorResponse = this.getErrorResponse();
			throw new HttpException(status, this.url, errorResponse);
		}

		const response: API['R'] = this.getResponse();
		if (!response) {
			this.onCompleted?.(response, this.params || this.body);
			return response;
		}

		try {
			return JSON.parse(response as unknown as string) as API['R'];
		} catch (ignore: any) {
			return response;
		}
	}

	execute(onSuccess: (response: API['R'], data?: string) => Promise<void> | void = () => this.logger?.logVerbose(`Completed: ${this.label}`),
					onError: (reason: any) => any = reason => this.logger?.logWarning(`Error: ${this.label}`, reason)) {

		this.executeSync()
			.then(onSuccess)
			.catch(onError);

		return this;
	}

	setOnCompleted(onCompleted?: (response: API['R'], input: API['P'] | API['B']) => Promise<any>) {
		this.onCompleted = onCompleted;
	}

	protected abstract getResponse(): API['R']

	abstract getErrorResponse(): ErrorResponse<ErrorType>

	protected abstract abortImpl(): void

	abstract getStatus(): number;

	abstract getResponseHeader(headerKey: string): string | string[] | undefined;

	abort() {
		this.aborted = true;
		this.abortImpl();
	}

	protected abstract executeImpl(): Promise<void>
}


