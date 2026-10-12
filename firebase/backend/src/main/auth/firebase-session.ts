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
import {ImplementationMissingException, Logger, TypedMap} from '@nu-art/ts-common';
import {DatabaseWrapperBE} from '../database/DatabaseWrapperBE.js';
import {StorageWrapperBE} from '../storage/StorageWrapperBE.js';
import {PushMessagesWrapperBE} from '../push/PushMessagesWrapperBE.js';
import {App} from 'firebase-admin/app';
import {FirestoreWrapperBE} from '../firestore/FirestoreWrapperBE.js';
import {MongoWrapperBE} from '../firestore/MongoWrapperBE.js';
import {FirebaseConfig} from '@nu-art/firebase-shared';
import {MongoClient} from 'mongodb';
import {LazyMongoConnection} from '../LazyMongoConnection.js';


/**
 * Represents the credentials of a Firebase user.
 */
export type Firebase_UserCredential = {
	config: FirebaseConfig
	credentials: {
		user: string;
		password: string;
	}
};

// export type FirebaseApp = admin.app.App | firebase.app.App

/**
 * An abstract class that serves as a base for Firebase session classes.
 */
export type MongoUrlResolver = (authKey?: string) => string | Promise<string>;

export abstract class FirebaseSession<Config>
	extends Logger {

	private static mongoUrlResolver?: MongoUrlResolver;

	static setMongoUrlResolver(resolver: MongoUrlResolver) {
		FirebaseSession.mongoUrlResolver = resolver;
	}

	app!: App;
	protected databases: TypedMap<DatabaseWrapperBE> = {};
	protected storage?: StorageWrapperBE;
	protected firestores: TypedMap<FirestoreWrapperBE> = {};
	protected mongos: TypedMap<MongoWrapperBE> = {};
	protected mongoClient?: MongoClient;
	private mongoLazy?: LazyMongoConnection<MongoClient>;
	protected messaging?: PushMessagesWrapperBE;


	protected config: Config;
	protected firebaseAppName: string;
	private readonly admin: boolean;

	/**
	 * Initializes a new instance of the FirebaseSession class.
	 * @param config The configuration settings for the Firebase session.
	 * @param sessionName The name of the Firebase session.
	 * @param _admin A value indicating whether the session is an admin session.
	 */
	protected constructor(config: Config, sessionName: string, _admin = true) {
		super(`firebase: ${sessionName}`);
		this.firebaseAppName = sessionName;
		this.config = config;
		this.admin = _admin;
	}

	public isAdmin() {
		return this.admin;
	}

	public abstract connect(): void ;

	/**
	 * Returns an instance of the DatabaseWrapperBE object, which provides access to a database.
	 */
	public getDatabase(dbName?: string): DatabaseWrapperBE {
		if (!this.databases[dbName ?? 'default'])
			this.databases[dbName ?? 'default'] = new DatabaseWrapperBE(this, dbName);

		return this.databases[dbName ?? 'default'];
	}

	/**
	 * Returns an instance of the StorageWrapperBE object, which provides access to a cloud storage service.
	 */
	public getStorage(): StorageWrapperBE {
		if (this.storage)
			return this.storage;
		return this.storage = new StorageWrapperBE(this);
	}

	public getFirestore(dbName?: string): FirestoreWrapperBE {
		if (!this.firestores[dbName ?? 'default'])
			this.firestores[dbName ?? 'default'] = new FirestoreWrapperBE(this, dbName);

		return this.firestores[dbName ?? 'default'];
	}

	public setMongoClient(client: MongoClient) {
		this.mongoLazy = undefined;
		this.mongoClient = client;
	}

	/**
	 * Closes the session MongoClient and drops wrapper caches.
	 * Required for test teardown — an open client keeps the Node event loop alive,
	 * so mocha never exits and `firebase emulators:exec` hangs after the suite.
	 */
	public async closeMongo(): Promise<void> {
		const lazy = this.mongoLazy;
		this.mongoLazy = undefined;
		let client = this.mongoClient;
		this.mongoClient = undefined;
		for (const key of Object.keys(this.mongos))
			delete this.mongos[key];

		if (!client && lazy) {
			try {
				client = await lazy.get();
			} catch (e: unknown) {
				const name = e instanceof Error ? e.name : 'Error';
				this.logWarning(`MongoDB connection failed before close — ${name}`);
			}
		}

		if (!client)
			return;

		try {
			await client.close();
		} catch (e: unknown) {
			const name = e instanceof Error ? e.name : 'Error';
			this.logWarning(`Error closing MongoDB client — ${name}`);
		}
	}

	public async reconnectMongo(): Promise<void> {
		if (!this.mongoClient && !this.mongoLazy)
			return;

		this.logWarning('Reconnecting MongoDB — closing existing client');
		await this.closeMongo();
	}

	public getMongo(dbName: string): MongoWrapperBE {
		if (!this.mongos[dbName]) {
			this.mongos[dbName] = new MongoWrapperBE(() => this.getMongoClient(), dbName);
			void this.getMongoClient().catch((err: unknown) => {
				const name = err instanceof Error ? err.name : 'Error';
				this.logError(`MongoDB connection failed — ${name}`);
			});
		}

		return this.mongos[dbName];
	}

	/** Shared lazy connect. Concurrent callers await one in-flight client. Failures clear the cache. */
	public getMongoClient(): Promise<MongoClient> {
		if (this.mongoClient)
			return Promise.resolve(this.mongoClient);

		const lazy = this.mongoConnection();
		return lazy.get().then(client => {
			if (this.mongoLazy === lazy)
				this.mongoClient = client;

			return client;
		});
	}

	private mongoConnection(): LazyMongoConnection<MongoClient> {
		if (!this.mongoLazy)
			this.mongoLazy = new LazyMongoConnection(() => this.resolveMongoUrl(), url => this.createMongoClient(url));

		return this.mongoLazy;
	}

	private async resolveMongoUrl(): Promise<string> {
		if (!FirebaseSession.mongoUrlResolver)
			throw new ImplementationMissingException('MongoUrlResolver not set — call FirebaseSession.setMongoUrlResolver() during module init');

		return FirebaseSession.mongoUrlResolver(this.firebaseAppName);
	}

	private createMongoClient(url: string): MongoClient {
		const client = new MongoClient(url, {monitorCommands: true, serverMonitoringMode: 'poll'});
		this.watchClient(client);
		this.logInfo('Creating MongoClient');
		return client;
	}

	private watchClient(client: MongoClient): void {
			// --- Command monitoring ---
			client.on('commandStarted', (event) => {
				this.logDebug(`MongoDB >>> [${event.commandName}] reqId=${event.requestId} ns=${event.databaseName}.${(event.command as Record<string, unknown>)[event.commandName]}`);
			});

			client.on('commandFailed', (event) => {
				this.logError(`MongoDB commandFailed [${event.commandName}] reqId=${event.requestId}: ${event.failure.message}`);
			});

			client.on('commandSucceeded', (event) => {
				const reply = event.reply as Record<string, unknown>;
				if (event.commandName === 'find' && !reply?.cursor) {
					this.logError(`MongoDB <<< [${event.commandName}] reqId=${event.requestId} MISSING CURSOR — reply=${JSON.stringify(reply)}`);
				} else {
					this.logDebug(`MongoDB <<< [${event.commandName}] reqId=${event.requestId} ok=${reply?.ok} ${event.duration}ms`);
				}
			});

			// --- Server heartbeat monitoring ---
			client.on('serverHeartbeatSucceeded', (event) => {
				this.logDebug(`MongoDB heartbeat OK: ${event.connectionId} duration=${event.duration}ms`);
			});

			client.on('serverHeartbeatFailed', (event) => {
				this.logError(`MongoDB HEARTBEAT FAILED: ${event.connectionId} duration=${event.duration}ms failure=${event.failure?.message}`);
			});

			// --- Topology monitoring ---
			client.on('topologyDescriptionChanged', (event) => {
				const prev = event.previousDescription.type;
				const next = event.newDescription.type;
				const servers = Array.from(event.newDescription.servers.entries())
					.map(([addr, desc]: [string, any]) => `${addr}(${desc.type})`).join(', ');
				if (prev !== next) {
					this.logWarning(`MongoDB TOPOLOGY CHANGED: ${prev} → ${next} servers=[${servers}]`);
				} else {
					this.logDebug(`MongoDB topology update: ${next} servers=[${servers}]`);
				}
			});

			client.on('serverDescriptionChanged', (event) => {
				const prev = event.previousDescription.type;
				const next = event.newDescription.type;
				if (prev !== next) {
					this.logWarning(`MongoDB SERVER STATE CHANGED: ${event.address} ${prev} → ${next}`);
				}
			});

			client.on('serverClosed', (event) => {
				this.logError(`MongoDB SERVER CLOSED: ${event.address}`);
			});

			client.on('topologyClosed', () => {
				this.logError(`MongoDB TOPOLOGY CLOSED — all connections lost`);
			});

			// --- Connection pool monitoring ---
			client.on('connectionPoolCleared', (event) => {
				this.logWarning(`MongoDB POOL CLEARED: ${event.address}`);
			});

			client.on('connectionPoolClosed', (event) => {
				this.logError(`MongoDB POOL CLOSED: ${event.address}`);
			});

			client.on('connectionClosed', (event) => {
				this.logDebug(`MongoDB connection closed: ${event.address} connId=${event.connectionId} reason=${event.reason}`);
			});

			client.on('connectionCheckOutFailed', (event) => {
				this.logError(`MongoDB CONNECTION CHECKOUT FAILED: ${event.address} reason=${event.reason}`);
			});
	}

	/**
	 * Returns an instance of the PushMessagesWrapperBE object, which provides access to push messaging services.
	 */
	public getMessaging(): PushMessagesWrapperBE {
		if (this.messaging)
			return this.messaging;
		return this.messaging = new PushMessagesWrapperBE(this);
	}
}