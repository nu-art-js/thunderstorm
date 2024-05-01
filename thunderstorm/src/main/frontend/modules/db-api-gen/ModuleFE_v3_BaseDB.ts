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
	_keys,
	arrayToMap,
	DB_Object,
	DBDef_V3,
	dbObjectToId,
	DBProto,
	deleteKeysObject,
	exists,
	IndexKeys,
	InvalidResult,
	KeysOfDB_Object,
	Logger,
	LogLevel,
	Module,
	sortArray,
	tsValidateResult,
	TypedMap,
	ValidationException
} from '@nu-art/ts-common';
import {composeDbObjectUniqueId} from '@nu-art/firebase';
import {OnClearWebsiteData} from '../clearWebsiteDataDispatcher';
import {DBApiFEConfigV3, getModuleFEConfigV3} from '../../core/db-api-gen/v3-db-def';
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
import {MultiApiEvent, SingleApiEvent} from '../../core/db-api-gen/types';
import {StorageKey} from '../ModuleFE_LocalStorage';
import {ThunderDispatcher} from '../../core/thunder-dispatcher';
import {IndexDb_Query, ReduceFunction} from '../../core/IndexedDB';
import {IndexedDB_Store} from '../../core/IndexedDBV4/IndexedDB_Store';
import {DBConfigV3} from '../../core/IndexedDBV4/types';
import {ModuleFE_IDBManager} from '../../core/IndexedDBV4/ModuleFE_IDBManager';
import {ModuleSyncType} from './types';


