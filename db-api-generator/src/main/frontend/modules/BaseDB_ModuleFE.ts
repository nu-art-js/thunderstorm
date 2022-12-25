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

import {IndexKeys} from '@nu-art/thunderstorm';
import {DBDef,} from '../shared';
import {DBConfig, IndexDb_Query, IndexedDB, OnClearWebsiteData, ReduceFunction, StorageKey} from '@nu-art/thunderstorm/frontend';

import {arrayToMap, DB_Object, dbObjectToId, Logger, Module, TypedMap} from '@nu-art/ts-common';

import {DBApiFEConfig, getModuleFEConfig} from '../db-def';


export abstract class BaseDB_ModuleFE<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends Module<Config>
	implements OnClearWebsiteData {

	readonly cache: MemCache<DBType, Ks>;
	readonly IDB: IDBCache<DBType, Ks>;

	protected constructor(dbDef: DBDef<DBType, Ks>) {
		super();
		const config = getModuleFEConfig(dbDef);
		this.setDefaultConfig(config as Config);

		this.cache = new MemCache<DBType, Ks>(this, config.dbConfig.uniqueKeys);
		this.IDB = new IDBCache<DBType, Ks>(config.dbConfig, config.versions[0]);
	}

	protected init() {
	}

	async __onClearWebsiteData(resync: boolean) {
		return this.IDB.clear(resync);
	}

	public getCollectionName = () => {
		return this.config.dbConfig.name;
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

		if (previousVersion === currentVersion)
			return;

		this.logInfo(`Cleaning up & Sync...`);
		this.clear(true)
			.then(() => this.logInfo(`Cleaning up & Sync: Completed`))
			.catch((e) => this.logError(`Cleaning up & Sync: ERROR`, e));

	}

	forEach = async (processor: (item: DBType) => void) => {
		const allItems = await this.query();
		allItems.forEach(processor);
		return allItems;
	};

	clear = async (resync = false) => {
		this.lastSync.delete();
		return this.db.deleteDB();
	};

	query = async (query?: string | number | string[] | number[], indexKey?: string) => (await this.db.query({query, indexKey})) || [];

	/**
	 * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which objects to return.
	 * @param {Object} [query] - A query object
	 *
	 * @return Array of items or empty array
	 */
	filter = async (filter: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.queryFilter(filter, query);

	/**
	 * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which object to return.
	 *
	 * @return a single item or undefined
	 */
	find = async (filter: (item: DBType) => boolean) => this.db.queryFind(filter);

	/**
	 * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
	 *
	 * @param {function} mapper - Function that returns data to map for the object
	 * @param {function} [filter] - Boolean returning function, to determine which item to map.
	 * @param {Object} [query] - A query object
	 *
	 * @return An array of mapped items
	 */
	map = async <MapType>(mapper: (item: DBType) => MapType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.WIP_queryMap(mapper, filter, query);

	/**
	 * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
	 * @param {function} reducer - Function that determines who to reduce the array.
	 * @param {*} initialValue - An initial value for the reducer
	 * @param {function} [filter] - Function that determines which DB objects to reduce.
	 * @param {Object} [query] - A query Object.
	 *
	 * @return a single reduced value.
	 */
	reduce = async <ReturnType>(reducer: ReduceFunction<DBType, ReturnType>, initialValue: ReturnType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.queryReduce(reducer, initialValue, filter, query);

	unique = async (_key?: string | IndexKeys<DBType, Ks>) => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key;
		return this.db.get(key);
	};

	getLastSync() {
		return this.lastSync.get(0);
	}

	async syncIndexDb(toUpdate: DBType[], toDelete: DB_Object[] = []) {
		await this.db.upsertAll(toUpdate);
		await this.db.deleteAll(toDelete as DBType[]);

		let latest = -1;
		latest = toUpdate.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);
		latest = toDelete.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);

		if (latest !== -1)
			this.lastSync.set(latest);
	}
}

class MemCache<DBType extends DB_Object, Ks extends keyof DBType = '_id'> {

	private readonly module: BaseDB_ModuleFE<DBType, Ks>;
	private readonly keys: string[];

	_map!: Readonly<TypedMap<DBType>>;
	_array!: Readonly<DBType[]>;

	private cacheByKey: TypedMap<DBType> = {};

	private cacheFilter?: (item: DBType) => boolean;

	constructor(module: BaseDB_ModuleFE<DBType, Ks>, keys: Ks[]) {
		this.module = module;
		this.keys = keys as string[];
		this.clear();
	}

	forEach = (processor: (item: DBType) => void) => {
		this._array.forEach(processor);
	};

	clear = () => {
		this.setCache([]);
	};

	load = async (cacheFilter?: (item: DBType) => boolean) => {
		this.clear();
		let allItems;
		this.cacheFilter = cacheFilter;
		if (this.cacheFilter)
			allItems = await this.module.IDB.filter(this.cacheFilter);
		else
			allItems = await this.module.IDB.query();

		this.setCache(allItems);

		if (this.keys.length === 1 && this.keys[0] === '_id')
			this.cacheByKey = this._map;
		else
			this.cacheByKey = arrayToMap(allItems, this.getFullKey);
	};

	unique(_key?: string | IndexKeys<DBType, Ks>) {
		if (_key === undefined)
			return _key;

		if (typeof _key === 'string') {
			return this._map[_key];
		}

		return this.cacheByKey[this.getFullKey(_key)];
	}

	private getFullKey = (_key: IndexKeys<DBType, Ks>) => {
		return this.keys.reduce((_fullKey, key) => `${_fullKey}-${_key[key as Ks]}`, '');
	};

	all = () => {
		return this._array;
	};

	filter = (filter: (item: DBType, index: number, array: Readonly<DBType[]>) => boolean) => {
		return this.all().filter(filter);
	};

	find = (filter: (item: DBType, index: number, array: Readonly<DBType[]>) => boolean) => {
		return this.all().find(filter);
	};

	map = <MapType>(mapper: (item: DBType, index: number, array: Readonly<DBType[]>) => MapType) => {
		return this.all().map(mapper);
	};

	// @ts-ignore
	private onEntriesDeleted(itemsDeleted: DBType[]) {
		const ids = new Set<string>(itemsDeleted.map(dbObjectToId));
		this.setCache(this.filter(i => !ids.has(i._id)));
	}

	// @ts-ignore
	private onEntriesUpdated(itemsUpdated: DBType[]) {
		const ids = new Set<string>(itemsUpdated.map(dbObjectToId));
		const toCache = this.filter(i => !ids.has(i._id));
		toCache.push(...itemsUpdated);
		this.setCache(toCache);
	}

	private setCache(cacheArray: DBType[]) {
		this._map = Object.freeze({...arrayToMap(cacheArray, dbObjectToId)});
		this._array = Object.freeze(cacheArray);
	}
}