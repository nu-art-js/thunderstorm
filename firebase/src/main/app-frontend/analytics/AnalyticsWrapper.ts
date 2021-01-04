/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {Logger} from "@ir/ts-common";
import {
	FirebaseType_Analytics,
	FirebaseType_CallOptions,
	FirebaseType_EventNameString
} from "./types";
// tslint:disable:no-import-side-effect
import 'firebase/analytics';

export class AnalyticsWrapper
	extends Logger {

	private readonly analytics: FirebaseType_Analytics;

	constructor(analytics: FirebaseType_Analytics) {
		super();
		this.analytics = analytics;
	}

	setUserId(userId: string) {
		this.analytics.setUserId(userId);
	}

	setCurrentScreen(screenName: string) {
		this.analytics.setCurrentScreen(screenName);
	}

	setAnalyticsCollectionEnabled(bool: boolean) {
		this.analytics.setAnalyticsCollectionEnabled(bool);
	}

	setUserProperties(customPros: object) {
		this.analytics.setUserProperties(customPros);
	}

	logEvent<T extends string>(
		eventName: FirebaseType_EventNameString | string,
		eventParams?: { [key: string]: any },
		options?: FirebaseType_CallOptions
	) {
		return this.analytics.logEvent(eventName, eventParams, options);
	}

}