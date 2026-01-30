/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDef, GeneralApi} from '@nu-art/api-types';
import {isQueryMethod} from '@nu-art/api-types';
import {resolveContent} from '@nu-art/ts-common';
import type {ApiHandlerOptions, ServerRouteRegistry} from './api-handler-types.js';
import {createBodyServerApi, createQueryServerApi} from './typed-api.js';
import {HttpServer} from './HttpServer.js';

/**
 * TC39 Stage 3 method decorator for server API handlers. Infers query vs body from apiDef.method:
 * GET/DELETE → params; POST/PUT/PATCH → body. Associates the handler with a server instance
 * (provided in options or default), like the client's ApiCaller associates with httpClient.
 * Context (apiDef, options) is held in the initializer's closure; registration runs when the
 * instance is created—no constructor storage, no registerServerApis.
 *
 * @param _apiDef - API definition or ResolvableContent (getter with instance as first arg)
 * @param options - Optional: server (default HttpServer singleton), middlewares, validators
 */
export function ApiHandler<API extends GeneralApi, Module = unknown>(_apiDef: import('@nu-art/ts-common').ResolvableContent<ApiDef<API>, [Module]>, options?: ApiHandlerOptions<Module, API>) {
	return function <This extends Module>(originalMethod: (this: This, payload: API['B'] | API['P']) => Promise<API['R']>, context: ClassMethodDecoratorContext<This>) {
		const methodKey = String(context.name);
		const apiDefResolver = _apiDef as (instance: Module) => ApiDef<any>;
		const opts = (options ?? {}) as ApiHandlerOptions<Module, API>;
		let registered = false;
		context.addInitializer(function (this: This) {
			if (registered)
				return;
			registered = true;
			const instance = this as unknown as Record<string, (payload: unknown) => Promise<unknown>>;
			const server = (resolveContent(opts.server, this) ?? HttpServer) as ServerRouteRegistry;
			const apiDef = resolveContent(apiDefResolver as (m: Module) => ApiDef<any>, this as unknown as Module) as ApiDef<any>;
			const boundMethod = instance[methodKey];
			if (typeof boundMethod !== 'function')
				throw new Error(`ApiHandler: method "${methodKey}" is not a function`);
			const action = (payload: unknown) => boundMethod.call(instance, payload);
			const useQuery = isQueryMethod((apiDef as { method: string }).method);
			const api = useQuery
				? createQueryServerApi(apiDef, action as (params: unknown) => Promise<unknown>, ...(opts.middlewares ?? []))
				: createBodyServerApi(apiDef, action as (body: unknown) => Promise<unknown>, ...(opts.middlewares ?? []));
			if (opts.bodyValidator)
				api.setBodyValidator(opts.bodyValidator);
			if (opts.queryValidator)
				api.setQueryValidator(opts.queryValidator);
			server.addRoute(api);
		});
		return originalMethod;
	};
}

export {isQueryMethod};
