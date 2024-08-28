/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {Express, NextFunction} from 'express';
import {ExpressRequest, ExpressResponse, ServerApi_Middleware} from '../../../utils/types';
import {ServerApi} from '../server-api';
import {asArray, Logger, LogLevel, Module, MUSTNeverHappenException, RuntimeModules} from '@thunder-storm/common';
import {ModuleBE_APIs_Class} from '../../ModuleBE_APIs';
import {ApiDef} from '../../../../shared';


export type HttpRoute = {
	methods: string[]
	path: string
}
export type MiddlewareConfig = {
	filter: (apiDef: ApiDef<any>) => boolean
	middlewares: ServerApi_Middleware[]
}

export class RouteResolver_ModulePath
	extends Logger {
	readonly express: Express;
	private middlewares: MiddlewareConfig[] = [];
	private initialPath: string;

	constructor(express: Express, initialPath: string) {
		super();
		this.express = express;
		this.initialPath = !process.env.GCLOUD_PROJECT ? initialPath : '';
		this.setMinLevel(LogLevel.Debug);
	}

	public resolveApi() {
		const modules: (Module | ModuleBE_APIs_Class)[] = RuntimeModules().filter((module: ModuleBE_APIs_Class) => !!module.useRoutes);

		//Filter Api modules
		const routes: ServerApi<any>[] = [];
		for (const module of modules) {
			this.logInfo(module.getName());
			const _routes = (module as unknown as ModuleBE_APIs_Class).useRoutes();
			routes.push(..._routes);
		}

		// console.log(routes);
		routes.forEach(api => {
			if (!api.addMiddlewares)
				throw new MUSTNeverHappenException(`Missing api.middleware for`);

			this.middlewares.filter(config => config.filter(api.apiDef) && api.addMiddlewares(...config.middlewares));
			api.route(this.express, this.initialPath);
		});

		this.express.all('*', (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
			this.logErrorBold(`Received unknown url with path: '${req.path}' - url: '${req.url}'`);
			res.status(404).send(`The requested URL '${req.url}' was not found on this server.`);
		});
	}

	public printRoutes(): void {
		const routes = this.resolveRoutes();
		routes.forEach(route => {
			const methodString = JSON.stringify(route.methods).padEnd(11, ' ');
			return this.logInfo(`${methodString} ${this.initialPath}${route.path}`);
		});
	}

	addMiddleware(filter: (apiDef: ApiDef<any>) => boolean = () => true, ...middlewares: ServerApi_Middleware[]) {
		this.middlewares.push({middlewares, filter});
	}

	public resolveRoutes = () => {
		const resolveStack = (_stack: any[]): any[] => {
			return _stack.map((layer: any) => {
				if (layer.route && typeof layer.route.path === 'string') {
					let methods = Object.keys(layer.route.methods);
					if (methods.length > 20)
						methods = ['ALL'];
					return {methods: methods, path: layer.route.path};
				}

				if (layer.name === 'router')
					return resolveStack(layer.handle.stack);

			}).filter(route => route);
		};

		const routes: (HttpRoute | HttpRoute[])[] = resolveStack(this.express._router.stack);
		return routes.reduce((toRet: HttpRoute[], route) => {
			const toAdd: HttpRoute[] = asArray(route);
			toRet.push(...toAdd);
			//addAllItemToArray(toRet, toAdd);

			return toRet;
		}, [] as HttpRoute[]);
	};

}