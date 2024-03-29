/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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
	arrayToMap,
	DB_Object,
	DBDef,
	dbObjectToId,
	Default_UniqueKey,
	exists,
	IndexKeys,
	InvalidResult,
	Logger,
	Module,
	PreDB,
	sortArray,
	tsValidateResult,
	TypedMap,
	UniqueParam,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';

import {composeDbObjectUniqueId} from '@nu-art/firebase';
import {OnClearWebsiteData} from '../clearWebsiteDataDispatcher';
import {DBApiFEConfig, getModuleFEConfig} from '../../core/db-api-gen/db-def';
import {
	DataStatus,
	EventType_Create,
	EventType_Delete,
	EventType_DeleteMulti,
	EventType_Patch,
	EventType_Query,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll,
	syncDispatcher
} from '../../core/db-api-gen/consts';
import {ApiCallerEventType, MultiApiEvent, SingleApiEvent} from '../../core/db-api-gen/types';
import {StorageKey} from '../ModuleFE_LocalStorage';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {DBConfig, IndexDb_Query, IndexedDB, ReduceFunction} from '../../core/IndexedDB';
import {ModuleSyncType} from './types';


export abstract class ModuleFE_BaseDB<DBType extends DB_Object, Ks extends keyof PreDB<DBType> = Default_UniqueKey, Config = any, _Config extends DBApiFEConfig<DBType, Ks> & Config = DBApiFEConfig<DBType, Ks> & Config>
	extends Module<_Config>
	implements OnClearWebsiteData {
	readonly validator: ValidatorTypeResolver<DBType>;
	readonly cache: MemCache<DBType, Ks>;
	readonly IDB!: IDBCache<DBType, Ks>;
	readonly dbDef: DBDef<DBType, Ks>;
	private dataStatus: DataStatus;
	readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType<DBType>>;
	public readonly syncType: ModuleSyncType;

	// @ts-ignore
	private readonly ModuleFE_BaseDB = true;

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType<DBType>>, syncType: ModuleSyncType) {
		super();
		this.defaultDispatcher = defaultDispatcher;
		this.syncType = syncType;
		const config = getModuleFEConfig(dbDef);
		this.validator = config.validator;
		this.setDefaultConfig(config as _Config);
		//Set Statuses
		this.dataStatus = DataStatus.NoData;

		this.cache = new MemCache<DBType, Ks>(this, config.dbConfig.uniqueKeys);
		this.dbDef = dbDef;
		this.IDB = new IDBCache<DBType, Ks>(this.config.dbConfig, this.config.versions[0]);
	}

	protected init() {
		this.IDB.onLastUpdateListener(async (after, before) => {
			if (!exists(after) || after === before)
				return;

			await this.cache.load();
			this.defaultDispatcher.dispatchAll('update', {} as DBType);
			this.OnDataStatusChanged();
		});
	}

	setDataStatus(status: DataStatus) {
		this.logDebug(`Data status updated: ${DataStatus[this.dataStatus]} => ${DataStatus[status]}`);
		if (this.dataStatus === status)
			return;

		this.dataStatus = status;
		this.OnDataStatusChanged();
	}

	protected OnDataStatusChanged() {
		syncDispatcher.dispatchModule(this as any);
		syncDispatcher.dispatchUI(this as any);
	}

	getDataStatus() {
		return this.dataStatus;
	}

	async __onClearWebsiteData() {
		await this.IDB.clear();
		this.setDataStatus(DataStatus.NoData);
	}

	public getCollectionName = () => {
		return this.config.dbConfig.name;
	};

	private dispatchSingle = (event: SingleApiEvent, item: DBType) => {
		this.defaultDispatcher?.dispatchModule(event, item);
		this.defaultDispatcher?.dispatchUI(event, item);
	};

	dispatchMulti = (event: MultiApiEvent, items: DBType[]) => {
		this.defaultDispatcher?.dispatchModule(event, items);
		this.defaultDispatcher?.dispatchUI(event, items);
	};

	public onEntriesDeleted = async (items: DBType[]): Promise<void> => {
		await this.IDB.syncIndexDb([], items);
		// @ts-ignore
		this.cache.onEntriesDeleted(items);
		this.dispatchMulti(EventType_DeleteMulti, items);
	};

	public onEntryDeleted = async (item: DBType): Promise<void> => {
		await this.IDB.syncIndexDb([], [item]);
		// @ts-ignore
		this.cache.onEntriesDeleted([item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	public onEntriesUpdated = async (items: DBType[]): Promise<void> => {
		await this.IDB.syncIndexDb(items);
		// @ts-ignore
		this.cache.onEntriesUpdated(items);
		// todo set data status
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	};

	public onEntryUpdated = async (item: DBType, original: PreDB<DBType>): Promise<void> => {
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item);
	};

	protected onEntryPatched = async (item: DBType): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	};

	public validateObject(instance: Partial<DBType>) {
		return tsValidateResult(instance as DBType, this.validator);
	}

	public validateImpl(instance: PreDB<DBType>) {
		const results = tsValidateResult(instance as DBType, this.validator);
		if (results) {
			this.onValidationError(instance, results as InvalidResult<DBType>);
		}
	}

	protected onValidationError(instance: PreDB<DBType>, results: InvalidResult<DBType>) {
		this.logError(`Error validating object:`, instance, 'With Error: ', results);
		throw new ValidationException('Error validating object', instance, results);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType): Promise<void> {
		this.validateImpl(item);
		await this.IDB.syncIndexDb([item]);
		// @ts-ignore
		this.cache.onEntriesUpdated([item]);
		this.dispatchSingle(event, item);
	}

	protected onGotUnique = async (item: DBType): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	protected onQueryReturned = async (toUpdate: DBType[], toDelete: DB_Object[] = []): Promise<void> => {
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		// @ts-ignore
		this.cache.onEntriesUpdated(toUpdate);
		// @ts-ignore
		this.cache.onEntriesDeleted(toDelete);
		this.dispatchMulti(EventType_Query, toUpdate);
	};
}

