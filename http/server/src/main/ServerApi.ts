/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	_keys,
	ApiException,
	BadImplementationException,
	composeUrl,
	currentTimeMillis,
	isErrorOfType,
	Logger,
	LogLevel,
	MimeType_json,
	MUSTNeverHappenException,
	Promise_all_sequentially,
	TypedMap,
	ValidationException
} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {ApiDef, BodyApi, HttpMethod_Body, HttpMethod_Query, QueryApi, QueryParams, TypedApi} from '@nu-art/api-types';
import {HttpCodes} from '@nu-art/api-types';
import {Stream} from 'stream';
import {parse} from 'url';
import type {ExpressRequest, ExpressResponse, ExpressRouter, ServerApi_Middleware} from './types.js';
import {
	MemKey_HttpRequest,
	MemKey_HttpRequestBody,
	MemKey_HttpRequestHeaders,
	MemKey_HttpRequestMethod,
	MemKey_HttpRequestPath,
	MemKey_HttpRequestQuery,
	MemKey_HttpRequestUrl,
	MemKey_HttpResponse,
	MemKey_ServerApi
} from './consts.js';

export abstract class ServerApi<API extends TypedApi<any, any, any, any>>
	extends Logger {

	static isDebug: boolean = false;

	printRequest: boolean = true;
	headersToLog: string[] = [];
	private url!: string;
	private middlewares?: ServerApi_Middleware[];
	readonly apiDef: ApiDef<API>;
	private postCallActions: (() => Promise<any>)[] = [];

	protected constructor(apiDef: ApiDef<API>, tag?: string) {
		super(tag ?? apiDef.path);
		this.setMinLevel(ServerApi.isDebug ? LogLevel.Debug : LogLevel.Info);
		this.apiDef = apiDef;
	}

	setMiddlewares(...middlewares: ServerApi_Middleware[]) {
		this.middlewares = middlewares;
		return this;
	}

	addPostCallAction(sideEffect: () => Promise<any>) {
		this.postCallActions.push(sideEffect);
		return this;
	}

	addMiddlewares(...middlewares: ServerApi_Middleware[]) {
		(this.middlewares ??= []).push(...middlewares);
		return this;
	}

	addMiddleware(middleware: ServerApi_Middleware) {
		(this.middlewares ??= []).push(middleware);
		return this;
	}

	addHeaderToLog(...headersToLog: string[]) {
		this.headersToLog.push(...headersToLog);
	}

	getUrl(): string {
		return this.url;
	}

	public route(router: ExpressRouter, prefixUrl: string, baseUrl: string) {
		let path = this.apiDef.path;
		if (!path.startsWith('/'))
			path = `/${path}`;
		const fullPath = `${prefixUrl ?? ''}${path}`;
		this.setTag(fullPath);
		router[this.apiDef.method](fullPath, this.callWrapper);
		this.url = `${baseUrl ?? ''}${fullPath}`;
	}

	private callWrapper = async (req: ExpressRequest, res: ExpressResponse) => {
		await this.call(req, res);
		await this.performPostCallActions();
	};

	private performPostCallActions = async () => {
		try {
			await Promise_all_sequentially(this.postCallActions);
		} catch (e: unknown) {
			this.logError('Error while performing post call actions', e instanceof Error ? e : new Error(String(e)));
		} finally {
			this.postCallActions = [];
		}
	};

	call = async (req: ExpressRequest, res: ExpressResponse) => {
		return new MemStorage().init(async () => {
			const startedAt = currentTimeMillis();
			const response = new ApiResponse(this, res);

			this.logInfo(`Intercepted Url: ${req.path}`);
			if (this.headersToLog.length > 0) {
				const headers: Record<string, string | undefined> = {};
				for (const headerName of this.headersToLog)
					headers[headerName] = req.header(headerName);
				this.logDebug('-- Headers: ', headers);
			}

			const reqQuery = parse(req.url, true).query as API['P'];
			if (reqQuery && typeof reqQuery === 'object' && Object.keys(reqQuery as QueryParams).length)
				this.logVerbose('-- Url Params: ', reqQuery);
			else
				this.logVerbose('-- No Params');

			const body: API['B'] | string | undefined = req.body;
			if (body && typeof body === 'object')
				this.logVerbose('-- Body (Object): ', this.printRequest ? (body as object) : '- Not Printing -');
			else if (body && (body as string).length)
				this.logVerbose('-- Body (String): ', this.printRequest ? (body as string) : '- Not Printing -');
			else
				this.logVerbose('-- No Body');

			try {

				MemKey_ServerApi.set(this);
				MemKey_HttpRequest.set(req);
				MemKey_HttpResponse.set(response);
				MemKey_HttpRequestHeaders.set(req.headers);
				MemKey_HttpRequestQuery.set(reqQuery);
				MemKey_HttpRequestUrl.set(req.url);
				MemKey_HttpRequestMethod.set(this.apiDef.method);
				MemKey_HttpRequestPath.set(req.path);
				// MemKeys must never be set to undefined/null; use '' for absent body so handlers always get a defined value.
				MemKey_HttpRequestBody.set(body ?? '');

				if (this.middlewares)
					await Promise_all_sequentially(this.middlewares);

				const toReturn: unknown = await this.process();
				if (response.isConsumed())
					return;

				if (!toReturn)
					return response.end(200);

				const responseType = typeof toReturn;
				if (responseType === 'object')
					return response.json(200, toReturn as object);

				if (responseType === 'string' && (toReturn as string).toLowerCase().startsWith('<html'))
					return response.html(200, toReturn as string);

				return response.text(200, toReturn as string);

			} catch (err: unknown) {
				let e: unknown = err;
				if (typeof e === 'string')
					e = new BadImplementationException(`String was thrown: ${e}`);

				if (e !== null && typeof e === 'object' && !(e instanceof Error))
					e = new BadImplementationException(`Object instance was thrown: ${JSON.stringify(e)}`);

				try {
					this.logErrorBold(e as Error);
				} catch {
					this.logErrorBold('Error while handling error on request...', err instanceof Error ? err : new Error(String(err)));
				}

				if (isErrorOfType(e, ValidationException))
					e = HttpCodes._4XX.BAD_REQUEST('Validator exception', 'Validator exception', e as Error);

				if (!isErrorOfType(e, ApiException))
					e = HttpCodes._5XX.INTERNAL_SERVER_ERROR('Unexpected server error', 'Unexpected server error', e as Error);

				const apiException = isErrorOfType(e, ApiException);
				if (!apiException)
					throw new MUSTNeverHappenException('MUST NEVER REACH HERE!!!');

				this.logErrorBold((e as ApiException).responseBody);
				if (apiException.responseCode === 500)
					return response.serverError(apiException as Error & { cause?: Error });

				return response.exception(apiException);
			} finally {
				this.logInfo(`Url Complete in: ${req.path} - ${currentTimeMillis() - startedAt}ms`);
			}
		});
	};

	protected abstract process(): Promise<API['R']>;
}

