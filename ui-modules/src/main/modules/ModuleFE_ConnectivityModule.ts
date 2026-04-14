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

import {Module} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';

export interface OnConnectivityChange {
	__onConnectivityChange(): void;
}

class ModuleFE_ConnectivityModule_Class
	extends Module {

	private connected: boolean;
	private dispatch_onConnectivityChange = new ThunderDispatcher<OnConnectivityChange, '__onConnectivityChange'>('__onConnectivityChange');

	constructor() {
		super();
		this.connected = this.getConnectivityStatus();
	}

	protected init(): void {
		window.addEventListener('online', this.handleConnectionChange);
		window.addEventListener('offline', this.handleConnectionChange);
	}

	isConnected = () => this.connected;

	handleConnectionChange = () => {
		this.connected = this.getConnectivityStatus();
		this.dispatch_onConnectivityChange.dispatchModule();
		this.dispatch_onConnectivityChange.dispatchUI();
	};

	private getConnectivityStatus = () => navigator.onLine;
}

export const ModuleFE_ConnectivityModule = new ModuleFE_ConnectivityModule_Class();
