/*
 * @nu-art/http-server - Express HTTP server and typed ServerApi
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDef, GeneralApi} from '@nu-art/api-types';
import {isQueryMethod} from '@nu-art/api-types';
import type {ResolvableContent} from '@nu-art/ts-common';
import {resolveContent} from '@nu-art/ts-common';
import {_ServerBodyApi, _ServerQueryApi} from './server-api.js';
import {HttpServer} from './HttpServer.js';
import type {ServerApi_Middleware} from '../types.js';

/** Configuration options for ApiHandler decorator. Mirror of client ApiCallerOptions. */
export type ApiHandlerOptions<Module> = {
	server?: ResolvableContent<HttpServer, [Module]>;
	middlewares?: ServerApi_Middleware[];
};

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
export function ApiHandler<API extends GeneralApi, Module = unknown>(_apiDef: ResolvableContent<ApiDef<API>, [Module]>, options?: ApiHandlerOptions<Module>) {
	return function <This extends Module>(originalMethod: (this: This, payload: API['B'] | API['P']) => Promise<API['R']>, context: ClassMethodDecoratorContext<This>) {
		context.addInitializer(function (this: This) {
			const server = (resolveContent(options?.server, this) ?? HttpServer.default);
			const apiDef = resolveContent(_apiDef, this) as ApiDef<any>;
			const useQuery = isQueryMethod(apiDef.method);
			const api = useQuery
				? new _ServerQueryApi(apiDef, (payload: API['Params']) => originalMethod.call(this, payload))
				: new _ServerBodyApi(apiDef, (payload: API['Body']) => originalMethod.call(this, payload));

			api.setMiddlewares(...(options?.middlewares ?? []));
			server.addRoute(api);
		});
		return originalMethod;
	};
}

export {isQueryMethod};
