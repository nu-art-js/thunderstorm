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

import {DBIndex, DBProto, IndexKeys, MUSTNeverHappenException, StaticLogger} from '@nu-art/ts-common';

//@ts-ignore - set IDBAPI as indexedDB regardless of browser
const IDBAPI = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

export type ReduceFunction_V3<ItemType, ReturnType> = (
	accumulator: ReturnType,
	arrayItem: ItemType,
	index?: number,
	array?: ItemType[]
) => ReturnType

export type DBConfigV3<Proto extends DBProto<any>> = {
	name: string
	group: string;
	version?: number
	autoIncrement?: boolean,
	uniqueKeys: (keyof Proto['dbType'])[]
	indices?: DBIndex<Proto['dbType']>[]
	upgradeProcessor?: (db: IDBDatabase) => void
};

export type IndexDb_Query_V3 = {
	query?: string | number | string[] | number[],
	indexKey?: string,
	limit?: number
};

export class IndexedDBV3<Proto extends DBProto<any>> {
	private db!: IDBDatabase;
	private config: DBConfigV3<Proto>;

	private static dbs: { [collection: string]: IndexedDBV3<any> } = {};

	static getOrCreate<Proto extends DBProto<any>>(config: DBConfigV3<Proto>): IndexedDBV3<Proto> {
		return this.dbs[config.name] || (this.dbs[config.name] = new IndexedDBV3<Proto>(config));
	}

	constructor(config: DBConfigV3<Proto>) {
		this.config = {
			...config,
			upgradeProcessor: (db: IDBDatabase) => {
				if (!db.objectStoreNames.contains(this.config.name)) {
					const store = db.createObjectStore(this.config.name, {
						autoIncrement: config.autoIncrement,
						keyPath: config.uniqueKeys as unknown as string[]
					});
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

	async exists() {
		return (await window.indexedDB.databases()).find(db => db.name === this.config.name);
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

			request.onsuccess = () => {
				// console.log(`${this.config.name} - IDB result`, request.result);
				this.db = request.result;
				resolve(this.db);
			};

			request.onerror = () => {
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

	private getCursor = async (query?: IndexDb_Query_V3): Promise<IDBRequest<IDBCursorWithValue | null>> => {
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

	private cursorHandler = (cursorRequest: IDBRequest<IDBCursorWithValue | null>, perValueCallback: (value: Proto['dbType']) => void,
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

	public async insert(value: Proto['dbType'], _store?: IDBObjectStore): Promise<Proto['dbType']> {
		const store = await this.store(true, _store);
		const request = store.add(value);
		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error inserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result as unknown as Proto['dbType']);
		});
	}

	public async insertAll(values: Proto['dbType'][], _store?: IDBObjectStore) {
		const store = await this.store(true, _store);

		for (const value of values) {
			await this.insert(value, store);
		}
	}

	public async upsert(value: Proto['dbType'], _store?: IDBObjectStore): Promise<Proto['dbType']> {
		const store = await this.store(true, _store);
		try {
			const request = store.put(value);
			return new Promise((resolve, reject) => {
				request.onerror = () => reject(new Error(`Error upserting item in DB - ${this.config.name}`));
				request.onsuccess = () => resolve(request.result as unknown as Proto['dbType']);
			});
		} catch (e: any) {
			StaticLogger.logError('trying to upsert: ', value);
			throw e;
		}
	}

	public async upsertAll(values: Proto['dbType'][], _store?: IDBObjectStore) {
		const store = (await this.store(true, _store));
		for (const value of values) {
			await this.upsert(value, store);
		}
	}

	// ######################### Data collection functions #########################

	public async get(key: IndexKeys<Proto['dbType'], keyof Proto['dbType']>): Promise<Proto['dbType'] | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		const request = (await this.store()).get(map as IDBValidKey);

		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error getting item from DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result);
		});
	}

	public async query(query: IndexDb_Query_V3): Promise<Proto['dbType'][] | undefined> {
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

	public async queryFilter(filter: (item: Proto['dbType']) => boolean, query?: IndexDb_Query_V3): Promise<Proto['dbType'][]> {
		const limit = query?.limit || 0;
		const cursorRequest = await this.getCursor(query);
		const matches: Proto['dbType'][] = [];

		return new Promise<Proto['dbType'][]>((resolve, reject) => {
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

	public async WIP_queryMapNew<Type>(mapper: (item: Proto['dbType']) => Type, filter?: (item: Proto['dbType']) => boolean, query?: IndexDb_Query_V3): Promise<Type[]> {
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

	public async WIP_queryMap<Type>(mapper: (item: Proto['dbType']) => Type, filter?: (item: Proto['dbType']) => boolean, query?: IndexDb_Query_V3): Promise<Type[]> {
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

	public async queryFind(filter: (item: Proto['dbType']) => boolean): Promise<Proto['dbType'] | undefined> {
		let match: Proto['dbType'] | undefined = undefined;
		const cursorRequest = await this.getCursor();

		return new Promise<Proto['dbType'] | undefined>((resolve, reject) => {
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

	public async queryReduce<ReturnType>(reducer: ReduceFunction_V3<Proto['dbType'], ReturnType>, initialValue: ReturnType, filter?: (item: Proto['dbType']) => boolean, query?: IndexDb_Query_V3) {
		let acc = initialValue;
		const alwaysTrue = () => true;
		const _filter = filter || alwaysTrue;
		const matches: Proto['dbType'][] = await this.queryFilter(_filter, query);

		return new Promise<ReturnType>((resolve, reject) => {
			matches.forEach((item, index) => acc = reducer(acc, item, index, matches));
			resolve(acc);
		});
	}

	// ######################### Data deletion functions #########################

	public async clearDB(): Promise<void> {
		const store = await this.store(true);
		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = reject;
		});
	}

	public async deleteDB(): Promise<void> {
		if (this.db)
			this.db.close();

		return new Promise((resolve, reject) => {
			const request = IDBAPI.deleteDatabase(this.db.name);
			request.onerror = (event) => {
				StaticLogger.logError(`Error deleting database: ${this.db.name}`);
				reject();
			};
			request.onsuccess = () => resolve();
		});
	}

	public async deleteAll(keys: (IndexKeys<Proto['dbType'], keyof Proto['dbType']> | Proto['dbType'])[]): Promise<Proto['dbType'][]> {
		return await Promise.all(keys.map(key => this.delete(key)));
	}

	public async delete(key: (IndexKeys<Proto['dbType'], keyof Proto['dbType']> | Proto['dbType'])): Promise<Proto['dbType']> {
		const keys = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.store(true);

		return new Promise((resolve, reject) => {
			const itemRequest = store.get(keys as IDBValidKey);

			itemRequest.onerror = () => reject(new Error(`Error getting item in DB - ${this.config.name}`));

			itemRequest.onsuccess = () => {
				// @ts-ignore
				if (key.__updated !== undefined && itemRequest.result?.__updated > key.__updated) {
					return resolve(itemRequest.result);
				}

				const deleteRequest = store.delete(keys as IDBValidKey);

				deleteRequest.onerror = () => reject(new Error(`Error deleting item in DB - ${this.config.name}`));

				deleteRequest.onsuccess = () => resolve(itemRequest.result);
			};
		});
	}
}

