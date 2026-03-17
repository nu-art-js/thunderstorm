/*
 * Thunderstorm is a full web app framework!
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {Express, NextFunction, Request, Response} from 'express';
import type {ApiDef} from '@nu-art/api-types';
import {asArray, Logger, LogLevel, MUSTNeverHappenException, RuntimeModules} from '@nu-art/ts-common';
import {ServerApi, type ServerApi_Middleware, type ExpressRouter} from '@nu-art/http-server';

export type HttpRoute = {
	methods: string[];
	path: string;
};

export type MiddlewareConfig = {
	filter: (apiDef: ApiDef<any>) => boolean;
	middlewares: ServerApi_Middleware[];
};

interface UseRoutesModule {
	getName(): string;

	useRoutes(): ServerApi<any>[];
}

export class RouteResolver_ModulePath
	extends Logger {

	readonly express: Express;
	private middlewares: MiddlewareConfig[] = [];
	private initialPath: string;
	private getBaseUrl: () => string;

	constructor(express: Express, initialPath: string, getBaseUrl?: () => string) {
		super();
		this.express = express;
		this.initialPath = process.env.GCLOUD_PROJECT ? '' : initialPath;
		this.getBaseUrl = getBaseUrl ?? (() => '');
		this.setMinLevel(LogLevel.Debug);
	}

	public resolveApi() {
		const modules = RuntimeModules().filter((m): m is UseRoutesModule => !!(m as UseRoutesModule).useRoutes) as UseRoutesModule[];
		const routes: ServerApi<any>[] = [];
		for (const mod of modules) {
			this.logInfo(mod.getName());
			routes.push(...mod.useRoutes());
		}

		const baseUrl = this.getBaseUrl();
		for (const api of routes) {
			if (!api.addMiddlewares)
				throw new MUSTNeverHappenException('Missing api.addMiddlewares');
			for (const config of this.middlewares)
				if (config.filter(api.apiDef))
					api.addMiddlewares(...config.middlewares);
			api.route(this.express as unknown as ExpressRouter, this.initialPath, baseUrl);
		}

		this.express.all('*', (req: Request, res: Response, _next: NextFunction) => {
			this.logErrorBold(`Received unknown url with path: '${req.path}' - url: '${req.url}'`);
			res.status(404).send(`The requested URL '${req.url}' was not found on this server.`);
		});
	}

	public printRoutes(): void {
		const routes = this.resolveRoutes();
		for (const route of routes)
			this.logInfo(`${JSON.stringify(route.methods).padEnd(11, ' ')} ${this.initialPath}${route.path}`);
	}

	addMiddleware(filter: (apiDef: ApiDef<any>) => boolean = () => true, ...middlewares: ServerApi_Middleware[]) {
		this.middlewares.push({middlewares, filter});
	}

	public resolveRoutes = (): HttpRoute[] => {
		const resolveStack = (stack: unknown[]): (HttpRoute | HttpRoute[])[] => {
			return stack.map((layer: unknown) => {
				const l = layer as { route?: { path?: string; methods?: Record<string, unknown> }; name?: string; handle?: { stack?: unknown[] } };
				if (l.route && typeof l.route.path === 'string') {
					let methods = Object.keys(l.route.methods ?? {});
					if (methods.length > 20)
						methods = ['ALL'];
					return {methods, path: l.route.path};
				}
				if (l.name === 'router' && Array.isArray(l.handle?.stack))
					return resolveStack(l.handle.stack);
				return null;
			}).filter((r): r is HttpRoute | HttpRoute[] => r != null);
		};

		const expressRouter = this.express as { _router?: { stack?: unknown[] } };
		const stack = expressRouter._router?.stack ?? [];
		const routes = resolveStack(stack);
		return routes.reduce<HttpRoute[]>((toRet, route) => {
			toRet.push(...asArray(route));
			return toRet;
		}, []);
	};
}