export abstract class ModuleFE_v3_BaseDB<Proto extends DBProto<any>, Config extends DBApiFEConfigV3<Proto> = DBApiFEConfigV3<Proto>>
	extends Module<Config>
	implements OnClearWebsiteData {

	readonly validator: Proto['modifiablePropsValidator'];
	readonly cache: MemCache<Proto>;
	readonly IDB!: IDBCache<Proto>;
	readonly dbDef: DBDef_V3<Proto>;
	private dataStatus: DataStatus;
	readonly defaultDispatcher: ThunderDispatcher<any, string>;
	public readonly syncType: ModuleSyncType;

	// @ts-ignore
	private readonly ModuleFE_BaseDB = true;

	protected constructor(dbDef: DBDef_V3<Proto>, defaultDispatcher: ThunderDispatcher<any, string>, syncType: ModuleSyncType) {
		super();
		this.syncType = syncType;
		this.defaultDispatcher = defaultDispatcher;
		const config = getModuleFEConfigV3(dbDef);
		this.validator = config.validator;
		this.dbDef = dbDef;
		//Set Statuses
		this.dataStatus = DataStatus.NoData;
		this.setDefaultConfig(config as Config);
		this.cache = new MemCache<Proto>(this, config.dbConfig.uniqueKeys);
		this.IDB = new IDBCache<Proto>(this.config.dbConfig, this.config.key);
	}

	protected init() {
		this.IDB.onLastUpdateListener(async (after, before) => {
			if (!exists(after) || after === before)
				return;

			await this.cache.load();
			this.defaultDispatcher.dispatchAll('update', {} as Proto['dbType']);
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

	private dispatchSingle = (event: SingleApiEvent, item: Proto['dbType']) => {
		this.defaultDispatcher?.dispatchModule(event, item);
		this.defaultDispatcher?.dispatchUI(event, item);
	};

	dispatchMulti = (event: MultiApiEvent, items: Proto['dbType'][]) => {
		this.defaultDispatcher?.dispatchModule(event, items);
		this.defaultDispatcher?.dispatchUI(event, items);
	};

	public onEntriesDeleted = async (items: Proto['dbType'][]): Promise<void> => {
		await this.IDB.syncIndexDb([], items);
		// @ts-ignore
		this.cache.onEntriesDeleted(items);
		this.dispatchMulti(EventType_DeleteMulti, items);
	};

	protected onEntryDeleted = async (item: Proto['dbType']): Promise<void> => {
		await this.IDB.syncIndexDb([], [item]);
		// @ts-ignore
		this.cache.onEntriesDeleted([item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	public onEntriesUpdated = async (items: Proto['dbType'][]): Promise<void> => {
		await this.IDB.syncIndexDb(items);
		// @ts-ignore
		this.cache.onEntriesUpdated(items);
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	};

	public onEntryUpdated = async (item: Proto['dbType'], original: Proto['uiType']): Promise<void> => {
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item);
	};

	protected onEntryPatched = async (item: Proto['dbType']): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	};

	public validateImpl(_instance: Partial<Proto['uiType']>) {
		const instance = deleteKeysObject(_instance as Proto['dbType'], [...KeysOfDB_Object, ..._keys(this.dbDef.generatedPropsValidator)]);
		const results = tsValidateResult(instance, this.validator);
		if (results) {
			this.onValidationError(instance, results as InvalidResult<Proto['uiType']>);
		}
	}

	protected validateInternal(_instance: Partial<Proto['uiType']>) {
		this.validateImpl(_instance);
	}

	protected onValidationError(instance: Proto['uiType'], results: InvalidResult<Proto['dbType']>) {
		this.logError(`Error validating object:`, instance, 'With Error: ', results);
		throw new ValidationException('Error validating object', instance, results);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: Proto['dbType']): Promise<void> {
		await this.IDB.syncIndexDb([item]);
		// @ts-ignore
		this.cache.onEntriesUpdated([item]);
		this.dispatchSingle(event, item);
	}

	protected onGotUnique = async (item: Proto['dbType']): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	protected onQueryReturned = async (toUpdate: Proto['dbType'][], toDelete: DB_Object[] = []): Promise<void> => {
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		// @ts-ignore
		this.cache.onEntriesUpdated(toUpdate);
		// @ts-ignore
		this.cache.onEntriesDeleted(toDelete);
		this.dispatchMulti(EventType_Query, toUpdate);
	};
}

class IDBCache<Proto extends DBProto<any>>
	extends Logger {

	readonly storeWrapper: IndexedDB_Store<Proto>;
	protected readonly lastSync: StorageKey<number>;
	protected readonly lastVersion: StorageKey<string>;

	constructor(dbConfig: DBConfigV3<Proto>, dbKey: string) {
		super(`indexdb-${dbKey}`);
		const currentVersion = dbConfig.version[0];
		this.setMinLevel(LogLevel.Verbose);
		this.lastSync = new StorageKey<number>('last-sync--' + dbKey);
		this.lastVersion = new StorageKey<string>('last-version--' + dbKey);
		const onOpenedCallback = () => {
			const previousVersion = this.lastVersion.get();
			this.lastVersion.set(currentVersion);

			this.storeWrapper.exists().then(exists => {
				if (!exists) {
					this.logInfo(`Database doesn't exist.. reset last sync timestamp`);
					this.lastSync.delete();
				}
			});

			if (!previousVersion || previousVersion === currentVersion)
				return;

			this.lastSync.delete();
			this.logInfo(`Cleaning up & Sync...`);
			this.clear()
				.then(() => this.logInfo(`Cleaning up & Sync: Completed`))
				.catch((e) => this.logError(`Cleaning up & Sync: ERROR`, e));
		};
		this.storeWrapper = ModuleFE_IDBManager.register(dbConfig, onOpenedCallback);
	}

	onLastUpdateListener(onChangeListener: (after?: number, before?: number) => Promise<void>) {
		this.lastSync.onChange(onChangeListener);
	}

	forEach = async (processor: (item: Proto['dbType']) => void) => {
		const allItems = await this.query();
		allItems.forEach(processor);
		return allItems;
	};

	clear = async (resync = false) => {
		this.lastSync.delete();
		return this.storeWrapper.clearStore();
	};

	delete = async (resync = false) => {
		this.lastSync.delete();
		return this.storeWrapper.clearStore();
	};

	query = async (query?: string | number | string[] | number[], indexKey?: string): Promise<Proto['dbType'][]> => (await this.storeWrapper.query({
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
	filter = async (filter: (item: Proto['dbType']) => boolean, query?: IndexDb_Query): Promise<Proto['dbType'][]> => this.storeWrapper.queryFilter(filter, query);

	/**
	 * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which object to return.
	 *
	 * @return a single item or undefined
	 */
	find = async (filter: (item: Proto['dbType']) => boolean): Promise<Proto['dbType'] | undefined> => this.storeWrapper.queryFind(filter);

	/**
	 * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
	 *
	 * @param {function} mapper - Function that returns data to map for the object
	 * @param {function} [filter] - Boolean returning function, to determine which item to map.
	 * @param {Object} [query] - A query object
	 *
	 * @return An array of mapped items
	 */
	map = async <MapType>(mapper: (item: Proto['dbType']) => MapType, filter?: (item: Proto['dbType']) => boolean, query?: IndexDb_Query): Promise<MapType[]> => this.storeWrapper.WIP_queryMap(mapper, filter, query);

	/**
	 * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
	 * @param {function} reducer - Function that determines who to reduce the array.
	 * @param {*} initialValue - An initial value for the reducer
	 * @param {function} [filter] - Function that determines which DB objects to reduce.
	 * @param {Object} [query] - A query Object.
	 *
	 * @return a single reduced value.
	 */
	reduce = async <ReturnType>(reducer: ReduceFunction<Proto['dbType'], ReturnType>, initialValue: ReturnType, filter?: (item: Proto['dbType']) => boolean, query?: IndexDb_Query): Promise<ReturnType> => this.storeWrapper.queryReduce(reducer, initialValue, filter, query);

	unique = async (_key?: string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>): Promise<Proto['dbType'] | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<Proto['dbType'], keyof Proto['dbType']> : _key;
		return this.storeWrapper.get(key);
	};

	getLastSync() {
		return this.lastSync.get(0);
	}

	setLastUpdated(lastUpdated: number) {
		this.lastSync.set(lastUpdated);
	}

	async syncIndexDb(toUpdate: Proto['dbType'][], toDelete: DB_Object[] = []) {
		await this.storeWrapper.upsertAll(toUpdate);
		await this.storeWrapper.deleteAll(toDelete as Proto['dbType'][]);
	}
}

class MemCache<Proto extends DBProto<any>> {

	private readonly module: ModuleFE_v3_BaseDB<Proto>;
	private readonly keys: (keyof Proto['dbType'])[];
	loaded: boolean = false;

	_map!: Readonly<TypedMap<Readonly<Proto['dbType']>>>;
	_array!: Readonly<Readonly<Proto['dbType']>[]>;

	private cacheFilter?: (item: Readonly<Proto['dbType']>) => boolean;

	constructor(module: ModuleFE_v3_BaseDB<Proto, any>, keys: (keyof Proto['dbType'])[]) {
		this.module = module;
		this.keys = keys;
		this.clear();
	}

	forEach = (processor: (item: Readonly<Proto['dbType']>) => void) => {
		this._array.forEach(processor);
	};

	clear = () => {
		this.setCache([]);
	};

	load = async (cacheFilter?: (item: Readonly<Proto['dbType']>) => boolean) => {
		this.module.logDebug(`${this.module.getName()} cache is loading`);
		let allItems;
		this.cacheFilter = cacheFilter;
		if (this.cacheFilter)
			allItems = await this.module.IDB.filter(this.cacheFilter);
		else
			allItems = await this.module.IDB.query();

		const frozenItems = allItems.map((item: any) => Object.freeze(item));

		this.setCache(frozenItems);

		this.loaded = true;
		this.module.logDebug(`${this.module.getName()} cache finished loading, count: ${this.all().length}`);
	};

	unique = (_key?: Proto['uniqueParam']): Readonly<Proto['dbType']> | undefined => {
		if (_key === undefined)
			return _key;

		const _id = typeof _key === 'string' ? _key : (('_id' in (_key as {
			[p: string]: any
		}) && typeof _key['_id'] === 'string') ? _key['_id'] : composeDbObjectUniqueId(_key, this.keys));
		return this._map[_id];
	};

	all = (): Readonly<Readonly<Proto['dbType']>[]> => {
		return this._array;
	};

	allMutable = (): Readonly<Proto['dbType']>[] => {
		return [...this._array];
	};

	filter = (filter: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => boolean): Readonly<Proto['dbType']>[] => {
		return this.all().filter(filter);
	};

	byIds = (ids: Proto['uniqueParam'][]): Readonly<Proto['dbType'][]> => {
		return ids.map(id => this.unique(id));
	};

	find = (filter: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => boolean): Readonly<Proto['dbType']> | undefined => {
		return this.all().find(filter);
	};

	map = <MapType>(mapper: (item: Readonly<Proto['dbType']>, index: number, array: Readonly<Proto['dbType'][]>) => MapType): MapType[] => {
		return this.all().map(mapper);
	};

	sort = <MapType>(map: keyof Proto['dbType'] | (keyof Proto['dbType'])[] | ((item: Readonly<Proto['dbType']>) => any) = i => i, invert = false): Readonly<Proto['dbType']>[] => {
		return sortArray(this.allMutable(), map, invert);
	};

	arrayToMap = (getKey: (item: Readonly<Proto['dbType']>, index: number, map: {
		[k: string]: Readonly<Proto['dbType']>
	}) => string | number, map: {
		[k: string]: Readonly<Proto['dbType']>
	} = {}) => arrayToMap(this.allMutable(), getKey, map);

	// @ts-ignore
	private onEntriesDeleted(itemsDeleted: Proto['dbType'][]) {
		const ids = new Set<string>(itemsDeleted.map(dbObjectToId));
		this.setCache(this.filter(i => !ids.has(i._id)));
	}

	// @ts-ignore
	private onEntriesUpdated(itemsUpdated: Proto['dbType'][]) {
		const frozenItems = itemsUpdated.map(item => Object.freeze(item));
		const ids = new Set<string>(itemsUpdated.map(dbObjectToId));
		const toCache = this.filter(i => !ids.has(i._id));
		toCache.push(...frozenItems);
		this.setCache(toCache);
	}

	private setCache(cacheArray: Readonly<Proto['dbType']>[]) {
		this._map = Object.freeze({...arrayToMap(cacheArray as Readonly<DB_Object>[], dbObjectToId)});
		this._array = Object.freeze(cacheArray);
	}
}