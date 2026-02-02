/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiDef, GeneralApi, HttpMethod} from '../types/api-types.js';
import type {ApiCallback, ApiCallContext, RawHttpResponse} from './types.js';
import {ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {HttpClient} from '../core/HttpClient.js';

/**
 * Module callback factory - receives module instance and context.
 */
export type ModuleCallback<Module, API extends GeneralApi> =
	(module: Module, ctx: ApiCallContext<API>) => void | Promise<void>;

/**
 * Configuration options for ApiCaller decorator.
 */
export type ApiCallerOptions<Module, API extends GeneralApi> = {
	onComplete?: ModuleCallback<Module, API>;
	httpClient?: ResolvableContent<HttpClient, [Module]>;
};

/** True when ApiDef uses query params (GET/DELETE); false when it uses body (POST/PUT/PATCH). */
export function isQueryMethod(method: string): boolean {
	return method === HttpMethod.GET || method === HttpMethod.DELETE;
}

/**
 * TC39 Stage 3 decorator for API calls. Infers body vs query from apiDef.method:
 * GET/DELETE → params, setUrlParams; POST/PUT/PATCH → body, setBodyAsJson.
 *
 * @param _apiDef - API definition or ResolvableContent (value or getter with instance as first arg)
 * @param options - Optional: onComplete, httpClient (default shared HttpClient)
 */
export function ApiCaller<API extends GeneralApi, Module = any>(_apiDef: ResolvableContent<ApiDef<API>, [Module]>, options?: ApiCallerOptions<Module, API>) {
	return function <This extends Module>(originalMethod: (this: This, payload: API['B'] | API['P'], userCallback?: ApiCallback<API>) => unknown, context: ClassMethodDecoratorContext<This>) {
		return async function (this: This, payload: API['B'] | API['P'], userCallback?: ApiCallback<API>): Promise<API['R']> {
			await originalMethod.call(this, payload, userCallback);

			const apiDef = resolveContent(_apiDef, this);
			const method = (apiDef as { method: string }).method;
			const useQuery = isQueryMethod(method);

			const startTime = Date.now();
			const client = resolveContent(options?.httpClient, this) ?? HttpClient.default;
			const request = client.createRequest(apiDef);
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