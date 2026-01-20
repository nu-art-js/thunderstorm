/*
 * @nu-art/idb-frontend - IndexedDB infrastructure for frontend applications
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger, MUSTNeverHappenException} from '@nu-art/ts-common';
import {DBConfig, IndexDb_Query, IndexKeys, ReduceFunction} from '@nu-art/idb-shared';


type StoreResolver<ItemType extends object> = (dbConfig: DBConfig<ItemType>, write?: boolean, store?: IDBObjectStore) => Promise<IDBObjectStore>;
type StoreExistsResolver<ItemType extends object> = (dbConfig: DBConfig<ItemType>) => Promise<boolean>;

export class IndexedDB_Store<ItemType extends object>
	extends Logger {

	private config: DBConfig<ItemType>;
	private storeResolver: StoreResolver<ItemType>;
	private storeExistsResolver: StoreExistsResolver<ItemType>;

	// ######################## Init ########################

	constructor(config: DBConfig<ItemType>, storeResolver: StoreResolver<ItemType>, storeExistsResolver: StoreExistsResolver<ItemType>) {
		super(`IDB_Store-${config.group}`);
		this.storeResolver = storeResolver;
		this.storeExistsResolver = storeExistsResolver;
		this.config = {
			...config,
			autoIncrement: config.autoIncrement || false,
			version: config.version
		};
	}

	// ######################## DB Interaction ########################

	getStore = async (write = false, store?: IDBObjectStore) => this.storeResolver(this.config, write, store);

	exists = async () => this.storeExistsResolver(this.config);

	count = async (): Promise<number> => {
		const store = await this.getStore();

		return await new Promise((resolve, reject) => {
			const countRequest = store.count();

			countRequest.onsuccess = () => {
				resolve(countRequest.result);
			};

			countRequest.onerror = () => {
				this.logError(`Failed getting count of idb store ${this.config.name}`);
				resolve(-1);
			};
		});
	};

	// ######################## Cursor Interaction ########################

	private getCursor = async (query?: IndexDb_Query): Promise<IDBRequest<IDBCursorWithValue | null>> => {
		const store = await this.getStore();

		let cursorRequest: IDBRequest<IDBCursorWithValue | null>;

		if (query?.indexKey) {
			const idbIndex = store.index(query.indexKey);
			if (!idbIndex) throw new MUSTNeverHappenException('Could not find index for the given indexKey');
			cursorRequest = idbIndex.openCursor();
		} else
			cursorRequest = store.openCursor();

		return cursorRequest;
	};

	private cursorHandler = (cursorRequest: IDBRequest<IDBCursorWithValue | null>, perValueCallback: (value: ItemType) => void,
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

	public async insert(value: ItemType, _store?: IDBObjectStore): Promise<ItemType> {
		const store = await this.getStore(true, _store);
		return new Promise((resolve, reject) => {
			const request = store.add(value);
			request.onerror = () => reject(new Error(`Error inserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result as unknown as ItemType);
		});
	}

	public async insertAll(values: ItemType[], _store?: IDBObjectStore) {
		const store = await this.getStore(true, _store);

		for (const value of values) {
			await this.insert(value, store);
		}
	}

	public async upsert(value: ItemType, _store?: IDBObjectStore): Promise<ItemType> {
		const store = await this.getStore(true, _store);
		try {
			const request = store.put(value);
			return new Promise((resolve, reject) => {
				request.onerror = () => reject(new Error(`Error upserting item in DB - ${this.config.name}`));
				request.onsuccess = () => resolve(request.result as unknown as ItemType);
			});
		} catch (e: any) {
			this.logError('trying to upsert: ', value);
			throw e;
		}
	}

	public async upsertAll(values: ItemType[], _store?: IDBObjectStore) {
		const store = await this.getStore(true, _store);
		for (const value of values) {
			await this.upsert(value, store);
		}
	}

	// ######################### Data collection functions #########################

	public async get(key: IndexKeys<ItemType, keyof ItemType>): Promise<ItemType | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		const request = (await this.getStore()).get(map as IDBValidKey);

		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error getting item from DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result);
		});
	}

	public async query(query: IndexDb_Query): Promise<ItemType[] | undefined> {
		const store = await this.getStore();

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

	public async queryFilter(filter: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<ItemType[]> {
		const limit = query?.limit || 0;
		const cursorRequest = await this.getCursor(query);
		const matches: ItemType[] = [];

		return new Promise<ItemType[]>((resolve, reject) => {
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

	public async WIP_queryMapNew<Type>(mapper: (item: ItemType) => Type, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<Type[]> {
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

	public async WIP_queryMap<Type>(mapper: (item: ItemType) => Type, filter?: (item: ItemType) => boolean, query?: IndexDb_Query): Promise<Type[]> {
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

	public async queryFind(filter: (item: ItemType) => boolean): Promise<ItemType | undefined> {
		let match: ItemType | undefined = undefined;
		const cursorRequest = await this.getCursor();

		return new Promise<ItemType | undefined>((resolve, reject) => {
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

	public async queryReduce<ReturnType>(reducer: ReduceFunction<ItemType, ReturnType>, initialValue: ReturnType, filter?: (item: ItemType) => boolean, query?: IndexDb_Query) {
		let acc = initialValue;
		const alwaysTrue = () => true;
		const _filter = filter || alwaysTrue;
		const matches: ItemType[] = await this.queryFilter(_filter, query);

		return new Promise<ReturnType>((resolve, reject) => {
			matches.forEach((item, index) => acc = reducer(acc, item, index, matches));
			resolve(acc);
		});
	}

	// ######################### Data deletion functions #########################

	public async clearStore(): Promise<void> {
		if (!(await this.exists()))
			return;

		const store = await this.getStore(true);
		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = reject;
		});
	}

	public async deleteAll(keys: (IndexKeys<ItemType, keyof ItemType> | ItemType)[]): Promise<ItemType[]> {
		return await Promise.all(keys.map(key => this.delete(key)));
	}

	/**
	 * Delete by the uniqueKey of this collection - usually _id.
	 * Pass the _id of the item to delete.
	 */
	public async delete(key: (IndexKeys<ItemType, keyof ItemType> | ItemType)): Promise<ItemType> {
		const keys = this.config.uniqueKeys.map(k => key[k]);
		const store = await this.getStore(true);

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
