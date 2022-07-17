/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {DB_Object, Module} from '@nu-art/ts-common';
import {DBIndex} from '../../shared/types';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

type Config = {}

export type DBConfig<T extends DB_Object, Ks extends keyof T> = {
	name: string
	version?: number
	autoIncrement?: boolean,
	uniqueKeys: Ks[]
	indices?: DBIndex<T>[]
	upgradeProcessor?: (db: IDBDatabase) => void
};

export type IndexKeys<T extends DB_Object, Ks extends keyof T> = { [K in Ks]: T[K] };

export type IndexDb_Query = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};

export class IndexedDB<T extends DB_Object, Ks extends keyof T> {
	private db!: IDBDatabase;
	private config: DBConfig<T, Ks>;

	constructor(config: DBConfig<T, Ks>) {
		this.config = {
			...config,
			upgradeProcessor: (db: IDBDatabase) => {
				if (!db.objectStoreNames.contains(this.config.name)) {
					const store = db.createObjectStore(this.config.name, {autoIncrement: config.autoIncrement, keyPath: config.uniqueKeys as unknown as string[]});
					this.config.indices?.forEach(index => store.createIndex(index.id, index.keys as string | string[], {
						multiEntry: index.params?.multiEntry,
						unique: index.params?.unique
					}));
				}

				config.upgradeProcessor?.(db);
			},
			autoIncrement: config.autoIncrement || false,
			version: config.version || 1
		};
	}

	open(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			const request = IDBAPI.open(this.config.name);
			request.onupgradeneeded = () => {
				const db = request.result;
				this.config.upgradeProcessor?.(db);
			};
			request.onsuccess = (event) => {
				this.db = request.result;
				resolve(this.db);
			};
			request.onerror = (event) => {
				reject(new Error(`Error opening IDB - ${this.config.name}`));
			};
		});
	}

	public readonly store = async (write = false, store?: IDBObjectStore) => {
		if (store)
			return store;

		if (!this.db)
			await this.open();

		return this.db.transaction(this.config.name, write ? 'readwrite' : 'readonly').objectStore(this.config.name);
	};

	public async get(key: IndexKeys<T, Ks>): Promise<T | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		const request = (await this.store()).get(map);

		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error getting item from DB - ${this.config.name}`));

			request.onsuccess = () => resolve(request.result);
		});
	}

	public async query(query: IndexDb_Query): Promise<T[] | undefined> {
		const store = await this.store();

		return new Promise((resolve, reject) => {
			let request: IDBRequest;

			if (query.indexKey)
				request = store.index(query.indexKey).getAll(query.query, query.limit);

			request = store.getAll(query.query, query.limit);

			request.onsuccess = () => {
				resolve(request.result);
			};
			request.onerror = () => {
				reject(new Error(`Error querying DB - ${this.config.name}`));
			};
		});
	}

	public async queryFilter(filter: (item: T) => boolean, query?: IndexDb_Query): Promise<T[]> {
		const store = await this.store();
		return this.filterCursor(store, filter, query);
	}

	private async filterCursor(store: IDBObjectStore, filter: (item: T) => boolean, query?: IndexDb_Query) {
		const limit = query?.limit || 0;
		const matches: T[] = [];

		return new Promise<T[]>((resolve, reject) => {
			let cursorRequest: IDBRequest;

			if (query?.indexKey)
				cursorRequest = store.index(query.indexKey).openCursor();
			else
				cursorRequest = store.openCursor();

			cursorRequest.onerror = () => {
				reject(new Error(`Error opening cursor in DB - ${this.config.name}`));
			};

			cursorRequest.onsuccess = (event) => {
				const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

				//If reached the end, resolve with matches
				if (!cursor)
					return resolve(matches);

				//If value passes the filter, add it to matches
				if (filter(cursor.value))
					matches.push(cursor.value);

				//If reached search limit, resolve with matches
				if (limit > 0 && matches.length >= limit)
					return resolve(matches);

				cursor.continue();
			};
		});
	}

	public async insert(value: T, _store?: IDBObjectStore) {
		const store = await this.store(true, _store);
		const request = store.add(value);
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error inserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result);
		});
	}

	public async insertAll(values: T[], _store?: IDBObjectStore) {
		const store = await this.store(true, _store);

		for (const value of values) {
			await this.insert(value, store);
		}
	}

	public async upsert(value: T, _store?: IDBObjectStore) {
		const store = await this.store(true, _store);
		const request = store.put(value);
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error upserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result);
		});
	}

	public async upsertAll(values: T[], _store?: IDBObjectStore) {
		const store = (await this.store(true, _store));
		for (const value of values) {
			await this.upsert(value, store);
		}
	}

	public async deleteAll(): Promise<void> {
		const store = (await this.store(true));
		await store.clear();
	}

	public async delete(key: IndexKeys<T, Ks>): Promise<T | undefined> {
		const keys = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.store(true);

		return new Promise((resolve, reject) => {
			const itemRequest = store.get(keys);

			itemRequest.onerror = () => reject(new Error(`Error getting item in DB - ${this.config.name}`));

			itemRequest.onsuccess = () => {
				const deleteRequest = store.delete(keys);

				deleteRequest.onerror = () => reject(new Error(`Error deleting item in DB - ${this.config.name}`));

				deleteRequest.onsuccess = () => resolve(itemRequest.result);
			};
		});
	}
}

export class IndexedDBModule_Class
	extends Module<Config> {

	dbs: { [collection: string]: IndexedDB<any, any> } = {};

	getOrCreate<T extends DB_Object, Ks extends keyof T>(config: DBConfig<T, Ks>): IndexedDB<T, Ks> {
		return this.dbs[config.name] || (this.dbs[config.name] = new IndexedDB<T, Ks>(config));
	}
}

export const IndexedDBModule = new IndexedDBModule_Class();
