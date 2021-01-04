/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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
	ImplementationMissingException,
	Module
} from "@ir/ts-common";
import {FirebaseModule} from "../FirebaseModule";
import {AnalyticsWrapper} from "./AnalyticsWrapper";

class FirebaseAnalyticsModule_Class
	extends Module {

	private analytics?: AnalyticsWrapper;

	protected init(): void {
		this.runAsync('Init Analytics', this._init);
	}

	private _init = async () => {
		const session = await FirebaseModule.createSession();

		this.analytics = session.getAnalytics();
		this.analytics.setAnalyticsCollectionEnabled(true);
	};

	logEvent(eventName: string, eventParams?: { [key: string]: any }) {
		if (!this.analytics)
			throw new ImplementationMissingException('Missing analytics wrapper');

		return this.analytics.logEvent(eventName, eventParams);
	}

	setCurrentScreen(screenName: string) {
		if (!this.analytics)
			throw new ImplementationMissingException('Missing analytics wrapper');

		return this.analytics.setCurrentScreen(screenName);
	}
}

export const FirebaseAnalyticsModule = new FirebaseAnalyticsModule_Class();