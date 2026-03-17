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

import * as React from 'react';
import {
	AsyncVoidFunction,
	BeLogged,
	exists,
	ImplementationMissingException,
	LogClient_BrowserGroups,
	merge,
	ModuleManager,
	Promise_all_sequentially,
	removeItemFromArray,
	TS_Object
} from '@nu-art/ts-common';
import * as RDC from 'react-dom/client';
import {ThunderDispatcher} from './thunder-dispatcher.js';
import type {ThunderAppWrapperProps} from './ThunderTypes.js';
import {appWithJSX} from './AppWrapper.js';
import {StorageKey} from './ModuleFE_LocalStorage.js';
import {
	getBrowseAndDeviceLogs,
	getECMADataLog,
	getiFrameLog,
	getJSEngineLogs,
	globalErrorListener,
	indexedDBAsyncCheckLog,
	navigationTimingLog
} from './thunder-helpers.js';

export const Storage_AppVersion = new StorageKey<string>('app-version').withstandDeletion();

export type ThunderConfig = {
	defaultConfigUrl?: string;
	configUrl: string;
};

export class Thunder
	extends ModuleManager {

	private listeners: unknown[] = [];
	private renderFunc!: (props: ThunderAppWrapperProps) => React.ReactElement;
	private props!: ThunderAppWrapperProps;
	private preBuildActions: AsyncVoidFunction[] = [];
	readonly innerConfig: Readonly<ThunderConfig>;

	constructor(config: ThunderConfig) {
		super();
		BeLogged.addClient(LogClient_BrowserGroups);

		(window as unknown as { thunder: Thunder }).thunder = this;
		(ThunderDispatcher as unknown as { listenersResolver: () => unknown[] }).listenersResolver = () => this.listeners;
		this.addPreBuildAction(this.fetchConfig.bind(this));

		this.innerConfig = Object.freeze(config);
	}

	static getInstance(): Thunder {
		return Thunder.instance as Thunder;
	}

	init() {
		super.init();

		const appJsx = this.renderFunc?.(this.props);
		if (!appJsx)
			throw new ImplementationMissingException('Could not get app from Thunder!');

		const rootDiv = document.createElement('div');
		rootDiv.classList.add('match_parent');
		rootDiv.setAttribute('id', 'root');
		document.body.appendChild(rootDiv);

		RDC.createRoot(rootDiv).render(appJsx);

		return this;
	}

	private async fetchConfig() {
		try {
			this.config = {};
			const defaultUrl = this.innerConfig.defaultConfigUrl;
			const defaultRes = defaultUrl ? await fetch(defaultUrl) : null;
			const defaultData = defaultRes ? (await defaultRes.json()) as TS_Object : {};
			const envRes = await fetch(this.innerConfig.configUrl);
			const envData = (await envRes.json()) as TS_Object;

			if (!exists(defaultData))
				return this.logWarning('Could not resolve default config');

			if (!exists(envData))
				return this.logWarning('Could not resolve env config');

			if (typeof defaultData !== 'object')
				return this.logWarning('default config is not an object');

			if (typeof envData !== 'object')
				return this.logWarning('env config is not an object');

			this.config = merge(merge(this.config, defaultData), envData);
		} catch (err: unknown) {
			this.logError('failed loading config with error', String(err));
		}
	}

	protected addUIListener(listener: unknown): void {
		this.logVerbose(`Register UI listener: ${String(listener)}`);
		this.listeners.push(listener);
	}

	protected removeUIListener(listener: unknown): void {
		this.logVerbose(`Unregister UI listener: ${String(listener)}`);
		removeItemFromArray(this.listeners, listener);
	}

	public setMainApp<P extends Record<string, unknown>>(
		mainApp: React.ElementType<P>,
		props: P                                                          = {} as P,
		renderFunc: (props: ThunderAppWrapperProps) => React.ReactElement = appWithJSX
	): Thunder {
		this.props = {
			element: mainApp as React.ElementType,
			props: props as Record<string, unknown>
		};

		this.renderFunc = renderFunc;
		return this;
	}

	public build(onStarted?: () => void) {
		Promise_all_sequentially(this.preBuildActions).then(() => {
			super.build();
			onStarted?.();
		});
	}

	public setVersion(version: string): this {
		Storage_AppVersion.set(version);
		return super.setVersion(version);
	}

	public getConfig() {
		return this.config;
	}

	public addPreBuildAction = (func: AsyncVoidFunction) => {
		this.preBuildActions.push(func);
		return this;
	};

	public logStuff = () => {
		getBrowseAndDeviceLogs();
		getJSEngineLogs();
		getECMADataLog();
		getiFrameLog();
		navigationTimingLog();
		globalErrorListener();
		indexedDBAsyncCheckLog();
	};

	public getEnvironment(): string {
		return Thunder.getInstance().getConfig().label as string;
	}
}
