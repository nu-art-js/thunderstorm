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
import {_keys, _setTimeout, BadImplementationException} from '@nu-art/ts-common';
import {ErrorResponse, HttpMethod, TypedApi} from './types';
import {HttpException, RequestErrorHandler, RequestSuccessHandler, TS_Progress} from './request-types';


export type ErrorType = any

export abstract class BaseHttpRequest<API extends TypedApi<any, any, any, any>> {

	key: string;
	requestData!: any;
	errorMessage!: string;
	successMessage!: string;

	protected origin?: string;
	protected headers: { [s: string]: string[] } = {};
	protected method: HttpMethod = HttpMethod.GET;
	protected timeout: number = 10000;
	protected body!: API['B'];
	protected url!: string;
	protected params: { [K in keyof API['P']]?: API['P'][K] } = {};
	protected responseType!: string;

	protected label!: string;
	protected onProgressListener!: (ev: TS_Progress) => void;
	protected handleRequestSuccess!: RequestSuccessHandler;
	protected handleRequestFailure!: RequestErrorHandler<ErrorType>;
	protected onError?: RequestErrorHandler<ErrorType>;
	protected aborted: boolean = false;
	protected compress: boolean;
	private defaultResponseHandler?: (request: BaseHttpRequest<any>) => boolean;

	constructor(requestKey: string, requestData?: any) {
		this.key = requestKey;
		this.requestData = requestData;
		this.compress = false;
	}

	setHandleRequestSuccess(handleRequestSuccess: RequestSuccessHandler) {
		this.handleRequestSuccess = handleRequestSuccess;
		return this;
	}

	setHandleRequestFailure(handleRequestFailure: RequestErrorHandler<ErrorType>) {
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

	setOnError(errorMessage: string | RequestErrorHandler<ErrorType>) {
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

	protected resolveResponse(): API['R'] {
		const rawResponse = this.getResponse();
		let response: API['R'] = undefined as unknown as API['R'];
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

	async executeSync(): Promise<API['R']> {
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

	execute(responseHandler?: (response: API['R'], data?: string) => Promise<void> | void) {
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
				.then(() => console.log(`Async call completed: ${label} ${this.requestData}`))
				.catch(reason => console.warn(`Async call error: ${label} ${this.requestData}`, reason));
		});
		return this;
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


