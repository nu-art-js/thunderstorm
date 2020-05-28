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
import {Logger} from "@nu-art/ts-common";
import {FirestoreWrapper} from "../firestore/FirestoreWrapper";
import {DatabaseWrapper} from "../database/DatabaseWrapper";
import {StorageWrapper} from "../storage/StorageWrapper";
import {PushMessagesWrapper} from "../push/PushMessagesWrapper";
import * as admin from "firebase-admin";
import {FirebaseConfig} from "../..";


export type Firebase_UserCredential = {
	config: FirebaseConfig
	credentials: {
		user: string;
		password: string;
	}
};

export type FirebaseApp = admin.app.App | firebase.app.App

export abstract class FirebaseSession<Config>
	extends Logger {
	app!: FirebaseApp;
	protected database?: DatabaseWrapper;
	protected storage?: StorageWrapper;
	protected firestore?: FirestoreWrapper;
	protected messaging?: PushMessagesWrapper;

	protected config: Config;
	protected sessionName: string;
	private readonly admin: boolean;

	protected constructor(config: Config, sessionName: string, _admin = true) {
		super(`firebase: ${sessionName}`);
		this.sessionName = sessionName;
		this.config = config;
		this.admin = _admin;
	}

	abstract getProjectId(): string;

	public isAdmin() {
		return this.admin;
	}

	public abstract connect(): void ;

	public getDatabase(): DatabaseWrapper {
		if (this.database)
			return this.database;

		return this.database = new DatabaseWrapper(this);
	}

	public getStorage(): StorageWrapper {
		if (this.storage)
			return this.storage;

		return this.storage = new StorageWrapper(this);
	}

	public getFirestore(): FirestoreWrapper {
		if (this.firestore)
			return this.firestore;

		return this.firestore = new FirestoreWrapper(this);
	}

	public getMessaging(): PushMessagesWrapper {
		if (this.messaging)
			return this.messaging;

		return this.messaging = new PushMessagesWrapper(this);
	}
}