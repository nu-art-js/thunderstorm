/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, HttpClient, TypedApi} from '@nu-art/http-client';
import {ApiCallback, ApiCallContext, ClientApiOptions, RawHttpResponse} from './types.js';


/**
 * TC39 Stage 3 decorator for body-based API calls (POST, PUT, PATCH).
 *
 * Wraps a method to handle HTTP execution, response context building,
 * and callback chaining. The original method body serves as pre-processing
 * logic that runs before the HTTP request.
 *
 * @template API - Typed API definition
 * @template Module - The module class type (inferred from usage)
 *
 * @param apiDef - API definition with method, path, and configuration
 * @param options - Optional configuration including module callback
 *
 * @example
 * ```typescript
 * @ClientApi(UserApiDef.v1.upsert, {
 *   onComplete: (module, ctx) => module.onEntryUpdated(ctx)
 * })
 * async upsert(body: UI_User): Promise<DB_User> {
 *   // Pre-processing runs before HTTP call
 *   body = this.cleanUp(body);
 *   this.validateInternal(body);
 * }
 * ```
 */
export function ClientApi<API extends TypedApi<any, any, any, any>, Module = any>(apiDef: ApiDef<API>, options?: ClientApiOptions<Module, API>) {
	return function <This extends Module>(
		originalMethod: (this: This, body: API['B'], userCallback?: ApiCallback<API>) => void | Promise<void>,
		context: ClassMethodDecoratorContext<This>
	) {
		return async function (this: This, body: API['B'], userCallback?: ApiCallback<API>): Promise<API['R']> {
			// 1. Run pre-processing (original method body)
			await originalMethod.call(this, body, userCallback);

			const startTime = Date.now();

			// 2. Execute HTTP request
			const request = HttpClient
				.createRequest<API>(apiDef)
				.setBodyAsJson(body);

			const response = await request.execute();
			const axiosResponse = request.getRawResponse();
			const rawResponse: RawHttpResponse<API['R']> = {
				data: axiosResponse.data,
				status: axiosResponse.status,
				statusText: axiosResponse.statusText,
				headers: axiosResponse.headers as Record<string, string | string[] | undefined>,
				config: axiosResponse.config,
			};

			// 3. Build full context
			const ctx: ApiCallContext<API> = {
				response,
				statusCode: rawResponse.status,
				headers: rawResponse.headers,
				body,
				apiDef,
				duration: Date.now() - startTime,
				rawResponse,
			};

			// 4. Module callback (type-safe, from decorator config)
			if (options?.onComplete)
				await options.onComplete(this, ctx);

			// 5. User callback
			if (userCallback)
				await userCallback(ctx);

			return response;
		};
	};
}

/**
 * TC39 Stage 3 decorator for query-based API calls (GET, DELETE).
 *
 * Wraps a method to handle HTTP execution with query parameters,
 * response context building, and callback chaining. The original method
 * body serves as pre-processing logic that runs before the HTTP request.
 *
 * @template API - Typed API definition
 * @template Module - The module class type (inferred from usage)
 *
 * @param apiDef - API definition with method, path, and configuration
 * @param options - Optional configuration including module callback
 *
 * @example
 * ```typescript
 * @ClientApiQuery(UserApiDef.v1.queryUnique, {
 *   onComplete: (module, ctx) => module.onGotUnique(ctx)
 * })
 * async queryUnique(params: DB_BaseObject): Promise<DB_User> {
 *   // Pre-processing runs before HTTP call
 * }
 * ```
 */
export function ClientApiQuery<API extends TypedApi<any, any, any, any>, Module = any>(
	apiDef: ApiDef<API>,
	options?: ClientApiOptions<Module, API>
) {
	return function <This extends Module>(
		originalMethod: (this: This, params: API['P'], userCallback?: ApiCallback<API>) => void | Promise<void>,
		context: ClassMethodDecoratorContext<This>
	) {
		return async function (this: This, params: API['P'], userCallback?: ApiCallback<API>): Promise<API['R']> {
			// 1. Run pre-processing (original method body)
			await originalMethod.call(this, params, userCallback);

			const startTime = Date.now();

			// 2. Execute HTTP request with query params
			const request = HttpClient
				.createRequest<API>(apiDef)
				.setUrlParams(params);

			const response = await request.execute();
			const axiosResponse = request.getRawResponse();
			const rawResponse: RawHttpResponse<API['R']> = {
				data: axiosResponse.data,
				status: axiosResponse.status,
				statusText: axiosResponse.statusText,
				headers: axiosResponse.headers as Record<string, string | string[] | undefined>,
				config: axiosResponse.config,
			};

			// 3. Build full context
			const ctx: ApiCallContext<API> = {
				response,
				statusCode: rawResponse.status,
				headers: rawResponse.headers,
				params,
				apiDef,
				duration: Date.now() - startTime,
				rawResponse,
			};

			// 4. Module callback (type-safe, from decorator config)
			if (options?.onComplete)
				await options.onComplete(this, ctx);

			// 5. User callback
			if (userCallback)
				await userCallback(ctx);

			return response;
		};
	};
}
