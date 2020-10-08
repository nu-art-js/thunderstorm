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
import {
	_keys,
	BadImplementationException
} from "@nu-art/ts-common";
import {
	ApiTypeBinder,
	DeriveBodyType,
	DeriveErrorType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	ErrorResponse,
	HttpMethod,
	QueryParams
} from "./types";
import {
	HttpException,
	RequestErrorHandler,
	RequestSuccessHandler
} from "./request-types";

export abstract class BaseHttpRequest<Binder extends ApiTypeBinder<U, R, B, P, E>,
	U extends string = DeriveUrlType<Binder>,
	R = DeriveResponseType<Binder>,
	B = DeriveBodyType<Binder>,
	P extends QueryParams = DeriveQueryType<Binder>,
	E extends void | object = DeriveErrorType<Binder>> {

	key: string;
	requestData!: string | undefined;
	errorMessage!: string;
	successMessage!: string;

	protected origin: string = '';
	protected headers: { [s: string]: string[] } = {};
	protected method: HttpMethod = HttpMethod.GET;
	protected timeout: number = 10000;
	protected body!: B;
	protected url!: string;
	protected params: { [K in keyof P]?: P[K] } = {};

	protected label!: string;
	protected onResponseListener!: (response: R) => void;
	protected handleRequestSuccess?: RequestSuccessHandler;
	protected handleRequestFailure?: RequestErrorHandler<E>;
	protected aborted: boolean = false;
	protected compress: boolean;

	constructor(requestKey: string, requestData?: string) {
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

	setOrigin(origin: string) {
		this.origin = origin;
		return this;
	}

	setOnError(errorMessage: string | RequestErrorHandler<E>) {
		if (typeof errorMessage === "string") {
			// @ts-ignore
			// noinspection JSConstantReassignment
			this.errorMessage = errorMessage;
		} else
			this.handleRequestFailure = errorMessage;

		return this;
	}

	setOnSuccessMessage(successMessage: string) {
		// @ts-ignore
		// noinspection JSConstantReassignment
		this.successMessage = successMessage;
		return this;
	}

	setOnResponseListener(listener: (response: R) => void) {
		this.onResponseListener = listener;
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

	public setUrlParams(params: P) {
		if (!params)
			return this;

		_keys(params).forEach((key) => {
			const param = params[key];
			return param && typeof param === "string" && this.setUrlParam(key, param);
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
		this.setHeaders({"content-type": "application/json"});
		this.setBody(JSON.stringify(bodyObject), compress);
		return this;
	}

	setBody(bodyAsString: any, _compress?: boolean) {
		this.body = bodyAsString;
		this.compress = _compress === undefined ? this.compress : _compress;
		if (typeof bodyAsString === "string" && this.compress)
			this.setHeader("Content-encoding", "gzip");

		return this;
	}

	asJson() {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException("No xhr.response...");

		return JSON.parse(response) as R;
	}

	asText() {
		const response = this.getResponse();
		if (!response)
			throw new BadImplementationException("No xhr object... maybe you didn't wait for the request to return??");

		return response as R;
	}

	protected resolveResponse(): R {
		const rawResponse = this.getResponse();
		let response: R = undefined as unknown as R;
		if (rawResponse) {
			try {
				response = rawResponse && this.asJson();
			} catch (e) {
				response = this.asText();
			}
		}
		return response;
	}

	async executeSync(): Promise<R> {
		await this.executeImpl();
		if (this.isValidStatus())
			return this.resolveResponse();

		this.handleRequestFailure?.(this, this.getErrorResponse());
		throw new HttpException(this.getStatus(), this.url);
	}

	private isValidStatus() {
		const statusCode = this.getStatus();
		return statusCode >= 200 && statusCode < 300;
	}

	abstract getStatus(): number;

	execute(responseHandler?: (response: R, data?: string) => Promise<void> | void) {
		const toCall = async () => {
			await this.executeImpl();

			if (this.aborted)
				return;

			// TODO need to handle this ()
			// if (HttpModule.processDefaultResponseHandlers(this))
			// 	return;

			if (!this.isValidStatus())
				return this.handleRequestFailure?.(this, this.getErrorResponse());

			const response = this.resolveResponse();

			this.onResponseListener && this.onResponseListener(response);
			responseHandler && await responseHandler(response, this.requestData);
			this.handleRequestSuccess?.(this);
		};

		setTimeout(() => {
			const label = this.label || `http request: ${this.key}`;
			new Promise(toCall)
				.then(() => {
					console.log(`Async call completed: ${label}`);
				})
				.catch(reason => console.warn(`Async call error: ${label}`, reason));
		}, 0);
		return this;
	}

	abstract getResponse(): any

	abstract getErrorResponse(): ErrorResponse<E>

	abstract abortImpl(): void

	abort() {
		this.aborted = true;
		this.abortImpl();
	}

	protected abstract executeImpl(): Promise<void>
}