class IDBCache<DBType extends DB_Object, Ks extends keyof DBType = '_id'>
	extends Logger {

	protected readonly db: IndexedDB<DBType, Ks>;
	protected readonly lastSync: StorageKey<number>;
	protected readonly lastVersion: StorageKey<string>;

	constructor(dbConfig: DBConfig<DBType, Ks>, currentVersion: string) {
		super(`indexdb-${dbConfig.name}`);
		this.db = IndexedDB.getOrCreate(dbConfig);
		this.lastSync = new StorageKey<number>('last-sync--' + dbConfig.name);
		this.lastVersion = new StorageKey<string>('last-version--' + dbConfig.name);

		const previousVersion = this.lastVersion.get();
		this.lastVersion.set(currentVersion);

		this.db.exists().then(dbInfo => {
			if (exists(dbInfo))
				return;

			this.logInfo(`Database doesn't exist.. reset last sync timestamp`);
			this.lastSync.delete();
		});

		if (!previousVersion || previousVersion === currentVersion)
			return;

		this.lastSync.delete();
		this.logInfo(`Cleaning up & Sync...`);
		this.clear()
			.then(() => this.logInfo(`Cleaning up & Sync: Completed`))
			.catch((e) => this.logError(`Cleaning up & Sync: ERROR`, e));
	}

	onLastUpdateListener(onChangeListener: (after?: number, before?: number) => Promise<void>) {
		this.lastSync.onChange(onChangeListener);
	}

	forEach = async (processor: (item: DBType) => void) => {
		const allItems = await this.query();
		allItems.forEach(processor);
		return allItems;
	};

	clear = async () => {
		this.lastSync.delete();
		return this.db.clearDB();
	};

	delete = async () => {
		this.lastSync.delete();
		return this.db.deleteDB();
	};

	query = async (query?: string | number | string[] | number[], indexKey?: string): Promise<DBType[]> => (await this.db.query({
		query,
		indexKey
	})) || [];

	/**
	 * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which objects to return.
	 * @param {Object} [query] - A query object
	 *
	 * @return Array of items or empty array
	 */
	filter = async (filter: (item: DBType) => boolean, query?: IndexDb_Query): Promise<DBType[]> => this.db.queryFilter(filter, query);

	/**
	 * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which object to return.
	 *
	 * @return a single item or undefined
	 */
	find = async (filter: (item: DBType) => boolean): Promise<DBType | undefined> => this.db.queryFind(filter);

	/**
	 * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
	 *
	 * @param {function} mapper - Function that returns data to map for the object
	 * @param {function} [filter] - Boolean returning function, to determine which item to map.
	 * @param {Object} [query] - A query object
	 *
	 * @return An array of mapped items
	 */
	map = async <MapType>(mapper: (item: DBType) => MapType, filter?: (item: DBType) => boolean, query?: IndexDb_Query): Promise<MapType[]> => this.db.WIP_queryMap(mapper, filter, query);

	/**
	 * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
	 * @param {function} reducer - Function that determines who to reduce the array.
	 * @param {*} initialValue - An initial value for the reducer
	 * @param {function} [filter] - Function that determines which DB objects to reduce.
	 * @param {Object} [query] - A query Object.
	 *
	 * @return a single reduced value.
	 */
	reduce = async <ReturnType>(reducer: ReduceFunction<DBType, ReturnType>, initialValue: ReturnType, filter?: (item: DBType) => boolean, query?: IndexDb_Query): Promise<ReturnType> => this.db.queryReduce(reducer, initialValue, filter, query);

	unique = async (_key?: string | IndexKeys<DBType, Ks>): Promise<DBType | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key;
		return this.db.get(key);
	};

	getLastSync() {
		return this.lastSync.get(0);
	}

	setLastUpdated(lastUpdated: number) {
		this.lastSync.set(lastUpdated);
	}

	async syncIndexDb(toUpdate: DBType[], toDelete: DB_Object[] = []) {
		await this.db.upsertAll(toUpdate);
		await this.db.deleteAll(toDelete as DBType[]);
	}
}

