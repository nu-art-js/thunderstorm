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

/**
 * Created by tacb0ss on 19/09/2018.
 */
import firebase from "firebase/app";
// tslint:disable:no-import-side-effect
import 'firebase/auth';
import {
	Logger,
	ThisShouldNotHappenException
} from "@nu-art/ts-common";
// noinspection TypeScriptPreferShortImport
import {FirebaseConfig} from "../../index";
import {MessagingWrapper} from "../messaging/MessagingWrapper";
import {AnalyticsWrapper} from "../analytics/AnalyticsWrapper";
import {DatabaseWrapper} from "../database/DatabaseWrapper";

export class FirebaseSession
	extends Logger {
	app!: firebase.app.App;

	protected config: FirebaseConfig;
	protected sessionName: string;
	protected messaging?: MessagingWrapper;
	protected analytics?: AnalyticsWrapper;
	protected database?: DatabaseWrapper;

	constructor(sessionName: string, config: FirebaseConfig) {
		super(`firebase: ${sessionName}`);
		this.sessionName = sessionName;
		this.config = config;
	}

	public connect(): void {
		this.app = firebase.initializeApp(this.config, this.sessionName);
	}

	getMessaging() {
		if (this.messaging)
			return this.messaging;

		return this.messaging = new MessagingWrapper(this.app.messaging());
	}

	getAnalytics() {
		if (this.analytics)
			return this.analytics;

		return this.analytics = new AnalyticsWrapper(this.app.analytics());
	}

	getDatabase() {
		if (this.database)
			return this.database;

		return this.database = new DatabaseWrapper(this.app.database());
	}

	async signInWithToken(token: string) {
		return this.app.auth().signInWithCustomToken(token)
	};

	async signOut() {
		return this.app.auth().signOut()
	}

	getProjectId(): string {
		if (!this.config)
			throw new ThisShouldNotHappenException("Missing config. Probably init not resolved yet!")

		if (!this.config.projectId)
			throw new ThisShouldNotHappenException("Could not deduce project id from session config.. if you need the functionality.. add it to the config!!")

		return this.config.projectId;
	}
}

