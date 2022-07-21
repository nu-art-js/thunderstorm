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
import {ApiModule, ApiServerRouter} from '../../../utils/types';
import {ServerApi_Middleware} from '../HttpServer';
import {Storm} from '../../../core/Storm';
import {ServerApi} from '../server-api';
import {MUSTNeverHappenException, _values} from '@nu-art/ts-common';

export class RouteResolver_ModulePath {
	readonly express: Express;
	private middlewares: ServerApi_Middleware[] = [];

	constructor(express: Express) {
		this.express = express;
	}

	public resolveApi(urlPrefix: string, modules: ApiModule[] = Storm.getInstance().filterModules(module => !!(module as unknown as ApiModule).useRoutes)) {
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
		routes.forEach(api => {
			if (!api.addMiddlewares)
				throw new MUSTNeverHappenException(`Missing api.middleware for`);

			api.addMiddlewares(...this.middlewares);
			api.route(this.express, urlPrefix);
		});

	}

}