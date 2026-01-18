/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {HttpRequest} from '../core/HttpRequest.js';
import type {ResponseError} from './error-types.js';
import type {QueryParams} from './types.js';


/**
 * HTTP method enumeration.
 * 
 * Standard HTTP methods supported by the client.
 */
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

/** HTTP methods that use query parameters (no request body) */
export type HttpMethod_Query = 'get' | 'delete'
/** HTTP methods that use request body */
export type HttpMethod_Body = 'post' | 'put' | 'patch'
/** HTTP methods with no parameters or body */
export type HttpMethod_Empty = 'options' | 'head'


/**
 * Type-safe API definition with full type information for requests and responses.
 * 
 * Provides compile-time type safety for HTTP API calls, ensuring request bodies,
 * query parameters, and responses match their declared types.
 * 
 * @template M - HTTP method (string literal)
 * @template R - Response type
 * @template B - Body type (internal representation)
 * @template P - Query parameters type
 * @template IB - Input body type (what callers provide, defaults to B)
 * @template IP - Input params type (what callers provide, defaults to P)
 * @template E - Error response type
 * 
 * @example
 * ```typescript
 * type MyApi = TypedApi<'post', {id: string}, {name: string}, {filter: string}, {name: string}, {filter: string}>;
 * // Method: POST
 * // Response: {id: string}
 * // Body: {name: string}
 * // Params: {filter: string}
 * ```
 */
export type TypedApi<M extends string, R, B, P extends QueryParams | undefined, IB = B, IP = P, E extends ResponseError = ResponseError> = {
	Method: M,
	Response: R,
	Body: B;
	Params: P,
	InternalParams: IP,
	InternalBody: IB
	Error: E

	M: M,
	R: R,
	B: B,
	P: P,
	IP: IP,
	IB: IB
	E: E
}

/**
 * Convenience type for APIs that use request bodies (POST, PUT, PATCH).
 * 
 * @template R - Response type
 * @template B - Body type
 * @template IB - Input body type (defaults to B)
 * @template E - Error type
 * @template M - HTTP method (defaults to POST)
 * @template P - Query params type (defaults to never)
 */
export type BodyApi<R, B, IB = B,
	E extends ResponseError = ResponseError,
	M extends HttpMethod_Body = HttpMethod.POST,
	P extends QueryParams = never> = TypedApi<M, R, B, P, IB, P, E>

/**
 * Convenience type for APIs that use query parameters (GET, DELETE).
 * 
 * @template R - Response type
 * @template P - Query params type
 * @template E - Error type
 * @template IP - Input params type (defaults to P)
 * @template M - HTTP method (defaults to GET)
 * @template B - Body type (defaults to never)
 */
export type QueryApi<R, P extends QueryParams | undefined = QueryParams,
	E extends ResponseError = ResponseError,
	IP = P, M extends HttpMethod_Query = HttpMethod.GET, B = never> = TypedApi<M, R, B, P, B, IP, E>

/**
 * Convenience type for APIs with no parameters or body (OPTIONS, HEAD).
 * 
 * @template R - Response type
 * @template M - HTTP method (must be OPTIONS or HEAD)
 * @template E - Error type
 * @template P - Query params type (defaults to never)
 * @template B - Body type (defaults to never)
 */
export type EmptyApi<R, M extends HttpMethod_Empty,
	E extends ResponseError = ResponseError,
	P extends QueryParams = never, B = never> = TypedApi<M, R, B, P, B, P, E>

/**
 * API definition for creating requests.
 * 
 * Specifies the HTTP method, URL configuration, and optional timeout.
 * Either `fullUrl` (absolute) or `baseUrl` + `path` (relative) must be provided.
 * 
 * @template API - Typed API definition
 */
export type ApiDef<API extends TypedApi<any, any, any, any, any>> = {
	method: API['Method'],
	fullUrl?: string
	baseUrl?: string
	path: string
	timeout?: number
	errors?: API['Error']['type']
}

/**
 * Recursive API structure type for organizing APIs into namespaces.
 * 
 * Allows nesting APIs in a hierarchical structure, where each level can contain
 * either a TypedApi or another ApiStruct (sub-namespace).
 */
export type ApiStruct = { [k: string]: (TypedApi<any, any, any, any, any> | ApiStruct) }

export type ApiDefResolver<API_Struct extends ApiStruct> = API_Struct extends TypedApi<any, any, any, any, any>
	? ApiDef<API_Struct>
	: API_Struct extends ApiStruct ? ApiDefRouter<API_Struct> : never;
export type ApiDefRouter<API_Struct extends ApiStruct> = { [P in keyof API_Struct]: ApiDefResolver<API_Struct[P]> };

export type ApiDefCaller<API_Struct extends ApiStruct> = API_Struct extends TypedApi<any, any, any, any, any>
	? ApiCaller<API_Struct>
	: API_Struct extends ApiStruct ? ApiCallerRouter<API_Struct> : never;
export type ApiCallerRouter<API_Struct extends ApiStruct> = { [P in keyof API_Struct]: ApiDefCaller<API_Struct[P]> };


export type ApiCaller_Query<API extends QueryApi<any, any, any, any, HttpMethod_Query>> = API['IP'] extends undefined
	? () => HttpRequest<API>
	: (query: API['IP']) => HttpRequest<API>;
export type ApiCaller_Body<API extends BodyApi<any, any, any, any, HttpMethod_Body>> = API['IB'] extends undefined
	? () => HttpRequest<API>
	: (query: API['IB']) => HttpRequest<API>;
export type ApiCaller_Any<API extends TypedApi<any, any, any, any, any>> = (body: API['IB'], query: API['IP']) => HttpRequest<API>;

/**
 * Resolves the appropriate caller function type based on API method.
 * 
 * Automatically selects the correct function signature:
 * - QueryApi → function(query?) → HttpRequest
 * - BodyApi → function(body?) → HttpRequest
 * - Other → function(body, query) → HttpRequest
 * 
 * @template API - Typed API definition
 */
export type ApiCaller<API> =
	API extends QueryApi<any, any, any, any, HttpMethod_Query> ? ApiCaller_Query<API> :
		API extends BodyApi<any, any, any, any, HttpMethod_Body> ? ApiCaller_Body<API> :
			API extends TypedApi<any, any, any, any, any> ? ApiCaller_Any<API> : never;
