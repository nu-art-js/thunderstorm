/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, HttpClient, HttpMethod, TypedApi} from '@nu-art/http-client';
import {ApiCallback, ApiCallContext, ClientApiOptions, RawHttpResponse} from './types.js';


type ApiType = TypedApi<any, any, any, any>;
/**
 * ApiDef or a getter called at invocation time with `this` to resolve the ApiDef.
 * Enables base classes to declare CRUD methods decorated with a lazy reference
 * (e.g. `(m) => m.crudApiDef.upsert`) when the concrete ApiDef is supplied via constructor.
 */
export type ApiDefOrGetter<API extends ApiType, This> =
	| ApiDef<API>
	| ((this: This) => ApiDef<API>);

/** Resolves ApiDef from value or getter. Exported for unit tests (unit/helpers). */
export function resolveApiDef<API extends ApiType, This>(
	apiDefOrGetter: ApiDefOrGetter<API, This>,
	thisArg: This
): ApiDef<API> {
	return typeof apiDefOrGetter === 'function' ? (apiDefOrGetter as (this: This) => ApiDef<API>).call(thisArg) : apiDefOrGetter;
}

/** True when ApiDef uses query params (GET/DELETE); false when it uses body (POST/PUT/PATCH). Exported for unit tests (unit/helpers). */
export function isQueryMethod(method: string): boolean {
	return method === HttpMethod.GET || method === HttpMethod.DELETE;
}

/**
 * Test hook: when set, the decorator uses this instead of HttpClient.createRequest.
 * Use in unit/decorator tests to stub HTTP. Reset to null after tests.
 */
export let __testHttpClientFactory: ((apiDef: any) => { setUrlParams: (p: any) => any; setBodyAsJson: (b: any) => any; execute: () => Promise<any>; getRawResponse: () => any }) | null = null;

/** Setter for test hook. Call with null to reset. */
export function __setTestHttpClientFactory(f: typeof __testHttpClientFactory): void {
	__testHttpClientFactory = f;
}

/**
 * TC39 Stage 3 decorator for API calls. Infers body vs query from apiDef.method:
 * GET/DELETE → first argument is params, uses setUrlParams; POST/PUT/PATCH → first argument is body, uses setBodyAsJson.
 *
 * Wraps a method to handle HTTP execution, response context building,
 * and callback chaining. The original method body serves as pre-processing
 * logic that runs before the HTTP request.
 *
 * Supports lazy ApiDef: pass a function `(this) => ApiDef` to resolve the
 * ApiDef at call time (e.g. from constructor-injected readonly crudApiDef).
 *
 * @template API - Typed API definition
 * @template Module - The module class type (inferred from usage)
 *
 * @param apiDefOrGetter - API definition, or getter called at invocation time with `this`
 * @param options - Optional configuration including module callback
 *
 * @example
 * ```typescript
 * @ClientApi(UserApiDef.v1.upsert, { onComplete: (m, ctx) => m.handleUpsertComplete(ctx) })
 * async upsert(body: UI_User): Promise<DB_User> {
 *   body = this.cleanUp(body);
 *   this.validateInternal(body);
 * }
 *
 * @ClientApi((m) => m.crudApiDef.queryUnique, { onComplete: (m, ctx) => m.handleQueryUniqueComplete(ctx) })
 * async queryUnique(params: Record<string, unknown>) {}
 * ```
 */
export function ClientApi<API extends ApiType, Module = any>(apiDefOrGetter: ApiDefOrGetter<API, Module>, options?: ClientApiOptions<Module, API>) {
	return function <This extends Module>(originalMethod: (this: This, payload: API['B'] | API['P'], userCallback?: ApiCallback<API>) => unknown, context: ClassMethodDecoratorContext<This>) {
		return async function (this: This, payload: API['B'] | API['P'], userCallback?: ApiCallback<API>): Promise<API['R']> {
			await originalMethod.call(this, payload, userCallback);

			const apiDef = resolveApiDef<API, This>(apiDefOrGetter as ApiDefOrGetter<API, This>, this);
			const method = (apiDef as { method: string }).method;
			const useQuery = isQueryMethod(method);

			const startTime = Date.now();
			const createRequest = __testHttpClientFactory ?? (HttpClient.createRequest.bind(HttpClient) as (apiDef: any) => any);
			const request = createRequest(apiDef);
			if (useQuery)
				request.setUrlParams(payload as API['P']);
			else
				request.setBodyAsJson(payload as API['B']);

			const response = await request.execute();
			const axiosResponse = request.getRawResponse();
			const rawResponse: RawHttpResponse<API['R']> = {
				data: axiosResponse.data,
				status: axiosResponse.status,
				statusText: axiosResponse.statusText,
				headers: axiosResponse.headers as Record<string, string | string[] | undefined>,
				config: axiosResponse.config,
			};

			const ctx: ApiCallContext<API> = {
				response,
				statusCode: rawResponse.status,
				headers: rawResponse.headers,
				apiDef,
				duration: Date.now() - startTime,
				rawResponse,
				...(useQuery ? {params: payload as API['P']} : {body: payload as API['B']}),
			};

			if (options?.onComplete)
				await options.onComplete(this, ctx);

			if (userCallback)
				await userCallback(ctx);

			return response;
		};
	};
}

/** Alias for ClientApi. Kept for backward compatibility; use ClientApi for new code. */
export const ClientApiQuery = ClientApi;
