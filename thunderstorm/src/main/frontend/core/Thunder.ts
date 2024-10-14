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
	ImplementationMissingException,
	LogClient_BrowserGroups,
	ModuleManager,
	Promise_all_sequentially,
	removeItemFromArray
} from '@nu-art/ts-common';
import {ThunderDispatcher} from './thunder-dispatcher';

import '../styles/impl/basic.scss';
import '../styles/impl/icons.scss';
import {ThunderAppWrapperProps} from './types';
import * as RDC from 'react-dom/client';
import {appWithJSX} from './AppWrapper';
import {StorageKey} from '../modules/ModuleFE_LocalStorage';

export const Storage_AppVersion = new StorageKey<string>('app-version').withstandDeletion();

export class Thunder
	extends ModuleManager {

	private listeners: any[] = [];
	private renderFunc!: (props: ThunderAppWrapperProps) => React.ReactElement;
	private props!: ThunderAppWrapperProps<any>;
	private preBuildActions: AsyncVoidFunction[] = [];

	constructor() {
		super();
		this._DEBUG_FLAG.enable(false);
		// @ts-ignore
		ThunderDispatcher.listenersResolver = () => this.listeners;
	}

	static getInstance(): Thunder {
		return Thunder.instance as Thunder;
	}

	init() {
		BeLogged.addClient(LogClient_BrowserGroups);

		super.init();

		const appJsx = this.renderFunc?.(this.props);
		if (!appJsx)
			throw new ImplementationMissingException('Could not get app from Thunder!');

		//Set root div and its attributes
		const rootDiv = document.createElement('div');
		rootDiv.classList.add('match_parent');
		rootDiv.setAttribute('id', 'root');
		document.body.appendChild(rootDiv);

		//Set app root
		RDC.createRoot(rootDiv).render(appJsx);

		return this;
	}

	protected addUIListener(listener: any): void {
		this.logInfo(`Register UI listener: ${listener}`);
		this.listeners.push(listener);
	}

	protected removeUIListener(listener: any): void {
		this.logInfo(`Unregister UI listener: ${listener}`);
		removeItemFromArray(this.listeners, listener);
	}

	/**
	 * Set up the entry point for the app.
	 * @param mainApp - The entry point into the application, what will be rendered directly under root (usually App.tsx)
	 * @param props - The props to go with the supplied main app
	 * @param renderFunc - The app wrapper, which will usually provide a router. by default is "appWithJSX" which will just return the app
	 */
	public setMainApp<P extends {}>(mainApp: React.ElementType<P>, props: P = {} as P, renderFunc: (props: ThunderAppWrapperProps) => React.ReactElement = appWithJSX): Thunder {
		this.props = {
			element: mainApp,
			props: props
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

	public getEnvironment(): string {
		return Thunder.getInstance().getConfig().label;
	}
}