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

import {Module, ObjectTS} from '@nu-art/ts-common';
import {Cursor, DB, ObjectStore, openDb, UpgradeDB} from 'idb';

type Config = {}

export type DBConfig<T extends ObjectTS, Ks extends keyof T> = {
	name: string
	version?: number
	autoIncrement?: boolean,
	uniqueKeys: Ks[]
	indices?: { id: string, keys: keyof T | (keyof T)[], params?: { multiEntry: boolean, unique: boolean } }[]
	upgradeProcessor?: (db: UpgradeDB) => void
};

export type IndexKeys<T extends ObjectTS, Ks extends keyof T> = { [K in Ks]: T[K] };

type IndexDb_Query = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};

export class IndexedDB<T extends ObjectTS, Ks extends keyof T> {
	private db!: DB;
	private config: DBConfig<T, Ks>;


	constructor(config: DBConfig<T, Ks>) {
		this.config = {
			...config,
			upgradeProcessor: (db: UpgradeDB) => {
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

	async open() {
		this.db = await openDb(this.config.name, this.config.version, this.config.upgradeProcessor);
		return this;
	}

	public readonly store = async (write = false, store?: ObjectStore<T, Ks>) => {
		if (store)
			return store;

		if (!this.db)
			await this.open();

		return this.db.transaction(this.config.name, write ? 'readwrite' : 'readonly').objectStore<T, Ks>(this.config.name);
	};

	public async get(key: IndexKeys<T, Ks>): Promise<T | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		// @ts-ignore
		return (await this.store()).get(map);
	}

	public async query(query: IndexDb_Query): Promise<T[] | undefined> {
		const store = await this.store();
		if (query.indexKey)
			return store.index(query.indexKey).getAll(query.query, query.limit);

		return store.getAll(query.query, query.limit);
	}

	public async queryFilter(filter: (item: T) => boolean, query?: IndexDb_Query): Promise<T[]> {
		const store = await this.store();
		return this.filterCursor(store, filter, query);
	}

	private filterCursor(store: ObjectStore<T, Ks>, filter: (item: T) => boolean, query?: IndexDb_Query) {
		const limit = query?.limit || 0;
		const matches: T[] = [];

		return new Promise<T[]>((resolve, reject) => {
			const callback = (cursor?: Cursor<T, any>) => {
				if (!cursor)
					return resolve(matches);

				console.log(cursor.value);
				if (filter(cursor.value))
					matches.push(cursor.value);

				if (limit > 0 && matches.length >= limit)
					return resolve(matches);

				cursor.continue();
			};

			if (query?.indexKey)
				store.index(query.indexKey).iterateCursor(query.query|| null, callback);
			else
				store.iterateCursor(query?.query || null, callback);
		});
	}

	public async insert(value: T, _store?: ObjectStore<T, Ks>) {
		return (await this.store(true, _store)).add(value);
	}

	public async insertAll(values: T[], _store?: ObjectStore<T, Ks>) {
		const store = (await this.store(true, _store));
		const result = [];
		for (const value of values) {
			result.push(await this.insert(value, store));
		}
	}

	public async upsert(value: T, _store?: ObjectStore<T, Ks>) {
		return (await this.store(true, _store)).put(value);
	}

	public async upsertAll(values: T[], _store?: ObjectStore<T, Ks>) {
		const store = (await this.store(true, _store));
		const result = [];
		for (const value of values) {
			result.push(await this.upsert(value, store));
		}
		return result;
	}

	public async delete(key: IndexKeys<T, Ks>): Promise<T | undefined> {
		const keys = this.config.uniqueKeys.map(k => key[k]);
		const store = (await this.store(true));
		// @ts-ignore
		const item = await store.get(keys);
		await store.delete(keys);
		return item;
	}
}

export class IndexedDBModule_Class
	extends Module<Config> {

	dbs: { [collection: string]: IndexedDB<any, any> } = {};

	getOrCreate<T extends ObjectTS, Ks extends keyof T>(config: DBConfig<T, Ks>): IndexedDB<T, Ks> {
		return this.dbs[config.name] || (this.dbs[config.name] = new IndexedDB<T, Ks>(config));
	}
}

export const IndexedDBModule = new IndexedDBModule_Class();
