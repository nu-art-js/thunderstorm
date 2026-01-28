/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {HttpClient_Class} from '../core/HttpClient.js';
import type {ApiDef, TypedApi} from './api-types.js';


/**
 * Raw HTTP response structure.
 * Compatible with Axios response structure.
 */
export type RawHttpResponse<R> = {
	data: R;
	status: number;
	statusText: string;
	headers: Record<string, string | string[] | undefined>;
	config: unknown;
};

/**
 * Full context object passed to callbacks after API execution.
 */
export type ApiCallContext<API extends TypedApi<any, any, any, any>> = {
	response: API['R'];
	statusCode: number;
	headers: Record<string, string | string[] | undefined>;
	body?: API['B'];
	params?: API['P'];
	apiDef: ApiDef<API>;
	duration: number;
	rawResponse: RawHttpResponse<API['R']>;
};

/**
 * User-provided callback after API response.
 */
export type ApiCallback<API extends TypedApi<any, any, any, any>> =
	(ctx: ApiCallContext<API>) => void | Promise<void>;

/**
 * Module callback factory - receives module instance and context.
 */
export type ModuleCallback<Module, API extends TypedApi<any, any, any, any>> =
	(module: Module, ctx: ApiCallContext<API>) => void | Promise<void>;

/**
 * Configuration options for ApiCaller decorator.
 */
export type ApiCallerOptions<Module, API extends TypedApi<any, any, any, any>> = {
	onComplete?: ModuleCallback<Module, API>;
	httpClient?: HttpClient_Class;
};

/** @deprecated Use ApiCallerOptions. */
export type ClientApiOptions<Module, API extends TypedApi<any, any, any, any>> = ApiCallerOptions<Module, API>;
