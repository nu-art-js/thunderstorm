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
import {_keys, _setTimeout, BadImplementationException, Logger, ObjectTS} from '@nu-art/ts-common';
import {ApiTypeBinder, ErrorResponse, HttpMethod, QueryParams} from './types';
import {HttpException, RequestErrorHandler, RequestSuccessHandler, TS_Progress} from './request-types';


export abstract class BaseHttpRequest<Binder extends ApiTypeBinder<any, any, any, any>,
	U extends string = Binder['url'],
	R extends any = Binder['response'],
	B extends any = Binder['body'],
	P extends QueryParams = Binder['params'],
	E extends ObjectTS = Binder['errors']> {

	key: string;
	requestData!: any;
	errorMessage!: string;
	successMessage!: string;

	protected origin?: string;
	protected headers: { [s: string]: string[] } = {};
	protected method: HttpMethod = HttpMethod.GET;
	protected timeout: number = 10000;
	protected body!: B;
	protected url!: string;
	protected params: { [K in keyof P]?: P[K] } = {};
	protected responseType!: string;

	protected label!: string;
	protected onProgressListener!: (ev: TS_Progress) => void;
	protected handleRequestSuccess!: RequestSuccessHandler;
	protected handleRequestFailure!: RequestErrorHandler<E>;
	protected onError?: RequestErrorHandler<E>;
	protected aborted: boolean = false;
	protected compress: boolean;
	private defaultResponseHandler?: (request: BaseHttpRequest<any>) => boolean;
	private logger?: Logger;

	constructor(requestKey: string, requestData?: any, logger?: Logger) {
		this.logger = logger;
		this.key = requestKey;
		this.requestData = requestData;
		this.compress = false;
	}

	setHandleRequestSuccess(handleRequestSuccess: RequestSuccessHandler) {
		this.handleRequestSuccess = handleRequestSuccess;
		return this;
	}

	setHandleRequestFailure(handleRequestFailure: RequestErrorHandler<E>) {
		this.handleRequestFailure = handleRequestFailure;
		return this;
	}

	getErrorMessage() {
		return this.errorMessage;
	}

	getSuccessMessage() {
		return this.successMessage;
	}

	getRequestData() {
		return this.requestData;
	}

	setOrigin(origin?: string) {
		this.origin = origin;
		return this;
	}

	setOnError(errorMessage: string | RequestErrorHandler<E>) {
		if (typeof errorMessage === 'string') {
			// @ts-ignore
			// noinspection JSConstantReassignment
			this.errorMessage = errorMessage;
		} else
			this.onError = errorMessage;

		return this;
	}

	setOnSuccessMessage(successMessage: string) {
		// @ts-ignore
		// noinspection JSConstantReassignment
		this.successMessage = successMessage;
		return this;
	}

	setOnProgressListener(onProgressListener: (ev: TS_Progress) => void) {
		this.onProgressListener = onProgressListener;
		return this;
	}

	setDefaultRequestHandler(processDefaultResponseHandlers: (request: BaseHttpRequest<any>) => boolean) {
		this.defaultResponseHandler = processDefaultResponseHandlers;
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

	public setUrlParams(params: P) {
		if (!params)
			return this;

		_keys(params).forEach((key) => {
			const param = params[key];
			return param && typeof param === 'string' && this.setUrlParam(key, param);
		});

		return this;
	}

	setUrlParam<K extends keyof P = keyof P>(key: K, value: P[K]) {
		delete this.params[key];
		this.params[key] = value;
		return this;
	}

	public setUrl(url: string) {
		this.url = url;
		return this;
	}

	public setRelativeUrl(relativeUrl: U) {
		if (!this.origin)
			throw new BadImplementationException('if you want to use relative urls, you need to set an origin');

		this.url = this.origin + relativeUrl;
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

	setJsonBody(bodyObject: B, compress?: boolean) {
		this.setHeader('content-type', 'application/json');
		this.setBody(this.prepareJsonBody(bodyObject), compress);
		return this;
	}

	protected prepareJsonBody(bodyObject: B): any {
		return bodyObject;
	}

	setBody(bodyAsString: any, _compress?: boolean) {
		this.body = bodyAsString;
		this.compress = _compress === undefined ? this.compress : _compress;
		if (typeof bodyAsString === 'string' && this.compress)
			this.setHeader('Content-encoding', 'gzip');

		return this;
	}

	asJson(): R {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException('No xhr.response...');

		return JSON.parse(response as unknown as string) as R;
	}

	asText() {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException('No xhr object... maybe you didn\'t wait for the request to return??');

		return response;
	}

	protected resolveResponse(): R {
		const rawResponse = this.getResponse();
		let response: R = undefined as unknown as R;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson();
			} catch (e: any) {
				response = this.asText();
			}
		}
		return response;
	}

	private handleFailure(reject?: (reason?: any) => void) {
		const errorResponse = this.getErrorResponse();
		this.onError?.(this, errorResponse);
		this.handleRequestFailure(this, errorResponse);
		reject?.(errorResponse);
	}

	private isValidStatus() {
		const statusCode = this.getStatus();
		return statusCode >= 200 && statusCode < 300;
	}

	async executeSync(): Promise<R> {
		await this.executeImpl();
		if (this.aborted)
			throw new HttpException(this.getStatus(), this.url);// should be status 0

		// run this anyway to have consistent behaviour
		this.defaultResponseHandler?.(this);

		if (!this.isValidStatus()) {
			this.handleFailure();
			throw new HttpException(this.getStatus(), this.url);
		}

		this.handleRequestSuccess(this);
		return this.resolveResponse();
	}

	execute(responseHandler?: (response: R, data?: string) => Promise<void> | void) {
		const toCall = async (resolve: (value?: unknown) => void, reject: (reason?: any) => void) => {
			await this.executeImpl();
			if (this.aborted)
				return resolve();

			if (this.defaultResponseHandler?.(this))
				return resolve();

			if (!this.isValidStatus())
				return this.handleFailure(reject);

			const response = this.resolveResponse();
			responseHandler && await responseHandler(response, this.requestData);
			this.handleRequestSuccess(this);
			resolve();
		};

		_setTimeout(() => {
			const label = this.label || `http request: ${this.key} ${this.requestData}`;
			new Promise(toCall)
				.then(() => this.logger?.logVerbose(`Async call completed: ${label} ${this.requestData || ''}`))
				.catch(reason => this.logger?.logWarning(`Async call error: ${label} ${this.requestData || ''}`, reason));
		});
		return this;
	}

	protected abstract getResponse(): R

	abstract getErrorResponse(): ErrorResponse<E>

	protected abstract abortImpl(): void

	abstract getStatus(): number;

	abstract getResponseHeader(headerKey: string): string | string[] | undefined;

	abort() {
		this.aborted = true;
		this.abortImpl();
	}

	protected abstract executeImpl(): Promise<void>
}


