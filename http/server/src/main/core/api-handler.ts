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
	httpServer?: ResolvableContent<HttpServer, [Module]>;
	middlewares?: ServerApi_Middleware[];
};

/** Single shape for registering a route: apiDef (or getter+instance), handler, server, options. */
type RouteRegistrationParams<Module = unknown> = {
	server: ResolvableContent<HttpServer, [Module]>;
	apiDef: ApiDef<any> | ResolvableContent<ApiDef<any>, [Module]>;
	enclosingClass: Module;
	handler: (payload: unknown) => Promise<unknown>;
	options?: ApiHandlerOptions<Module>;
};

function registerRoute<Module>(params: RouteRegistrationParams<Module>): void {
	const {server} = params;
	const apiDef = resolveContent(params.apiDef, params.enclosingClass);
	const useQuery = isQueryMethod(apiDef.method);
	const api = useQuery
		? new _ServerQueryApi(apiDef, params.handler as (params: unknown) => Promise<unknown>)
		: new _ServerBodyApi(apiDef, params.handler as (body: unknown) => Promise<unknown>);
	api.setMiddlewares(...(params.options?.middlewares ?? []));
	resolveContent(server, params.enclosingClass).addRoute(api);
}

class PendingRouteRegistry_Class {
	private readonly pendingRoutes: RouteRegistrationParams[] = [];
	private flushScheduled = false;

	private flush(): void {
		this.flushScheduled = false;
		const batch = this.pendingRoutes.splice(0, this.pendingRoutes.length);
		for (const item of batch)
			registerRoute(item);
	}

	schedule<Module>(item: RouteRegistrationParams<Module>): void {
		this.pendingRoutes.push(item as RouteRegistrationParams);
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
			const server = (options?.httpServer ?? (() => HttpServer.getDefault()));
			const params: RouteRegistrationParams<Module> = {
				server,
				apiDef: _apiDef,
				enclosingClass: this,
				handler: (payload: unknown) => originalMethod.call(this, payload),
				options
			};

			if (typeof _apiDef === 'function') {
				PendingRouteRegistry.schedule(params);
				return;
			}

			registerRoute(params);
		});
		return originalMethod;
	};
}


/** Triggers the deferred route flush immediately. Use after constructing ApiHandler classes so routes are registered before calling handlers (e.g. in tests). */
export function ApiHandler_FlushPendingRoutes(): void {
	PendingRouteRegistry.flushPendingRoutes();
}
