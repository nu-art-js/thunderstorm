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

import {Logger} from '@nu-art/ts-common';
import {FirebaseType_Analytics, FirebaseType_CallOptions, FirebaseType_EventNameString} from './types';
import {CustomParams, getAnalytics, logEvent, setAnalyticsCollectionEnabled, setCurrentScreen, setUserId, setUserProperties,} from 'firebase/analytics';
import {FirebaseApp} from 'firebase/app';

export class AnalyticsWrapperFE
	extends Logger {

	private readonly analytics: FirebaseType_Analytics;

	constructor(app: FirebaseApp) {
		super();
		this.analytics = getAnalytics(app);
	}

	setUserId(userId: string, options?: FirebaseType_CallOptions) {
		setUserId(this.analytics, userId, options);
	}

	setCurrentScreen(screenName: string, options?: FirebaseType_CallOptions) {
		setCurrentScreen(this.analytics, screenName, options);
	}

	setAnalyticsCollectionEnabled(enabled: boolean) {
		setAnalyticsCollectionEnabled(this.analytics, enabled);
	}

	setUserProperties(properties: CustomParams, options?: FirebaseType_CallOptions) {
		setUserProperties(this.analytics, properties);
	}

	logEvent<T extends string>(
		eventName: FirebaseType_EventNameString | string,
		eventParams?: { [key: string]: any },
		options?: FirebaseType_CallOptions
	) {
		return logEvent(this.analytics, eventName, eventParams, options);
	}

}