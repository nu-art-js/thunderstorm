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

import {DB_Object, MUSTNeverHappenException, StaticLogger} from '@nu-art/ts-common';
import {DBIndex} from '../../shared/types';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export type ReduceFunction<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

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

	private static dbs: { [collection: string]: IndexedDB<any, any> } = {};

	static getOrCreate<T extends DB_Object, Ks extends keyof T>(config: DBConfig<T, Ks>): IndexedDB<T, Ks> {
		return this.dbs[config.name] || (this.dbs[config.name] = new IndexedDB<T, Ks>(config));
	}

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

	async open(): Promise<IDBDatabase> {
		return new Promise((resolve, reject) => {
			if (!IDBAPI)
				reject(new Error('Error - current browser does not support IndexedDB'));

			const request = IDBAPI.open(this.config.name);
			request.onupgradeneeded = () => {
				const db = request.result;
				this.config.upgradeProcessor?.(db);
			};

			request.onsuccess = (event) => {
				// console.log(`${this.config.name} - IDB result`, request.result);
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

	private getCursor = async (query?: IndexDb_Query): Promise<IDBRequest<IDBCursorWithValue | null>> => {
		const store = await this.store();

		let cursorRequest: IDBRequest<IDBCursorWithValue | null>;

		if (query?.indexKey) {
			const idbIndex = store.index(query.indexKey);
			if (!idbIndex) throw new MUSTNeverHappenException('Could not find index for the given indexKey');
			cursorRequest = idbIndex.openCursor();
		} else
			cursorRequest = store.openCursor();

		return cursorRequest;
	};

	private cursorHandler = (cursorRequest: IDBRequest<IDBCursorWithValue | null>, perValueCallback: (value: T) => void,
													 endCallback: () => void, limiterCallback?: () => boolean) => {
		cursorRequest.onsuccess = (event) => {
			const cursor: IDBCursorWithValue = (event.target as IDBRequest).result;

			//If reached the end or reached limit, call endCallback
			if (!cursor || limiterCallback?.())
				return endCallback();

			//run value through the value callback
			perValueCallback(cursor.value);

			//Continue to next value
			cursor.continue();
		};
	};

	// ######################### Data insertion functions #########################

	public async insert(value: T, _store?: IDBObjectStore): Promise<T> {
		const store = await this.store(true, _store);
		const request = store.add(value);
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error inserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result as unknown as T);
		});
	}

	public async insertAll(values: T[], _store?: IDBObjectStore) {
		const store = await this.store(true, _store);

		for (const value of values) {
			await this.insert(value, store);
		}
	}

	public async upsert(value: T, _store?: IDBObjectStore): Promise<T> {
		const store = await this.store(true, _store);
		try {
			const request = store.put(value);
			return new Promise((resolve, reject) => {
				request.onerror = () => reject(new Error(`Error upserting item in DB - ${this.config.name}`));
				request.onsuccess = () => resolve(request.result as unknown as T);
			});
		} catch (e: any) {
			StaticLogger.logError('trying to upsert: ', value);
			throw e;
		}
	}

	public async upsertAll(values: T[], _store?: IDBObjectStore) {
		const store = (await this.store(true, _store));
		for (const value of values) {
			await this.upsert(value, store);
		}
	}

	// ######################### Data collection functions #########################

	public async get(key: IndexKeys<T, Ks>): Promise<T | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		const request = (await this.store()).get(map as IDBValidKey);

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
			else
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
		const limit = query?.limit || 0;
		const cursorRequest = await this.getCursor(query);
		const matches: T[] = [];

		return new Promise<T[]>((resolve, reject) => {
			this.cursorHandler(cursorRequest,
				(value) => {
					if (filter(value))
						matches.push(value);
				},
				() => resolve(matches),
				() => limit > 0 && matches.length >= limit
			);
		});
	}

	public async WIP_queryMapNew<Type>(mapper: (item: T) => Type, filter?: (item: T) => boolean, query?: IndexDb_Query): Promise<Type[]> {
		const limit = query?.limit || 0;
		const cursorRequest = await this.getCursor(query);
		const matches: Type[] = [];

		return new Promise<Type[]>((resolve, reject) => {
			this.cursorHandler(cursorRequest,
				(item) => {
					if (filter ? filter(item) : true)
						matches.push(mapper(item));
				},
				() => resolve(matches),
				() => limit > 0 && matches.length >= limit
			);
		});
	}

	public async WIP_queryMap<Type>(mapper: (item: T) => Type, filter?: (item: T) => boolean, query?: IndexDb_Query): Promise<Type[]> {
		const limit = query?.limit || 0;
		const cursorRequest = await this.getCursor(query);
		const matches: Type[] = [];

		return new Promise<Type[]>((resolve, reject) => {
			this.cursorHandler(cursorRequest,
				(item) => {
					if (filter ? filter(item) : true)
						matches.push(mapper(item));
				},
				() => resolve(matches),
				() => limit > 0 && matches.length >= limit
			);
		});
	}

	public async queryFind(filter: (item: T) => boolean): Promise<T | undefined> {
		let match: T | undefined = undefined;
		const cursorRequest = await this.getCursor();

		return new Promise<T | undefined>((resolve, reject) => {
			this.cursorHandler(cursorRequest,
				(value) => {
					if (filter(value))
						match = value;
				},
				() => resolve(match),
				() => !!match
			);
		});
	}

	public async queryReduce<ReturnType>(reducer: ReduceFunction<T, ReturnType>, initialValue: ReturnType, filter?: (item: T) => boolean, query?: IndexDb_Query) {
		let acc = initialValue;
		const alwaysTrue = () => true;
		const _filter = filter || alwaysTrue;
		const matches: T[] = await this.queryFilter(_filter, query);

		return new Promise<ReturnType>((resolve, reject) => {
			matches.forEach((item, index) => acc = reducer(acc, item, index, matches));
			resolve(acc);
		});
	}

	// ######################### Data deletion functions #########################

	public async clearDB(): Promise<void> {
		const store = (await this.store(true));
		await store.clear();
	}

	public async deleteDB(): Promise<void> {
		if (this.db)
			this.db.close();
		const DBDeleteRequest = await IDBAPI.deleteDatabase(this.db.name);
		DBDeleteRequest.onerror = (event) => {
			StaticLogger.logError(`Error deleting database: ${this.db.name}`);
		};
	}

	public async deleteAll(keys: (IndexKeys<T, Ks> | T)[]): Promise<T[]> {
		return await Promise.all(keys.map(key => this.delete(key)));
	}

	public async delete(key: (IndexKeys<T, Ks> | T)): Promise<T> {
		const keys = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.store(true);

		return new Promise((resolve, reject) => {
			const itemRequest = store.get(keys as IDBValidKey);

			itemRequest.onerror = () => reject(new Error(`Error getting item in DB - ${this.config.name}`));

			itemRequest.onsuccess = () => {
				// @ts-ignore
				if (key.__updated !== undefined && itemRequest.result?.__updated > key.__updated) {
					// @ts-ignore
					// console.log(`will not delete item ${itemRequest.result?.__updated} >= ${key.__updated}`);
					return resolve(itemRequest.result);
				}

				const deleteRequest = store.delete(keys as IDBValidKey);

				deleteRequest.onerror = () => reject(new Error(`Error deleting item in DB - ${this.config.name}`));

				deleteRequest.onsuccess = () => resolve(itemRequest.result);
			};
		});
	}
}

