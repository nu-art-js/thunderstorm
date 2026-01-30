/*
 * @nu-art/http-client - Type-safe HTTP client for Thunderstorm
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */
import { HttpMethod } from '../types/api-types.js';
import { resolveContent } from '@nu-art/ts-common';
import { HttpClient } from './HttpClient.js';
/** True when ApiDef uses query params (GET/DELETE); false when it uses body (POST/PUT/PATCH). */
export function isQueryMethod(method) {
    return method === HttpMethod.GET || method === HttpMethod.DELETE;
}
/**
 * TC39 Stage 3 decorator for API calls. Infers body vs query from apiDef.method:
 * GET/DELETE → params, setUrlParams; POST/PUT/PATCH → body, setBodyAsJson.
 *
 * @param _apiDef - API definition or ResolvableContent (value or getter with instance as first arg)
 * @param options - Optional: onComplete, httpClient (default shared HttpClient)
 */
export function ApiCaller(_apiDef, options) {
    return function (originalMethod, context) {
        return async function (payload, userCallback) {
            await originalMethod.call(this, payload, userCallback);
            const apiDef = resolveContent(_apiDef, this);
            const method = apiDef.method;
            const useQuery = isQueryMethod(method);
            const startTime = Date.now();
            const client = resolveContent(options?.httpClient, this) ?? HttpClient.default;
            const request = client.createRequest(apiDef);
            if (useQuery)
                request.setUrlParams(payload);
            else
                request.setBodyAsJson(payload);
            const response = await request.execute();
            const axiosResponse = request.getRawResponse();
            const rawResponse = {
                data: axiosResponse.data,
                status: axiosResponse.status,
                statusText: axiosResponse.statusText,
                headers: axiosResponse.headers,
                config: axiosResponse.config,
            };
            const ctx = {
                response,
                statusCode: rawResponse.status,
                headers: rawResponse.headers,
                apiDef,
                duration: Date.now() - startTime,
                rawResponse,
                ...(useQuery ? { params: payload } : { body: payload }),
            };
            if (options?.onComplete)
                await options.onComplete(this, ctx);
            if (userCallback)
                await userCallback(ctx);
            return response;
        };
    };
}
/** @deprecated Use ApiCaller. Kept for backward compatibility. */
export const ClientApi = ApiCaller;
//# sourceMappingURL=ApiCaller.js.map