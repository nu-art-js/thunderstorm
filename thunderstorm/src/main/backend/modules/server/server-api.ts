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

/**
 * Created by tacb0ss on 11/07/2018.
 */
import {
	_keys,
	ApiException,
	BadImplementationException,
	composeUrl,
	currentTimeMillis,
	dispatch_onApplicationException,
	isErrorOfType,
	Logger,
	LogLevel,
	MUSTNeverHappenException, Promise_all_sequentially,
	tsValidate,
	TypedMap,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';

import {Stream} from 'stream';
import {parse} from 'url';
import {HttpServer} from './HttpServer';
// noinspection TypeScriptPreferShortImport
import {ApiDef, BodyApi, QueryApi, QueryParams, TypedApi} from '../../../shared';
import {ExpressRequest, ExpressResponse, ExpressRouter, ServerApi_Middleware} from '../../utils/types';
import {
	MemKey_HttpRequest,
	MemKey_HttpRequestBody,
	MemKey_HttpRequestHeaders,
	MemKey_HttpRequestMethod,
	MemKey_HttpRequestPath,
	MemKey_HttpRequestQuery,
	MemKey_HttpRequestUrl, MemKey_HttpResponse
} from './consts';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export abstract class ServerApi<API extends TypedApi<any, any, any, any>>
	extends Logger {
	public static isDebug: boolean;

	printResponse: boolean = true;
	printRequest: boolean = true;

	headersToLog: string[] = [];

	private url!: string;
	private middlewares?: ServerApi_Middleware[];
	private bodyValidator?: ValidatorTypeResolver<API['B']>;
	private queryValidator?: ValidatorTypeResolver<API['P']>;
	readonly apiDef: ApiDef<API>;
	// readonly method: HttpMethod;
	// readonly relativePath: string;

	protected constructor(apiDef: ApiDef<API>, tag?: string) {
		super(tag || apiDef.path);
		this.setMinLevel(ServerApi.isDebug ? LogLevel.Debug : LogLevel.Info);
		this.apiDef = apiDef;
	}

	setMiddlewares(...middlewares: ServerApi_Middleware[]) {
		this.middlewares = middlewares;
		return this;
	}

	addMiddlewares(...middlewares: ServerApi_Middleware[]) {
		(this.middlewares || (this.middlewares = [])).push(...middlewares);
		return this;
	}

	addMiddleware(middleware: ServerApi_Middleware) {
		(this.middlewares || (this.middlewares = [])).push(middleware);
		return this;
	}

	addHeaderToLog(...headersToLog: string[]) {
		this.headersToLog.push(...headersToLog);
	}

	setBodyValidator(bodyValidator: ValidatorTypeResolver<API['B']>) {
		this.bodyValidator = bodyValidator;
	}

	setQueryValidator(queryValidator: ValidatorTypeResolver<API['P']>) {
		this.queryValidator = queryValidator;
	}

	getUrl() {
		return this.url;
	}

	dontPrintResponse() {
		// @ts-ignore
		this.printResponse = false;
	}

	dontPrintRequest() {
		// @ts-ignore
		this.printRequest = false;
	}

	setMaxResponsePrintSize(printResponseMaxSizeBytes: number) {
		// @ts-ignore
		this.printResponse = printResponseMaxSizeBytes > -1;
	}

	public route(router: ExpressRouter, prefixUrl: string) {
		let path = this.apiDef.path;
		if (!path.startsWith('/'))
			path = `/${path}`;
		const fullPath = `${prefixUrl ? prefixUrl : ''}${path}`;
		this.setTag(fullPath);
		router[this.apiDef.method](fullPath, this.call);
		this.url = `${HttpServer.getBaseUrl()}${fullPath}`;
	}

	call = async (req: ExpressRequest, res: ExpressResponse) => {
		return new MemStorage().init(async () => {
			const startedAt = currentTimeMillis();
			const response: ApiResponse = new ApiResponse(this, res);

			this.logInfo(`Intercepted Url: ${req.path}`);

			if (this.headersToLog.length > 0) {
				const headers: { [s: string]: string | undefined } = {};
				for (const headerName of this.headersToLog) {
					headers[headerName] = req.header(headerName);
				}
				this.logDebug(`-- Headers: `, headers);
			}

			const reqQuery = parse(req.url, true).query as API['P'];
			if (reqQuery && typeof reqQuery === 'object' && Object.keys(reqQuery as QueryParams).length)
				this.logVerbose(`-- Url Params: `, reqQuery);
			else
				this.logVerbose(`-- No Params`);

			const body: API['B'] | string | undefined = req.body;
			if (body && ((typeof body === 'object')))
				if (!this.printRequest)
					this.logVerbose(`-- Body (Object):  - Not Printing --`);
				else
					this.logVerbose(`-- Body (Object): `, body as unknown as object);
			else if (body && (body as string).length)
				if (!this.printRequest)
					this.logVerbose(`-- Body (String):  - Not Printing --`);
				else
					this.logVerbose(`-- Body (String): `, body as unknown as string);
			else
				this.logVerbose(`-- No Body`);

			MemKey_HttpRequest.set(req);
			MemKey_HttpResponse.set(response);
			MemKey_HttpRequestHeaders.set(req.headers);
			MemKey_HttpRequestQuery.set(reqQuery);
			MemKey_HttpRequestUrl.set(req.url);
			MemKey_HttpRequestMethod.set(this.apiDef.method);
			MemKey_HttpRequestPath.set(req.path);
			MemKey_HttpRequestBody.set(body);

			try {
				this.bodyValidator && tsValidate<API['B']>(body as API['B'], this.bodyValidator);
				this.queryValidator && tsValidate<API['P']>(reqQuery, this.queryValidator);

				if (this.middlewares)
					await Promise_all_sequentially(this.middlewares);

				const toReturn: unknown = await this.process();
				if (response.isConsumed())
					return;

				if (!toReturn)
					return await response.end(200);

				// TODO need to handle stream and buffers
				// if (Buffer.isBuffer(toReturn))
				// 	return response.stream(200, toReturn as Buffer);

				const responseType = typeof toReturn;
				if (responseType === 'object')
					return await response.json(200, toReturn as object);

				if (responseType === 'string' && (toReturn as string).toLowerCase().startsWith('<html'))
					return await response.html(200, toReturn as string);

				return await response.text(200, toReturn as string);
			} catch (err: any) {
				let e: any = err;
				if (typeof e === 'string')
					e = new BadImplementationException(`String was thrown: ${e}`);

				if (!(e instanceof Error) && typeof e === 'object')
					e = new BadImplementationException(`Object instance was thrown: ${JSON.stringify(e)}`);

				try {
					this.logErrorBold(e);
				} catch (e2: any) {
					this.logErrorBold('Error while handling error on request...', e2);
					this.logErrorBold(`Original error thrown: ${JSON.stringify(e)}`);
					this.logErrorBold(`-- Someone was stupid... you MUST only throw an Error and not objects or strings!! --`);
				}

				if (isErrorOfType(e, ValidationException))
					e = new ApiException(400, 'Validator exception', e);

				if (!isErrorOfType(e, ApiException))
					e = new ApiException(500, 'Unexpected server error', e);

				const apiException = isErrorOfType(e, ApiException);
				if (!apiException)
					throw new MUSTNeverHappenException('MUST NEVER REACH HERE!!!');

				try {
					await dispatch_onApplicationException.dispatchModuleAsync(e, HttpServer);
				} catch (e: any) {
					this.logError('Error while handing server error', e);
				}
				if (apiException.responseCode === 500)
					return response.serverError(apiException);

				return response.exception(apiException);
			} finally {
				this.logInfo(`Url Complete in: ${req.path} - ${currentTimeMillis() - startedAt}ms`);
			}
		});
	};

	protected abstract process(): Promise<API['R']>;
}

export abstract class ServerApi_Get<API extends QueryApi<any, any, any>>
	extends ServerApi<API> {

	protected constructor(apiDef: ApiDef<API>) {
		super(apiDef);
	}
}

export abstract class ServerApi_Post<API extends BodyApi<any, any, any>>
	extends ServerApi<API> {

	protected constructor(apiDef: ApiDef<API>) {
		super(apiDef);
	}
}

export class ServerApi_Redirect<API extends TypedApi<any, any, any, any>>
	extends ServerApi<any> {
	private readonly responseCode: number;
	private readonly redirectUrl: string;

	public constructor(apiDef: ApiDef<API>, responseCode: number, redirectUrl: string) {
		super(apiDef);
		this.responseCode = responseCode;
		this.redirectUrl = redirectUrl;
	}

	protected async process(): Promise<void> {
		const url = `${composeUrl(`${HttpServer.getBaseUrl()}${this.redirectUrl}`, MemKey_HttpRequestQuery.get())}`;
		MemKey_HttpResponse.get().redirect(this.responseCode, url);
	}
}

export class _ServerQueryApi<API extends QueryApi<any, any, any>>
	extends ServerApi_Get<API> {
	private readonly action: (params: API['P']) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['P']) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(): Promise<API['R']> {
		return this.action(MemKey_HttpRequestQuery.get());
	}
}

