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

/** True when ApiDef uses query params (GET/DELETE); false when it uses body (POST/PUT/PATCH). Shared by http-client and http-server. */
export function isQueryMethod(method: string): boolean {
	return method === HttpMethod.GET || method === HttpMethod.DELETE;
}

export type TypedApi<M extends string, R, B, P extends QueryParams | undefined, E extends ResponseError = ResponseError> = {
	Method: M;
	Response: R;
	Body: B;
	Params: P;
	Error: E;
	M: M;
	R: R;
	B: B;
	P: P;
	E: E;
};

export type BodyApi<R, B,
	E extends ResponseError = ResponseError,
	M extends HttpMethod_Body = HttpMethod.POST,
	P extends QueryParams = never> = TypedApi<M, R, B, P, E>;

export type QueryApi<R, P extends QueryParams | undefined = QueryParams,
	E extends ResponseError = ResponseError,
	M extends HttpMethod_Query = HttpMethod.GET, B = never> = TypedApi<M, R, B, P, E>;

export type EmptyApi<R, M extends HttpMethod_Empty,
	E extends ResponseError = ResponseError,
	P extends QueryParams = never, B = never> = TypedApi<M, R, B, P, E>;

export type ApiDef<API extends GeneralApi> = {
	method: API['Method'];
	path: string;
	timeout?: number;
	errors?: API['Error']['type'];
};

/** Nested structure of API types (e.g. { v1: { query: BodyApi<...>, ... } }). */
export type ApiStruct = { [k: string]: GeneralApi | ApiStruct };

/** Maps an API struct to ApiDef at each leaf (recursive). */
export type ApiDefResolver<API_Struct extends ApiStruct> = API_Struct extends GeneralApi
	? ApiDef<API_Struct>
	: { [P in keyof API_Struct]: ApiDefResolver<API_Struct[P]> };
