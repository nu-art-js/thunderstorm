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

import {Express} from 'express';
import {ServerApi_Middleware} from '../../../utils/types';
import {Storm} from '../../../core/Storm';
import {ServerApi} from '../server-api';
import {_values, addAllItemToArray, Logger, LogLevel, MUSTNeverHappenException} from '@nu-art/ts-common';
import {ApiModule, ApiServerRouter} from '../../../utils/api-caller-types';


export type HttpRoute = {
	methods: string[]
	path: string
}

export class RouteResolver_ModulePath
	extends Logger {
	readonly express: Express;
	private middlewares: ServerApi_Middleware[] = [];
	private initialPath: string;

	constructor(express: Express, initialPath: string) {
		super();
		this.express = express;
		this.initialPath = !process.env.GCLOUD_PROJECT ? initialPath : '';
		this.setMinLevel(LogLevel.Debug);
	}

	public resolveApi() {
		const modules: ApiModule[] = Storm.getInstance().filterModules(module => !!(module as unknown as ApiModule).useRoutes);

		//Filter Api modules
		const callbackfn = (acc: ServerApi<any>[], item?: ApiServerRouter<any> | ServerApi<any>) => {
			if (item instanceof ServerApi) {
				acc.push(item);
				return acc;
			}

			if (!item)
				return acc;

			_values(item).reduce(callbackfn, acc);
			return acc;
		};

		const routes = modules.map(m => m.useRoutes()).reduce<ServerApi<any>[]>(callbackfn, []);
		// console.log(routes);
		routes.forEach(api => {
			if (!api.addMiddlewares)
				throw new MUSTNeverHappenException(`Missing api.middleware for`);

			api.addMiddlewares(...this.middlewares);
			api.route(this.express, this.initialPath);
		});

	}

	public printRoutes(): void {
		const routes = this.resolveRoutes();
		routes.forEach(route => {
			const methodString = JSON.stringify(route.methods).padEnd(11, ' ');
			return this.logInfo(`${methodString} ${this.initialPath}${route.path}`);
		});
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
			const toAdd: HttpRoute[] = Array.isArray(route) ? route : [route];
			addAllItemToArray(toRet, toAdd);
			return toRet;
		}, [] as HttpRoute[]);
	};

}