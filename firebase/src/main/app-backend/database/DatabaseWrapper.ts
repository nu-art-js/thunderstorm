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

// import {FirestoreCollection} from "./FirestoreCollection";
import {
	FirebaseListener,
	Firebase_DataSnapshot,
	Firebase_DB
} from "./types";
import {
	BadImplementationException,
	calculateJsonSizeMb,
	ObjectTS
} from "@nu-art/ts-common";
import {FirebaseSession} from "../auth/firebase-session";
import {FirebaseBaseWrapper} from "../auth/FirebaseBaseWrapper";
import { getDatabase } from 'firebase-admin/database'
import {DataSnapshot} from "@firebase/database-types";

export class DatabaseWrapper
	extends FirebaseBaseWrapper {

	private readonly database: Firebase_DB;

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.database = getDatabase(firebaseSession.app)
	}

	public async get<T>(path: string, defaultValue?: T): Promise<T | undefined> {
		const snapshot = await this.database.ref(path).once("value");
		let toRet = defaultValue;
		if (snapshot)
			toRet = snapshot.val() as (T | undefined);

		if (!toRet)
			toRet = defaultValue;

		return toRet;
	}

	public listen<T>(path: string, callback: (value: T | undefined) => void): FirebaseListener {
		try {
			return this.database.ref(path).on("value", (snapshot: Firebase_DataSnapshot) => callback(snapshot ? snapshot.val() : undefined));
		} catch (e) {
			throw new BadImplementationException(`Error while getting value from path: ${path}`, e);
		}
	}

	public stopListening<T>(path: string, listener: FirebaseListener): void {
		try {
			this.database.ref(path).off("value", listener);
		} catch (e) {
			throw new BadImplementationException(`Error while getting value from path: ${path}`, e);
		}
	}

	public async set<T>(path: string, value: T) {
		try {
			return await this.database.ref(path).set(value);
		} catch (e) {
			throw new BadImplementationException(`Error while setting value to path: ${path}`, e);
		}
	}

	public async uploadByChunks(parentPath: string, data: ObjectTS, maxSizeMB: number = 3, itemsToRef: Promise<any>[] = []) {
		for (const key in data) {
			const node = `${parentPath}/${key}`;
			if (calculateJsonSizeMb(data[key]) < maxSizeMB)
				await this.set(node, data[key]);
			else
				await this.uploadByChunks(node, data[key], maxSizeMB, itemsToRef);
		}
	};

	public async update<T>(path: string, value: T) {
		this.logWarning("update will be deprecated!! please use patch");
		return this.patch(path, value);
	}

	public async patch<T>(path: string, value: T) {
		try {
			return await this.database.ref(path).update(value);
		} catch (e) {
			this.logError(e);
			throw new BadImplementationException(`Error while updating value to path: ${path}`, e);
		}
	}

	public async remove<T>(path: string, assertionRegexp: string = "^/.*?/.*") {
		this.logWarning("remove will be deprecated!! please use delete");
		return this.delete(path, assertionRegexp);
	}

	public async delete<T>(path: string, assertionRegexp: string = "^/.*?/.*"): Promise<T | undefined> {
		if (!path)
			throw new BadImplementationException(`Falsy value, path: '${path}'`);

		if (!path.match(new RegExp(assertionRegexp)))
			throw new BadImplementationException(`path: '${path}'  does not match assertion: '${assertionRegexp}'`);

		try {
			return new Promise<T>(async (resolve,reject) => {
				let val: T;
				await this.database.ref(path).transaction(
					(a: any) => {
						val = a;
						return null;
					},
					(a: Error | null, b: boolean, c: DataSnapshot | null) => {
						resolve(val)
					}
				)
				reject()
			})
		} catch (e) {
			throw new BadImplementationException(`Error while removing path: ${path}`, e);
		}
	}
}