export class _ServerBodyApi<API extends BodyApi<any, any, any>>
	extends ServerApi_Post<API> {
	private readonly action: (body: API['B']) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['B']) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(): Promise<API['R']> {
		return this.action(MemKey_HttpRequestBody.get());
	}
}

export class ApiResponse {
	private api: ServerApi<any>;
	private readonly res: ExpressResponse;
	private consumed: boolean = false;

	constructor(api: ServerApi<any>, res: ExpressResponse) {
		this.api = api;
		this.res = res;
	}

	public isConsumed(): boolean {
		return this.consumed;
	}

	private consume() {
		if (this.consumed) {
			this.api.logError('This API was already satisfied!!', new Error());
			return;
		}

		this.consumed = true;
	}

	stream(responseCode: number, stream: Stream, headers?: any) {
		this.consume();

		this.printHeaders(headers);
		this.res.set(headers);
		this.res.writeHead(responseCode);
		stream.pipe(this.res, {end: false});
		stream.on('end', () => {
			this.res.end();
		});
	}

	private printHeaders(headers?: any) {
		if (!headers)
			return this.api.logVerbose(` -- No response headers`);

		if (!this.api.printResponse)
			return this.api.logVerbose(` -- Response (Headers): -- Not Printing --`);

		this.api.logVerbose(` -- Response (Headers): `, headers);
	}

