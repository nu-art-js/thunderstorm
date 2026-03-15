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

import {BeLogged, LogClient_Function, LogClient_Terminal, LogLevel, Module} from '@nu-art/ts-common';
import {Firebase_ExpressFunction} from '@nu-art/firebase-backend/v1';
import {HttpServer, ServerApi} from '@nu-art/http-server';
import {ModuleBE_BaseFunction, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import type {HttpRoute} from './RouteResolver_ModulePath.js';
import type {StormConfig} from './BaseStorm.js';
import {BaseStorm} from './BaseStorm.js';

type RouteResolver = {
	resolveApi: (urlPrefix?: string) => void;
	printRoutes: (urlPrefix?: string) => void;
	resolveRoutes: (urlPrefix?: string) => HttpRoute[];
};

const modules: Module[] = [
	ModuleBE_Firebase
];

export class Storm
	extends BaseStorm {

	private routeResolver!: RouteResolver;
	private functions: unknown[] = [];

	constructor(config: StormConfig | string) {
		super(config);
		BeLogged.addClient(process.env.GCLOUD_PROJECT && process.env.FUNCTIONS_EMULATOR ? LogClient_Terminal : LogClient_Function);
		this.addModulePack(modules);
		this.setMinLevel(LogLevel.Info);
	}

	init() {
		ServerApi.isDebug = this.config.isDebug === true;
		super.init();
		this.routeResolver.resolveApi();
		if (this.config.printRoutes === true)
			this.routeResolver.printRoutes();
		return this;
	}

	setInitialRouteResolver(routeResolver: RouteResolver) {
		this.routeResolver = routeResolver;
		return this;
	}

	startServer(onStarted?: () => Promise<void>) {
		const modulesAsFunction = this.modules.filter((m): m is ModuleBE_BaseFunction => m instanceof ModuleBE_BaseFunction);
		this.functions = [new Firebase_ExpressFunction(HttpServer.getDefault().getExpress()), ...modulesAsFunction];

		this.startServerImpl(onStarted)
			.then(() => this.logInfo('Server Started!!'))
			.catch(reason => {
				this.logError('failed to launch server', String(reason));
				throw reason;
			});

		return this.functions.reduce<Record<string, unknown>>((toRet, fn) => {
			const f = fn as ModuleBE_BaseFunction;
			toRet[f.getName()] = f.getFunction();
			return toRet;
		}, {});
	}

	getRoutes(): HttpRoute[] {
		return this.routeResolver.resolveRoutes();
	}

	build(onStarted?: () => Promise<void>) {
		return this.startServer(onStarted);
	}

	private async startServerImpl(onStarted?: () => Promise<void>) {
		const label = 'Resolving Config';
		console.time(label);
		await this.resolveConfig();
		console.timeEnd(label);
		this.init();
		await HttpServer.getDefault().startServer();
		await Promise.all(this.functions.map((fn) => (fn as ModuleBE_BaseFunction).onFunctionReady()));
		await onStarted?.();
	}

	static getInstance(): Storm {
		return Storm.instance as Storm;
	}

	public getConfig() {
		return this.config;
	}
}
