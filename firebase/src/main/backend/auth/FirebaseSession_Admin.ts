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
import {initializeApp} from 'firebase-admin/app';
import {JWTInput} from 'google-auth-library';
import {FirebaseSession} from './firebase-session';
import {getAuth} from 'firebase-admin/auth';


/**
 Represents an admin session for interacting with Firebase services.
 */
export class FirebaseSession_Admin
	extends FirebaseSession<JWTInput & { databaseURL?: string, isEmulator?: boolean } | undefined> {

	constructor(firebaseAppName: string, config?: any) {
		super(config, firebaseAppName);
	}

	/**
	 * Establishes a connection to the Firebase project using the configuration data and the project ID.
	 */
	public connect(): this {
		this.app = initializeApp(this.config, this.firebaseAppName);
		return this;
	}

	/**
     Returns an instance of the Firebase Authentication service.
	 */
	public getAuth() {
		return getAuth(this.app);
	}
}

