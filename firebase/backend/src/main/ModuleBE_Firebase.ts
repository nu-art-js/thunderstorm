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

import {ImplementationMissingException, Module} from '@nu-art/ts-common';
import {FirebaseSession_Admin} from './auth/FirebaseSession_Admin.js';
import {FirebaseSession} from './auth/firebase-session.js';
// import {FirebaseSession_UserPassword} from "./auth/FirebaseSession_UserPassword.js";
import {readFileSync} from 'fs';
import {ModuleBE_Auth, ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {deleteApp, getApps} from 'firebase-admin/app';
import {LazyMongoConnection, type MongoConnectionConfig} from './LazyMongoConnection.js';

export type {FirestoreMongoConfig, MongoConnectionConfig} from './LazyMongoConnection.js';

type ConfigType = {
	isEmulator?: boolean
	mongo?: MongoConnectionConfig;
};

export const FIREBASE_DEFAULT_PROJECT_ID = 'local';

/** Secret Manager may store the URL raw or as a JSON string. The value is never logged. */
function normalizeMongoUrlSecret(raw: string | undefined): string {
	const trimmed = raw?.trim() ?? '';
	if (!trimmed)
		throw new ImplementationMissingException('MongoDB url secret is empty');

	if (!trimmed.startsWith('"'))
		return trimmed;

	try {
		const parsed: unknown = JSON.parse(trimmed);
		if (typeof parsed !== 'string' || !parsed.trim())
			throw new ImplementationMissingException('MongoDB url secret must be a string');

		return parsed.trim();
	} catch (err: unknown) {
		if (err instanceof ImplementationMissingException)
			throw err;

		throw new ImplementationMissingException('MongoDB url secret is not valid JSON text');
	}
}

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

		// Close MongoClients before dropping session refs — otherwise open sockets
		// keep the event loop alive and mocha/`emulators:exec` hang after the suite.
		await Promise.all(Object.values(this.adminSessions).map(async session => {
			try {
				await session.closeMongo();
			} catch (e: unknown) {
				const name = e instanceof Error ? e.name : 'Error';
				this.logWarning(`Error closing mongo during reset — ${name}`);
			}
		}));

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

	public resolveMongoUrl(authKey?: string): Promise<string> {
		return LazyMongoConnection.resolveUrl(
			this.resolveMongoConfig(authKey),
			secret => this.readMongoUrlSecret(secret),
			authKey ?? 'default',
		);
	}

	/** Raw Secret Manager read. Accepts a secret name or a `projects/...` resource. Never logs the value. */
	private async readMongoUrlSecret(secret: string): Promise<string> {
		const name = secret.trim();
		if (!name)
			throw new ImplementationMissingException('mongoUrlSecret is empty');

		const raw = name.startsWith('projects/')
			? await ModuleBE_SecretManager.getSecretValueImpl(name.includes('/versions/') ? name : `${name}/versions/latest`)
			: await this.readNamedMongoSecret(name);

		return normalizeMongoUrlSecret(raw);
	}

	private async readNamedMongoSecret(name: string): Promise<string | undefined> {
		const projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
		if (!projectId)
			throw new ImplementationMissingException('Missing GCP_PROJECT_ID / GCLOUD_PROJECT to read mongoUrlSecret');

		return ModuleBE_SecretManager.tryGetSecretValue({key: name, projectId, version: 'latest'});
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

	createModuleStateFirebaseRef<T>(module: Module, _relativePath: string) {
		let relativePath = _relativePath;
		if (relativePath.startsWith('/'))
			relativePath = relativePath.substring(1);

		const path = `/state/${module.getName()}/${relativePath}`;
		return ModuleBE_Firebase.createAdminSession().getDatabase().ref<T>(path);
	}
}

export const ModuleBE_Firebase = new ModuleBE_Firebase_Class();
