/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ResponseError} from './error-types.js';
import type {QueryParams} from './types.js';

export type ApiType = TypedApi<any, any, any, any>;

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
 * Path is relative to the HttpClient origin (client determines the base URL).
 * Property name alternatives: path (current), route, endpoint, relativePath.
 *
 * @template API - Typed API definition
 */
export type ApiDef<API extends TypedApi<any, any, any, any, any>> = {
	method: API['Method'];
	path: string;
	timeout?: number;
	errors?: API['Error']['type'];
}