	private printResponse(response?: string | object) {
		if (!response)
			return this.api.logVerbose(` -- No response body`);

		if (!this.api.printResponse)
			return this.api.logVerbose(` -- Response: -- Not Printing --`);

		this.api.logVerbose(` -- Response:`, response);
	}

	public code(responseCode: number, headers?: any) {
		this.printHeaders(headers);
		this.end(responseCode, '', headers);
	}

	text(responseCode: number, response?: string, _headers?: any) {
		const headers = (_headers || {});
		headers['content-type'] = 'text/plain';

		this.end(responseCode, response, headers);
	}

	html(responseCode: number, response?: string, _headers?: any) {
		const headers = (_headers || {});
		headers['content-type'] = 'text/html';

		this.end(responseCode, response, headers);
	}

	json(responseCode: number, response?: object | string, _headers?: any) {
		this._json(responseCode, response, _headers);
	}

	private _json(responseCode: number, response?: object | string, _headers?: any) {
		const headers = (_headers || {});
		headers['content-type'] = 'application/json';

		this.end(responseCode, response, headers);
	}

	end(responseCode: number, response?: object | string, headers?: any) {
		this.consume();

		this.printHeaders(headers);
		this.printResponse(response);

		this.res.set(headers);
		this.res.writeHead(responseCode);
		this.res.end(typeof response !== 'string' ? JSON.stringify(response, null, 2) : response);
	}

	redirect(responseCode: number, url: string, headers: TypedMap<string> = {}) {
		this.consume();
		_keys(headers).reduce((res, headerKey) => {
			res.setHeader((headerKey as string), headers[headerKey]);
			return res;
		}, this.res);
		this.res.redirect(responseCode, url);
	}

	exception(exception: ApiException, headers?: any) {
		const responseBody = exception.responseBody;
		if (!ServerApi.isDebug)
			delete responseBody.debugMessage;

		this._json(exception.responseCode, responseBody, headers);
	}

	serverError(error: Error & { cause?: Error }, headers?: any) {
		const stack = error.cause ? error.cause.stack : error.stack;
		const message = (error.cause ? error.cause.message : error.message) || '';
		this.text(500, ServerApi.isDebug && stack ? stack : message, headers);
	}
}