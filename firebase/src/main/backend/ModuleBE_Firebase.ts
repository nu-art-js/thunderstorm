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

import {Module} from '@nu-art/ts-common';
import {FirebaseSession_Admin} from './auth/FirebaseSession_Admin';
// import {FirebaseSession_UserPassword} from "./auth/FirebaseSession_UserPassword";
import {readFileSync} from 'fs';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';


type ConfigType = {};
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

	public createAdminSession(projectId: string = FIREBASE_DEFAULT_PROJECT_ID) {
		let session = this.adminSessions[projectId];

		if (session)
			return session;

		let config;
		try {
			config = ModuleBE_Auth.getAuthConfig(projectId);
		} catch (e: any) {
			if (projectId !== FIREBASE_DEFAULT_PROJECT_ID)
				throw e;
		}

		// this.logInfo(`Creating Firebase session for project id: ${projectId}`);
		if (typeof config === 'string')
			config = JSON.parse(readFileSync(config, 'utf8'));

		this.logInfo(`Creating Firebase session for project id: ${projectId} `, config);
		session = new FirebaseSession_Admin(projectId, config);
		this.adminSessions[projectId] = session;

		session.connect();
		return session;
	}

	// listCollectionsInModules() {
	// 	const modules: Module[] = moduleResolver();
	//
	// 	const firebaseProjectCollections = modules.reduce((toRet, module) => {
	// 		const keys = _keys(module);
	// 		const _collections: FirestoreCollection<any>[] = keys
	// 			.filter(key => typeof module[key] === 'object' && module[key].constructor?.['name'].startsWith('FirestoreCollection'))
	// 			.map(key => module[key] as unknown as FirestoreCollection<any>)
	// 			.filter(collection => collection.wrapper.isAdmin());
	//
	// 		for (const collection of _collections) {
	// 			const projectId = collection.wrapper.firebaseSession.getProjectId();
	// 			const collectionName = collection.name;
	// 			const project = toRet[projectId] || (toRet[projectId] = {projectId: projectId, collections: []});
	// 			project.collections.push(collectionName);
	// 		}
	//
	// 		return toRet;
	// 	}, {} as { [k: string]: FirebaseProjectCollections });
	// 	return Object.values(firebaseProjectCollections);
	// }

}

export const ModuleBE_Firebase = new ModuleBE_Firebase_Class();