export abstract class ServerApi_Get<API extends QueryApi<any, any, any, HttpMethod_Query>>
	extends ServerApi<API> {

	protected constructor(apiDef: ApiDef<API>) {
		super(apiDef);
	}
}

export abstract class ServerApi_Post<API extends BodyApi<any, any, any, HttpMethod_Body>>
	extends ServerApi<API> {

	protected constructor(apiDef: ApiDef<API>) {
		super(apiDef);
	}
}

export class ServerApi_Redirect<API extends TypedApi<any, any, any, any>>
	extends ServerApi<API> {

	private readonly responseCode: number;
	private readonly redirectUrl: string;
	private readonly baseUrl: string;

	constructor(apiDef: ApiDef<API>, responseCode: number, redirectUrl: string, baseUrl: string) {
		super(apiDef);
		this.responseCode = responseCode;
		this.redirectUrl = redirectUrl;
		this.baseUrl = baseUrl;
	}

	protected async process(): Promise<void> {
		const url = composeUrl(`${this.baseUrl}${this.redirectUrl}`, MemKey_HttpRequestQuery.get());
		MemKey_HttpResponse.get().redirect(this.responseCode, url);
	}
}

export class _ServerQueryApi<API extends QueryApi<any, any, any, HttpMethod_Query>>
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

