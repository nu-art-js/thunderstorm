import {DBProto, IndexKeys, Logger, MUSTNeverHappenException} from '@nu-art/ts-common';
import {DBConfigV3, IndexDb_Query_V3, ReduceFunction_V3} from './types';


type StoreResolver<Proto extends DBProto<any>> = (dbConfig: DBConfigV3<Proto>, write?: boolean, store?: IDBObjectStore) => Promise<IDBObjectStore>;
type StoreExistsResolver<Proto extends DBProto<any>> = (dbConfig: DBConfigV3<Proto>) => Promise<boolean>;

export class IndexedDB_Store<Proto extends DBProto<any>>
	extends Logger {

	private config: DBConfigV3<Proto>;
	private storeResolver: StoreResolver<Proto>;
	private storeExistsResolver: StoreExistsResolver<Proto>;

	// ######################## Init ########################

	constructor(config: DBConfigV3<Proto>, storeResolver: StoreResolver<Proto>, storeExistsResolver: StoreExistsResolver<Proto>) {
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

	// ######################## Cursor Interaction ########################

	private getCursor = async (query?: IndexDb_Query_V3): Promise<IDBRequest<IDBCursorWithValue | null>> => {
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
		const store = await this.getStore(true, _store);
		return new Promise((resolve, reject) => {
			const request = store.add(value);
			request.onerror = () => reject(new Error(`Error inserting item in DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result as unknown as Proto['dbType']);
		});
	}

	public async insertAll(values: Proto['dbType'][], _store?: IDBObjectStore) {
		const store = await this.getStore(true, _store);

		for (const value of values) {
			await this.insert(value, store);
		}
	}

	public async upsert(value: Proto['dbType'], _store?: IDBObjectStore): Promise<Proto['dbType']> {
		const store = await this.getStore(true, _store);
		try {
			const request = store.put(value);
			return new Promise((resolve, reject) => {
				request.onerror = () => reject(new Error(`Error upserting item in DB - ${this.config.name}`));
				request.onsuccess = () => resolve(request.result as unknown as Proto['dbType']);
			});
		} catch (e: any) {
			this.logError('trying to upsert: ', value);
			throw e;
		}
	}

	public async upsertAll(values: Proto['dbType'][], _store?: IDBObjectStore) {
		const store = await this.getStore(true, _store);
		for (const value of values) {
			await this.upsert(value, store);
		}
	}

	// ######################### Data collection functions #########################

	public async get(key: IndexKeys<Proto['dbType'], keyof Proto['dbType']>): Promise<Proto['dbType'] | undefined> {
		const map = this.config.uniqueKeys.map(k => key[k]);
		const request = (await this.getStore()).get(map as IDBValidKey);

		return new Promise((resolve, reject) => {
			request.onerror = () => reject(new Error(`Error getting item from DB - ${this.config.name}`));
			request.onsuccess = () => resolve(request.result);
		});
	}

	public async query(query: IndexDb_Query_V3): Promise<Proto['dbType'][] | undefined> {
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

	public async clearStore(): Promise<void> {
		if(!(await this.exists()))
			return;

		const store = await this.getStore(true);
		return new Promise((resolve, reject) => {
			const request = store.clear();
			request.onsuccess = () => resolve();
			request.onerror = reject;
		});
	}

	public async deleteAll(keys: (IndexKeys<Proto['dbType'], keyof Proto['dbType']> | Proto['dbType'])[]): Promise<Proto['dbType'][]> {
		return await Promise.all(keys.map(key => this.delete(key)));
	}

	public async delete(key: (IndexKeys<Proto['dbType'], keyof Proto['dbType']> | Proto['dbType'])): Promise<Proto['dbType']> {
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