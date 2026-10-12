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

import {composeUrl, ImplementationMissingException, merge, TypedMap} from '@nu-art/ts-common';


export type FirestoreMongoConfig = {
	firestoreUid: string;
	firestoreLocation: string;
};

export type MongoConnectionConfig = {
	mongoUrl?: string;
	/** Secret Manager secret name (`mongo-url`) or resource (`projects/.../secrets/...`). Preferred over `mongoUrl`. */
	mongoUrlSecret?: string;
	firestoreMongo?: FirestoreMongoConfig;
	params?: TypedMap<string | number>;
};

export type MongoSecretResolver = (secret: string) => Promise<string>;

export type MongoClientFactory<Client> = (url: string) => Promise<Client> | Client;

const firestoreMongoDefaults: TypedMap<string | number> = {
	loadBalanced: 'true',
	tls: 'true',
	retryWrites: 'false',
	connectTimeoutMS: 30000,
	socketTimeoutMS: 60000,
	authMechanism: 'MONGODB-OIDC',
	authMechanismProperties: 'ENVIRONMENT:gcp,TOKEN_RESOURCE:FIRESTORE',
};

function buildFirestoreMongoUrl(config: FirestoreMongoConfig, overrides?: TypedMap<string | number>): string {
	const {firestoreUid, firestoreLocation} = config;
	const baseUrl = `mongodb://${firestoreUid}.${firestoreLocation}.firestore.goog:443/default`;
	return composeUrl(baseUrl, merge(firestoreMongoDefaults, overrides));
}

/**
 * One Mongo connection for both config shapes.
 * `get()` resolves the URL (`mongoUrlSecret` when set, otherwise `mongoUrl`) and creates the client.
 * Callers share one in-flight promise. A failure drops that promise so the next `get()` tries again.
 * The URL is never logged.
 */
export class LazyMongoConnection<Client> {

	private connecting?: Promise<Client>;

	public constructor(
		private readonly resolveUrl: () => Promise<string>,
		private readonly createClient: MongoClientFactory<Client>,
	) {
	}

	public get(): Promise<Client> {
		if (!this.connecting)
			this.connecting = this.open().catch(err => {
				this.connecting = undefined;
				throw err;
			});

		return this.connecting;
	}

	public clear(): void {
		this.connecting = undefined;
	}

	private async open(): Promise<Client> {
		const url = await this.resolveUrl();
		return this.createClient(url);
	}

	public static async resolveUrl(
		config: MongoConnectionConfig | undefined,
		resolveSecret: MongoSecretResolver,
		sessionLabel = 'default',
		emulatorHost = process.env.MONGODB_EMULATOR_HOST,
	): Promise<string> {
		if (emulatorHost)
			return emulatorHost.includes('://') ? emulatorHost : `mongodb://${emulatorHost}/?directConnection=true`;

		if (config?.mongoUrlSecret) {
			const url = (await resolveSecret(config.mongoUrlSecret)).trim();
			if (!url)
				throw new ImplementationMissingException(`Missing MongoDB url secret '${config.mongoUrlSecret}'`);

			return url;
		}

		if (config?.mongoUrl)
			return composeUrl(config.mongoUrl, config.params);

		if (config?.firestoreMongo)
			return buildFirestoreMongoUrl(config.firestoreMongo, config.params);

		throw new ImplementationMissingException(
			`No MongoDB connection configured for session '${sessionLabel}'. ` +
			'Set mongo.mongoUrlSecret, mongo.mongoUrl, or mongo.firestoreMongo in ModuleBE_Firebase config (default), or in auth config (keyed).');
	}
}
