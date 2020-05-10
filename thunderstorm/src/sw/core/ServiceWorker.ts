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

import {
	BeLogged,
	LogClient_Browser,
	ModuleManager
} from "@nu-art/ts-common";
import {swSelf} from "./self";

export class ServiceWorker
	extends ModuleManager {

	constructor() {
		super();
		this._DEBUG_FLAG.enable(true);
	}

	static getInstance(): ServiceWorker {
		return ServiceWorker.instance as ServiceWorker;
	}

	init() {
		BeLogged.addClient(LogClient_Browser);

		return super.init();
	}

	build(): void {
		// Substitute previous service workers with the new
		swSelf.addEventListener('install', () => {
			swSelf
				.skipWaiting()
				.then(() => this.logVerbose('Skipped waiting, now using the new SW'))
				.catch(e => this.logVerbose('Something wrong while skipping waiting. Service worker not queued', e));
		});

		// This means the service worker hasn't been registered yet so it's just running
		// to check the existence of the bundle in order to register it ==> no need to run the rest
		if (!(self && 'ServiceWorkerGlobalScope' in self))
			return;

		super.build()
	}
}
