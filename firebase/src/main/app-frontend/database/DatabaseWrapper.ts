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

import {
	BadImplementationException,
	Logger
} from "@nu-art/ts-common";
import {FirebaseType_DB} from "./types";
// tslint:disable:no-import-side-effect
import {
	onValue,
	ref,
	remove,
	set,
	update
} from "firebase/database";

export class DatabaseWrapper
	extends Logger {

	private readonly database: FirebaseType_DB;

	constructor(database: FirebaseType_DB) {
		super();
		this.database = database;
	}


	public async get<T>(path: string): Promise<T | null> {
		return new Promise<T | null>(async (resolve, reject) => {
			onValue(this.getRef(path), snapshot => {
				resolve(snapshot.val() as T);
			}, (error: Error) => {
				reject(error);
			}, {onlyOnce: true});
		});
	}

	public listen<T>(path: string, callback: (value: T) => void) {
		onValue(this.getRef(path), snapshot => {
			callback(!snapshot || snapshot.val());
		}, (error: Error) => {
			throw new BadImplementationException(`Error while getting value from path: ${path}`, error);
		}, {onlyOnce: true});
	}

	private getRef = (path: string) => ref(this.database, path);

	public async set<T>(path: string, value: T) {
		try {
			await set(this.getRef(path), value);
		} catch (e) {
			throw new BadImplementationException(`Error while setting value to path: ${path}`);
		}
	}

	/** @deprecated */
	public async update<T extends object>(path: string, value: T) {
		this.logWarning("update will be deprecated!! please use patch");
		return this.patch(path, value);
	}

	public async patch<T extends object>(path: string, value: T) {
		try {
			await update(this.getRef(path), value);
		} catch (e) {
			throw new BadImplementationException(`Error while updating value to path: ${path}`);
		}
	}

	/** @deprecated */
	public async remove<T>(path: string, assertionRegexp: string = "^/.*?/.*") {
		this.logWarning("remove will be deprecated!! please use delete");
		return this.delete(path, assertionRegexp);
	}

	public async delete<T>(path: string, assertionRegexp: string = "^/.*?/.*") {
		if (!path)
			throw new BadImplementationException(`Falsy value, path: '${path}'`);

		if (!path.match(new RegExp(assertionRegexp)))
			throw new BadImplementationException(`path: '${path}'  does not match assertion: '${assertionRegexp}'`);

		try {
			await remove(this.getRef(path));
		} catch (e) {
			throw new BadImplementationException(`Error while removing path: ${path}`);
		}
	}
}