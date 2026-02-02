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

/** Pending route registration: resolved after constructor so getter sees full instance. */
type PendingRoute<Module = unknown> = {
	server: HttpServer;
	apiDefGetter: ResolvableContent<ApiDef<any>, [Module]>;
	instance: Module;
	originalMethod: (payload: unknown) => Promise<unknown>;
	options: ApiHandlerOptions<Module> | undefined;
};

class PendingRouteRegistry_Class {
	private readonly pendingRoutes: PendingRoute[] = [];
	private flushScheduled = false;

	private flush(): void {
		this.flushScheduled = false;
		const batch = this.pendingRoutes.splice(0, this.pendingRoutes.length);
		for (const {server, apiDefGetter, instance, originalMethod, options} of batch) {
			const apiDef = resolveContent(apiDefGetter, instance) as ApiDef<any>;
			const useQuery = isQueryMethod(apiDef.method);
			const api = useQuery
				? new _ServerQueryApi(apiDef, originalMethod as (params: unknown) => Promise<unknown>)
				: new _ServerBodyApi(apiDef, originalMethod as (body: unknown) => Promise<unknown>);
			api.setMiddlewares(...(options?.middlewares ?? []));
			server.addRoute(api);
		}
	}

	schedule<Module>(item: PendingRoute<Module>): void {
		this.pendingRoutes.push(item as PendingRoute);
		if (!this.flushScheduled) {
			this.flushScheduled = true;
			setTimeout(() => this.flush(), 0);
		}
	}

	/** Run the pending flush immediately (e.g. in tests so routes are registered before use). */
	flushPendingRoutes(): void {
		this.flush();
	}
}

const PendingRouteRegistry = new PendingRouteRegistry_Class();

/** Configuration options for ApiHandler decorator. Mirror of client ApiCallerOptions. */
export type ApiHandlerOptions<Module> = {
	httpServer?: ResolvableContent<HttpServer, [Module]>;
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
	return function (originalMethod: (this: Module, payload: API['B'] | API['P']) => Promise<API['R']>, context: ClassMethodDecoratorContext<Module>) {
		context.addInitializer(function (this: Module) {
			const server = (resolveContent(options?.httpServer, this) ?? HttpServer.default);
			if (typeof _apiDef === 'function') {
				PendingRouteRegistry.schedule({
					server,
					apiDefGetter: _apiDef,
					instance: this,
					originalMethod: (payload: unknown) => originalMethod.call(this, payload),
					options
				});
				return;
			}
			const apiDef = _apiDef as ApiDef<any>;
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

/** Triggers the deferred route flush immediately. Use after constructing ApiHandler classes so routes are registered before calling handlers (e.g. in tests). */
export function ApiHandler_FlushPendingRoutes(): void {
	PendingRouteRegistry.flushPendingRoutes();
}
