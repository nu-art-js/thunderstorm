/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {swSelf} from "./self";
import {ModuleManager} from "@ir/ts-common/core/module-manager";
import {BeLogged} from "@ir/ts-common/core/logger/BeLogged";
import {LogClient_Browser} from "@ir/ts-common/core/logger/LogClient_Browser";
import {LogLevel} from "@ir/ts-common/core/logger/types";

export class TS_ServiceWorker
	extends ModuleManager {

	constructor() {
		super();
		this._DEBUG_FLAG.enable(false);
		this.setMinLevel(LogLevel.Debug);
	}

	build(): void {
		BeLogged.addClient(LogClient_Browser);
		// swSelf.addEventListener("notificationclick", this.defaultHandler);
		// swSelf.addEventListener("pushsubscriptionchange", this.defaultHandler);
		// swSelf.addEventListener("push", this.defaultHandler);

		// Substitute previous service workers with the new one
		swSelf.addEventListener('install', () => {
			swSelf
				.skipWaiting()
				.then(() => this.logVerbose('Skipped waiting, now using the new SW'))
				.catch(e => this.logError('Something wrong while skipping waiting. Service worker not queued', e));
		});

		swSelf.addEventListener('activate', () => {
			swSelf
				.clients
				.claim()
				.then(() => this.logVerbose('Service Worker activated'))
				.catch(e => this.logError('Error activating service worker', e));
		});

		super.build();
	}

	// private defaultHandler = (event: Event) => {
	// 	this.logVerbose(`Event listened in sw of type ${event.type}`, event);
	// };
}
