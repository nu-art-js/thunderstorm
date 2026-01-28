/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, TypedApi} from '@nu-art/http-client';


/**
 * Raw HTTP response structure.
 *
 * Provides access to the full response including headers, status, and data.
 * Compatible with Axios response structure.
 *
 * @template R - Response data type
 */
export type RawHttpResponse<R> = {
	data: R;
	status: number;
	statusText: string;
	headers: Record<string, string | string[] | undefined>;
	config: unknown;
}

/**
 * Full context object passed to callbacks after API execution.
 *
 * Contains all response metadata, request details, and timing information
 * for comprehensive callback handling.
 *
 * @template API - Typed API definition
 */
export type ApiCallContext<API extends TypedApi<any, any, any, any>> = {
	// Response
	/** The parsed response body */
	response: API['R'];
	/** HTTP status code (e.g., 200, 201, 404) */
	statusCode: number;
	/** Response headers */
	headers: Record<string, string | string[] | undefined>;

	// Request
	/** Request body (for POST/PUT/PATCH) */
	body?: API['B'];
	/** Query parameters (for GET/DELETE) */
	params?: API['P'];

	// Metadata
	/** API definition used for the request */
	apiDef: ApiDef<API>;
	/** Request duration in milliseconds */
	duration: number;

	// Raw access
	/** Full HTTP response for advanced use cases */
	rawResponse: RawHttpResponse<API['R']>;
}

/**
 * User-provided callback type for handling API responses.
 *
 * Called after the module callback (if any) completes.
 *
 * @template API - Typed API definition
 */
export type ApiCallback<API extends TypedApi<any, any, any, any>> =
	(ctx: ApiCallContext<API>) => void | Promise<void>;

/**
 * Module callback factory - receives module instance and context.
 *
 * Provides type-safe access to the module instance, allowing callbacks
 * to call module methods for state updates (cache, IDB, dispatch).
 *
 * @template Module - The module class type
 * @template API - Typed API definition
 */
export type ModuleCallback<Module, API extends TypedApi<any, any, any, any>> =
	(module: Module, ctx: ApiCallContext<API>) => void | Promise<void>;

/**
 * Configuration options for ClientApi decorator.
 *
 * @template Module - The module class type
 * @template API - Typed API definition
 */
export type ClientApiOptions<Module, API extends TypedApi<any, any, any, any>> = {
	/** Module callback executed after successful API response */
	onComplete?: ModuleCallback<Module, API>;
}

/**
 * Minimal shape for CRUD API definitions passed into ModuleFE_BaseApi constructor.
 * Base does not depend on concrete API types; the app supplies its ApiDef (e.g. MyApiDef.v1).
 */
export type CrudApiDefShape = {
	query: ApiDef<TypedApi<any, any, any, any>>;
	queryUnique: ApiDef<TypedApi<any, any, any, any>>;
	upsert: ApiDef<TypedApi<any, any, any, any>>;
	upsertAll: ApiDef<TypedApi<any, any, any, any>>;
	patch: ApiDef<TypedApi<any, any, any, any>>;
	delete: ApiDef<TypedApi<any, any, any, any>>;
	deleteQuery: ApiDef<TypedApi<any, any, any, any>>;
	deleteAll: ApiDef<TypedApi<any, any, any, any>>;
}
