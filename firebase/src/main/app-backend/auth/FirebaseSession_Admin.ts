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

/**
 * Created by tacb0ss on 19/09/2018.
 */
import {auth, credential, initializeApp, ServiceAccount} from 'firebase-admin';
import {JWTInput} from 'google-auth-library';
import {FirebaseSession} from './firebase-session';
import {ThisShouldNotHappenException} from '@nu-art/ts-common';

export class FirebaseSession_Admin
	extends FirebaseSession<JWTInput & { databaseURL?: string } | undefined> {

	constructor(sessionName: string, config?: JWTInput) {
		super(config, sessionName);
	}

	public connect(): void {
		this.app = this.createApp();
	}

	getProjectId(): string {
		if (!this.config) {
			if (!process.env.GCLOUD_PROJECT)
				throw new ThisShouldNotHappenException('Could not deduce project id from function const!!');

			return process.env.GCLOUD_PROJECT;
		}

		if (!this.config.project_id)
			throw new ThisShouldNotHappenException('Could not deduce project id from session config.. if you need the functionality.. add it to the config!!');

		return this.config.project_id;
	}

	private createApp() {
		if (!this.config)
			return initializeApp();

		const databaseURL = this.config.databaseURL || `https://${this.config.project_id}.firebaseio.com`;
		return initializeApp({
			credential: credential.cert(this.config as ServiceAccount),
			databaseURL: databaseURL
		}, this.sessionName);
	}

	public getAuth(): auth.Auth {
		return this.app.auth();
	}
}

