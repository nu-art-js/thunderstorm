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
import {appWithJSX, renderApp, ThunderstormApp} from './AppWrapper';
import {BeLogged, LogClient_Browser, Module, ModuleManager, removeItemFromArray} from '@nu-art/ts-common';
import {XhrHttpModule} from '../modules/http/XhrHttpModule';
import {ModuleFE_Dialog} from '../component-modules/ModuleFE_Dialog';
import {ModuleFE_Routing} from '../modules/routing/ModuleFE_Routing';
import {ModuleFE_LocalStorage} from '../modules/ModuleFE_LocalStorage';
import {ThunderDispatcher} from './thunder-dispatcher';
import {ModuleFE_Thunderstorm} from '../modules/ModuleFE_Thunderstorm';

import '../styles/impl/basic.scss';
import '../styles/impl/icons.scss';
import {ModuleFE_Toaster} from '../component-modules/ModuleFE_Toaster';
import {ModuleFE_BrowserHistory} from '../modules/ModuleFE_BrowserHistory';
import {ThunderAppWrapperProps} from './types';
import {ModuleFE_RoutingV2} from '../modules/routing/ModuleFE_RoutingV2';
import {TS_Route} from '../modules/routing/types';


const modules: Module[] = [
	ModuleFE_Thunderstorm,
	XhrHttpModule,

	ModuleFE_Toaster,
	ModuleFE_Dialog,

	ModuleFE_Routing,
	ModuleFE_RoutingV2,
	ModuleFE_BrowserHistory,

	ModuleFE_LocalStorage,
];

export class Thunder
	extends ModuleManager {

	private listeners: any[] = [];
	private renderFunc!: (props: ThunderAppWrapperProps) => React.ReactElement;
	private props!: ThunderAppWrapperProps<any>;

	constructor() {
		super();
		this.addModules(...modules);
		this._DEBUG_FLAG.enable(false);
		// @ts-ignore
		ThunderDispatcher.listenersResolver = () => this.listeners;
	}

	static getInstance(): Thunder {
		return Thunder.instance as Thunder;
	}

	init() {
		BeLogged.addClient(LogClient_Browser);

		super.init();

		renderApp();
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

	renderApp() {
		return this.renderFunc?.(this.props);
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

	setRouteApp(rootRoute: TS_Route) {
		this.setMainApp(ThunderstormApp, {rootRoute});
		return this;
	}

	public build(onStarted?: () => void) {
		super.build();
		onStarted?.();
	}

	public getConfig() {
		return this.config;
	}
}


