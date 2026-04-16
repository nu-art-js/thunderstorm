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

import {composeUrl, ImplementationMissingException, merge, Module, TypedMap} from '@nu-art/ts-common';
import {FirebaseSession_Admin} from './auth/FirebaseSession_Admin.js';
import {FirebaseSession} from './auth/firebase-session.js';
// import {FirebaseSession_UserPassword} from "./auth/FirebaseSession_UserPassword.js";
import {readFileSync} from 'fs';
import {ModuleBE_Auth} from '@nu-art/google-services-backend';
import {deleteApp, getApps} from 'firebase-admin/app';


export type FirestoreMongoConfig = {
	firestoreUid: string;
	firestoreLocation: string;
};

export type MongoConnectionConfig = {
	mongoUrl?: string;
	firestoreMongo?: FirestoreMongoConfig;
	params?: TypedMap<string | number>;
};

type ConfigType = {
	isEmulator?: boolean
	mongo?: MongoConnectionConfig;
};

export const FIREBASE_DEFAULT_PROJECT_ID = 'local';

export class ModuleBE_Firebase_Class
	extends Module<ConfigType> {

	private readonly adminSessions: { [s: string]: FirebaseSession_Admin; } = {};

	constructor() {
		super('firebase');
	}

	protected init(): void {
		FirebaseSession.setMongoUrlResolver((authKey) => this.resolveMongoUrl(authKey));
	}

	async __resetForTests() {
		this.logWarning('__resetForTests');

		for (const key in this.adminSessions)
			delete this.adminSessions[key];
		await Promise.all(getApps().map(app => deleteApp(app)));
	}

	public createAdminSession(authKey: string = FIREBASE_DEFAULT_PROJECT_ID) {
		const session = this.adminSessions[authKey];
		if (session)
			return session;

		let serviceAccount;
		try {
			serviceAccount = ModuleBE_Auth.getCredentials(authKey);
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

	public resolveMongoUrl(authKey?: string): string {
		const mongoConfig = this.resolveMongoConfig(authKey);

		if (mongoConfig?.mongoUrl)
			return composeUrl(mongoConfig.mongoUrl, mongoConfig.params);

		if (mongoConfig?.firestoreMongo)
			return ModuleBE_Firebase_Class.buildFirestoreMongoUrl(mongoConfig.firestoreMongo, mongoConfig.params);

		throw new ImplementationMissingException(
			`No MongoDB connection configured for session '${authKey ?? 'default'}'. ` +
			'Set mongo.mongoUrl or mongo.firestoreMongo in ModuleBE_Firebase config (default), or in auth config (keyed).');
	}

	private resolveMongoConfig(authKey?: string): MongoConnectionConfig | undefined {
		if (!authKey || authKey === FIREBASE_DEFAULT_PROJECT_ID)
			return this.config?.mongo;

		try {
			const authConfig = ModuleBE_Auth.getAuthConfig(authKey);
			if (typeof authConfig === 'object' && 'mongo' in authConfig)
				return (authConfig as { mongo: MongoConnectionConfig }).mongo;
		} catch (_e: any) {
		}

		return undefined;
	}

	private static readonly firestoreMongoDefaults: TypedMap<string | number> = {
		loadBalanced: 'true',
		tls: 'true',
		retryWrites: 'false',
		connectTimeoutMS: 30000,
		socketTimeoutMS: 60000,
		authMechanism: 'MONGODB-OIDC',
		authMechanismProperties: 'ENVIRONMENT:gcp,TOKEN_RESOURCE:FIRESTORE',
	};

	private static buildFirestoreMongoUrl(config: FirestoreMongoConfig, overrides?: TypedMap<string | number>): string {
		const {firestoreUid, firestoreLocation} = config;
		const baseUrl = `mongodb://${firestoreUid}.${firestoreLocation}.firestore.goog:443/default`;
		return composeUrl(baseUrl, merge(ModuleBE_Firebase_Class.firestoreMongoDefaults, overrides));
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
