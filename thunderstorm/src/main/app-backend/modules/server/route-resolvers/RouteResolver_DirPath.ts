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

import {ServerApi} from '../server-api';
import * as fs from 'fs';
import * as express from 'express';
import {MUSTNeverHappenException} from '@nu-art/ts-common';
import {ServerApi_Middleware} from '../../../utils/types';


export class RouteResolver_DirPath {
	readonly express!: express.Express;
	readonly require: NodeRequire;
	readonly rootDir: string;
	readonly apiFolder: string;
	readonly initialPath: string;

	private middlewares: ServerApi_Middleware[] = [];
	private processor?: (api: ServerApi<any>) => void;

	constructor(require: NodeRequire, rootDir: string, initialPath: string, apiFolder?: string) {
		this.require = require;
		this.rootDir = rootDir;
		this.initialPath = initialPath;
		this.apiFolder = apiFolder || '';
	}

	addProcessor(processor: (api: ServerApi<any>) => void) {
		this.processor = processor;
	}

	setMiddlewares(middlewares: ServerApi_Middleware[] = []) {
		this.middlewares = middlewares;
		return this;
	}

	resolveApi(urlPrefix: string = !process.env.GCLOUD_PROJECT ? this.initialPath : '') {
		this.resolveApiImpl(urlPrefix, this.rootDir + '/' + this.apiFolder);
	}

	private resolveApiImpl(urlPrefix: string, workingDir: string) {
		fs.readdirSync(workingDir).forEach((file: string) => {
			if (fs.statSync(`${workingDir}/${file}`).isDirectory()) {
				this.resolveApiImpl(`${urlPrefix}/${file}`, `${workingDir}/${file}`);
				return;
			}

			if (file.endsWith('.d.ts'))
				return;

			if (!file.endsWith('.js'))
				return;

			if (file.startsWith('_'))
				return;

			const relativePathToFile = `.${workingDir.replace(this.rootDir, '')}/${file}`;
			if (file.startsWith('&')) {
				let routeResolver: RouteResolver_DirPath;
				try {
					routeResolver = this.require(relativePathToFile);
				} catch (e: any) {
					console.log(`could not reference RouteResolver for: ${workingDir}/${relativePathToFile}`, e);
					throw e;
				}

				// @ts-ignore
				routeResolver.express = this.express;
				routeResolver.resolveApi(urlPrefix);
				return;
			}

			let content: ServerApi<any> | ServerApi<any>[];
			try {
				content = this.require(relativePathToFile);
			} catch (e: any) {
				console.log(`could not reference ServerApi for: ${workingDir}/${relativePathToFile}`, e);
				throw e;
			}

			if (!Array.isArray(content))
				content = [content];

			content.forEach(api => {
				if (!api.addMiddlewares)
					throw new MUSTNeverHappenException(`Missing api.middleware for: ${relativePathToFile}`);

				this.processor?.(api);
				api.addMiddlewares(...this.middlewares);
				api.route(this.express, urlPrefix);
			});
		});
	}
}