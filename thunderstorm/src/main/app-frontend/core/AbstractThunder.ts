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

import {ThunderDispatcher} from "./thunder-dispatcher";
import {OnRequestListener} from "../../shared/request-types";
import {ModuleManager} from "@nu-art/ts-common/core/module-manager";
import {removeItemFromArray} from "@nu-art/ts-common/utils/array-tools";

export class AbstractThunder
	extends ModuleManager {

	protected listeners: any[] = [];

	constructor() {
		super();
		this._DEBUG_FLAG.enable(false);
		// @ts-ignore
		ThunderDispatcher.listenersResolver = () => this.listeners;
	}

	static getInstance(): AbstractThunder {
		return AbstractThunder.instance as AbstractThunder;
	}

	init() {
		super.init();

		this.renderApp();
		return this;
	}

	setRenderApp(renderApp: () => void) {
		this.renderApp = renderApp;
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

	public build(onStarted?: () => void) {
		super.build()
		onStarted?.();
	}

	protected renderApp = (): void => {
		// Stub
	};
}

export const dispatch_requestCompleted = new ThunderDispatcher<OnRequestListener, "__onRequestCompleted">("__onRequestCompleted");