class MemCache<DBType extends DB_Object, Ks extends keyof PreDB<DBType> = Default_UniqueKey> {

	private readonly module: ModuleFE_BaseDB<DBType, Ks>;
	private readonly keys: Ks[];
	loaded: boolean = false;

	_map!: Readonly<TypedMap<Readonly<DBType>>>;
	_array!: Readonly<Readonly<DBType>[]>;

	private cacheFilter?: (item: Readonly<DBType>) => boolean;

	constructor(module: ModuleFE_BaseDB<DBType, Ks>, keys: Ks[]) {
		this.module = module;
		this.keys = keys;
		this.clear();
	}

	forEach = (processor: (item: Readonly<DBType>) => void) => {
		this._array.forEach(processor);
	};

	clear = () => {
		this.setCache([]);
	};

	load = async (cacheFilter?: (item: Readonly<DBType>) => boolean) => {
		this.module.logDebug(`${this.module.getName()} cache is loading`);
		let allItems;
		this.cacheFilter = cacheFilter;
		if (this.cacheFilter)
			allItems = await this.module.IDB.filter(this.cacheFilter);
		else
			allItems = await this.module.IDB.query();

		const frozenItems = allItems.map(item => Object.freeze(item));

		this.setCache(frozenItems);

		this.loaded = true;
		this.module.logDebug(`${this.module.getName()} cache finished loading, count: ${this.all().length}`);
	};

	unique = (_key?: UniqueParam<DBType, Ks>): Readonly<DBType> | undefined => {
		if (_key === undefined)
			return _key;

		const _id = typeof _key === 'string' ? _key : (('_id' in _key && typeof _key['_id'] === 'string') ? _key['_id'] : composeDbObjectUniqueId(_key, this.keys));
		return this._map[_id];
	};

	all = (): Readonly<Readonly<DBType>[]> => {
		return this._array;
	};

	allMutable = (): Readonly<DBType>[] => {
		return [...this._array];
	};

	filter = (filter: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => boolean): Readonly<DBType>[] => {
		return this.all().filter(filter);
	};

	find = (filter: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => boolean): Readonly<DBType> | undefined => {
		return this.all().find(filter);
	};

	map = <MapType>(mapper: (item: Readonly<DBType>, index: number, array: Readonly<DBType[]>) => MapType): MapType[] => {
		return this.all().map(mapper);
	};

	sort = <MapType>(map: keyof DBType | (keyof DBType)[] | ((item: Readonly<DBType>) => any) = i => i, invert = false): Readonly<DBType>[] => {
		return sortArray(this.allMutable(), map, invert);
	};

	arrayToMap = (getKey: (item: Readonly<DBType>, index: number, map: {
		[k: string]: Readonly<DBType>
	}) => string | number, map: {
		[k: string]: Readonly<DBType>
	} = {}) => arrayToMap(this.allMutable(), getKey, map);

	// @ts-ignore
	private onEntriesDeleted(itemsDeleted: DBType[]) {
		const ids = new Set<string>(itemsDeleted.map(dbObjectToId));
		this.setCache(this.filter(i => !ids.has(i._id)));
	}

	// @ts-ignore
	private onEntriesUpdated(itemsUpdated: DBType[]) {
		const frozenItems = itemsUpdated.map(item => Object.freeze(item));
		const ids = new Set<string>(itemsUpdated.map(dbObjectToId));
		const toCache = this.filter(i => !ids.has(i._id));
		toCache.push(...frozenItems);
		this.setCache(toCache);
	}

	private setCache(cacheArray: Readonly<DBType>[]) {
		this._map = Object.freeze({...arrayToMap(cacheArray, dbObjectToId)});
		this._array = Object.freeze(cacheArray);
	}
}