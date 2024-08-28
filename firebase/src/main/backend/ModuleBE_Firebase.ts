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
 * Created by tacb0ss on 25/08/2018.
 */

import {Module} from '@thunder-storm/common';
import {FirebaseSession_Admin} from './auth/FirebaseSession_Admin';
// import {FirebaseSession_UserPassword} from "./auth/FirebaseSession_UserPassword";
import {readFileSync} from 'fs';
import {ModuleBE_Auth} from '@thunder-storm/google-services/backend';


type ConfigType = {
	isEmulator?: boolean
};

export const FIREBASE_DEFAULT_PROJECT_ID = 'local';

export class ModuleBE_Firebase_Class
	extends Module<ConfigType> {

	// private readonly tokenSessions: { [s: string]: FirebaseSession_UserPassword; } = {};
	private readonly adminSessions: { [s: string]: FirebaseSession_Admin; } = {};

	constructor() {
		super('firebase');
	}

	protected init(): void {
	}

	public createAdminSession(authKey: string = FIREBASE_DEFAULT_PROJECT_ID) {
		const session = this.adminSessions[authKey];
		if (session)
			return session;

		// try to fetch the service account from the auth serviceAccount by the authKey
		let serviceAccount;
		try {
			serviceAccount = ModuleBE_Auth.getAuthConfig(authKey);
		} catch (e: any) {
			if (authKey !== FIREBASE_DEFAULT_PROJECT_ID)
				throw e;
		}

		// if we received a string we assume it is a path to the service account, and we load it into our serviceAccount
		if (typeof serviceAccount === 'string')
			serviceAccount = JSON.parse(readFileSync(serviceAccount, 'utf8'));

		// define a unique key for the firebase session, and any following requests for this auth key
		this.logInfo(`Creating Firebase session for auth key: ${authKey}`, serviceAccount);
		return this.adminSessions[authKey] = new FirebaseSession_Admin(authKey, serviceAccount).connect();
	}

	createModuleStateFirebaseRef<T>(module: Module, _relativePath: string) {
		let relativePath = _relativePath;
		if (relativePath.startsWith('/'))
			relativePath = relativePath.substring(1);

		const path = `/state/${module.getName()}/${relativePath}`;
		return ModuleBE_Firebase.createAdminSession().getDatabase().ref<T>(path);
	}
}

export const ModuleBE_Firebase = new ModuleBE_Firebase_Class();