export class _ServerBodyApi<API extends BodyApi<any, any, any, HttpMethod_Body>>
	extends ServerApi_Post<API> {

	private readonly action: (body: API['B']) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (body: API['B']) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(): Promise<API['R']> {
		return this.action(MemKey_HttpRequestBody.get());
	}
}

function mergeHeaders(headers?: TypedMap<string>, _headers?: TypedMap<string>): TypedMap<string> | undefined {
	if (!headers && !_headers)
		return undefined;
	return {...(headers ?? {}), ...(_headers ?? {})};
}

export class ApiResponse {

	private api: ServerApi<any>;
	private readonly res: ExpressResponse;
	private consumed: boolean = false;
	private headers?: TypedMap<string>;

	constructor(api: ServerApi<any>, res: ExpressResponse) {
		this.api = api;
		this.res = res;
	}

	setHeader(key: string, value: string): void {
		(this.headers ??= {})[key] = value;
	}

	addHeader(key: string, value: string): void {
		(this.headers ??= {})[key] = `${this.headers![key] ? `${this.headers[key]};` : ''}${value}`;
	}

	isConsumed(): boolean {
		return this.consumed;
	}

	private consume(): void {
		if (this.consumed) {
			this.api.logError('This API was already satisfied!!', new Error());
			return;
		}
		this.consumed = true;
	}

	stream(responseCode: number, stream: Stream, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers);
		this.consume();
		if (headers)
			this.res.set(headers);
		this.res.writeHead(responseCode);
		stream.pipe(this.res, {end: false});
		stream.on('end', () => this.res.end());
	}

	code(responseCode: number, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers);
		if (headers)
			this.res.set(headers);
		this.consume();
		this.res.writeHead(responseCode);
		this.res.end('');
	}

	text(responseCode: number, response?: string, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		headers['content-type'] = 'text/plain';
		this.end(responseCode, response, headers);
	}

	html(responseCode: number, response?: string, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		headers['content-type'] = 'text/html';
		this.end(responseCode, response, headers);
	}

	json(responseCode: number, response?: object | string, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		headers['content-type'] = MimeType_json;
		this.end(responseCode, response, headers);
	}

	end(responseCode: number, response?: object | string, _headers?: TypedMap<string>): void {
		this.consume();
		const headers = mergeHeaders(this.headers, _headers);
		if (headers)
			this.res.set(headers);
		this.res.writeHead(responseCode);
		this.res.end(typeof response !== 'string' ? JSON.stringify(response, null, 2) : response);
	}

	redirect(responseCode: number, url: string, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		this.consume();
		_keys(headers).reduce((r, k) => {
			r.setHeader(String(k), headers[k] ?? '');
			return r;
		}, this.res);
		this.res.redirect(responseCode, url);
	}

	exception(exception: ApiException, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		const responseBody = {...exception.responseBody};
		if (!ServerApi.isDebug)
			delete responseBody.debugMessage;
		this.json(exception.responseCode, responseBody, headers);
	}

	serverError(error: Error & { cause?: Error }, _headers?: TypedMap<string>): void {
		const headers = mergeHeaders(this.headers, _headers) ?? {};
		const stack = error.cause?.stack ?? error.stack;
		const message = (error.cause?.message ?? error.message) ?? '';
		this.text(500, ServerApi.isDebug && stack ? stack : message, headers);
	}
}
