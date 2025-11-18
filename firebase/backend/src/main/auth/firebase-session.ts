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
import {Logger, TypedMap} from '@nu-art/ts-common';
import {DatabaseWrapperBE} from '../database/DatabaseWrapperBE.js';
import {StorageWrapperBE} from '../storage/StorageWrapperBE.js';
import {PushMessagesWrapperBE} from '../push/PushMessagesWrapperBE.js';
import {App} from 'firebase-admin/app';
import {FirestoreWrapperBEV3} from '../firestore-v3/FirestoreWrapperBEV3.js';
import {FirebaseConfig} from '@nu-art/firebase-shared';
import {FirestoreWrapperBE} from '../firestore/FirestoreWrapperBE.js';


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
export abstract class FirebaseSession<Config>
	extends Logger {
	app!: App;
	protected databases: TypedMap<DatabaseWrapperBE> = {};
	protected storage?: StorageWrapperBE;
	protected firestoresV3: TypedMap<FirestoreWrapperBEV3> = {};
	protected messaging?: PushMessagesWrapperBE;
	protected firestores: TypedMap<FirestoreWrapperBE> = {};


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
	public getDatabase(dbName: string = 'default'): DatabaseWrapperBE {
		if (!this.databases[dbName])
			this.databases[dbName] = new DatabaseWrapperBE(this, dbName);

		return this.databases[dbName];
	}

	/**
	 * Returns an instance of the StorageWrapperBE object, which provides access to a cloud storage service.
	 */
	public getStorage(): StorageWrapperBE {
		if (this.storage)
			return this.storage;
		return this.storage = new StorageWrapperBE(this);
	}

	/**
	 * Returns an instance of the FirestoreWrapperBE object, which provides access to the Firestore database service.
	 */
	public getFirestore(dbName: string = 'default'): FirestoreWrapperBE {
		if (!this.firestores[dbName])
			this.firestores[dbName] = new FirestoreWrapperBE(this, dbName);

		return this.firestores[dbName];
	}


	public getFirestoreV3(dbName: string = 'default'): FirestoreWrapperBEV3 {
		if (!this.firestoresV3[dbName])
			this.firestoresV3[dbName] = new FirestoreWrapperBEV3(this, dbName);

		return this.firestoresV3[dbName];
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