/*
 * Thunderstorm is a full web app framework!
 *
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
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
import {HttpServer, ServerApi} from '@nu-art/http-server';
import {ModuleBE_BaseFunction, ModuleBE_Firebase} from '@nu-art/firebase-backend';
import type {StormConfig} from './BaseStorm.js';
import {BaseStorm} from './BaseStorm.js';

const modules: Module[] = [
	ModuleBE_Firebase,
];

export class Storm
	extends BaseStorm {

	private functions: ModuleBE_BaseFunction[] = [];

	constructor(config: StormConfig | string) {
		super(config);
		BeLogged.addClient(process.env.GCLOUD_PROJECT && process.env.FUNCTIONS_EMULATOR ? LogClient_Terminal : LogClient_Function);
		this.addModulePack(modules);
		this.setMinLevel(LogLevel.Info);
	}

	init() {
		ServerApi.isDebug = this.config.isDebug === true;
		super.init();
		return this;
	}

	/** @deprecated RouteResolver is no longer used; middleware and 404 live on HttpServer. No-op for backward compat. */
	setInitialRouteResolver(_routeResolver: unknown) {
		return this;
	}

	startServer(onStarted?: () => Promise<void>) {
		this.functions = this.modules.filter((m): m is ModuleBE_BaseFunction => m instanceof ModuleBE_BaseFunction);

		this.startServerImpl(onStarted)
			.then(() => this.logInfo('Server Started!!'))
			.catch(reason => {
				this.logError('failed to launch server', String(reason));
				throw reason;
			});

		return this.functions.reduce<Record<string, unknown>>((toRet, fn) => {
			toRet[fn.getName()] = fn.getFunction();
			return toRet;
		}, {});
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

		// Deferred @ApiHandler routes (instance-getter apiDefs) register via setImmediate;
		// yield so they land on Express before the 404 catch-all.
		await new Promise(resolve => setImmediate(resolve));

		const httpServer = HttpServer.getDefault();
		httpServer.finalize();
		if (this.config.printRoutes === true)
			httpServer.printRoutes();

		const active = this.resolveActiveFunction();
		if (active)
			this.logInfo(`Starting function ${active.getName()}`);
		if (active && typeof active.serve === 'function')
			await active.serve(httpServer.getPort());
		else
			await httpServer.startServer();
		await Promise.all(this.functions.map(fn => fn.onFunctionReady()));
		await this.runPostBuildActions();
		await onStarted?.();
	}

	/**
	 * Cloud Run sets K_SERVICE to the service name. BAI names that service with
	 * dashes, and FUNCTION_TARGET keeps the function name. One image hosts every
	 * function; only the matching one may bind the port.
	 */
	private resolveActiveFunction(): ModuleBE_BaseFunction | undefined {
		const service = process.env.K_SERVICE;
		if (!service)
			return undefined;

		const target = process.env.FUNCTION_TARGET;
		const match = this.functions.find(fn => {
			const name = fn.getName();
			return name === service || name.replace(/_/g, '-') === service || name === target;
		});
		if (!match)
			this.logWarning(`K_SERVICE=${service} matches no function. Starting the HTTP server.`);

		return match;
	}

	static getInstance(): Storm {
		return Storm.instance as Storm;
	}

	public getConfig() {
		return this.config;
	}
}
