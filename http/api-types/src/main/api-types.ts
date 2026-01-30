/*
 * @nu-art/api-types - Shared API and error types for HTTP client and server
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ResponseError} from './error-types.js';
import type {QueryParams} from './types.js';

export type GeneralApi = TypedApi<any, any, any, any>;

export enum HttpMethod {
	ALL     = 'all',
	POST    = 'post',
	GET     = 'get',
	PATCH   = 'patch',
	DELETE  = 'delete',
	PUT     = 'put',
	OPTIONS = 'options',
	HEAD    = 'head',
}

export type HttpMethod_Query = 'get' | 'delete';
export type HttpMethod_Body = 'post' | 'put' | 'patch';
export type HttpMethod_Empty = 'options' | 'head';

export type TypedApi<M extends string, R, B, P extends QueryParams | undefined, IB = B, IP = P, E extends ResponseError = ResponseError> = {
	Method: M;
	Response: R;
	Body: B;
	Params: P;
	InternalParams: IP;
	InternalBody: IB;
	Error: E;
	M: M;
	R: R;
	B: B;
	P: P;
	IP: IP;
	IB: IB;
	E: E;
};

export type BodyApi<R, B, IB = B,
	E extends ResponseError = ResponseError,
	M extends HttpMethod_Body = HttpMethod.POST,
	P extends QueryParams = never> = TypedApi<M, R, B, P, IB, P, E>;

export type QueryApi<R, P extends QueryParams | undefined = QueryParams,
	E extends ResponseError = ResponseError,
	IP = P, M extends HttpMethod_Query = HttpMethod.GET, B = never> = TypedApi<M, R, B, P, B, IP, E>;

export type EmptyApi<R, M extends HttpMethod_Empty,
	E extends ResponseError = ResponseError,
	P extends QueryParams = never, B = never> = TypedApi<M, R, B, P, B, P, E>;

export type ApiDef<API extends GeneralApi> = {
	method: API['Method'];
	path: string;
	timeout?: number;
	errors?: API['Error']['type'];
};
