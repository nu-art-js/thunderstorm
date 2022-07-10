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
import {renderApp, WrapperProps} from './AppWrapper';
import {BeLogged, LogClient_Browser, Module, ModuleManager, removeItemFromArray} from '@nu-art/ts-common';
import {XhrHttpModule} from '../modules/http/XhrHttpModule';
import {ToastModule} from '../component-modules/ToasterModule';
import {DialogModule} from '../component-modules/DialogModule';
import {RoutingModule} from '../modules/routing/RoutingModule';
import {BrowserHistoryModule} from '../modules/HistoryModule';
import {StorageModule} from '../modules/StorageModule';
import {ResourcesModule} from '../modules/ResourcesModule';
import {ThunderDispatcher} from './thunder-dispatcher';
import {OnRequestListener} from '../../shared/request-types';
import {ThunderstormModule} from '../modules/ThunderstormModule';

import '../styles/impl/basic.scss';
import '../styles/impl/icons.scss';


const modules: Module[] = [
	ThunderstormModule,
	XhrHttpModule,

	ToastModule,
	DialogModule,

	RoutingModule,
	BrowserHistoryModule,

	StorageModule,
	ResourcesModule

];

export class Thunder
	extends ModuleManager {

	private mainApp!: React.ElementType<WrapperProps>;
	private listeners: any[] = [];

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

	public setMainApp(mainApp: React.ElementType<WrapperProps>): Thunder {
		this.mainApp = mainApp;
		return this;
	}

	public getMainApp(): React.ElementType<WrapperProps> {
		return this.mainApp;
	}

	public build(onStarted?: () => void) {
		super.build();
		onStarted?.();
	}

	public getConfig() {
		return this.config;
	}
}

export const dispatch_requestCompleted = new ThunderDispatcher<OnRequestListener, '__onRequestCompleted'>('__onRequestCompleted');
