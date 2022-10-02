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
import {IndexDb_Query, IndexedDB, ReduceFunction, StorageKey} from '@nu-art/thunderstorm/frontend';

import {DB_Object, Module} from '@nu-art/ts-common';

import {DBApiFEConfig, getModuleFEConfig} from '../db-def';


export abstract class BaseDB_ModuleFE<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends Module<Config> {

	protected readonly db: IndexedDB<DBType, Ks>;
	protected readonly lastSync: StorageKey<number>;
	protected readonly lastVersion: StorageKey<string>;

	protected constructor(dbDef: DBDef<DBType, Ks>) {
		super();
		const config = getModuleFEConfig(dbDef);
		this.setDefaultConfig(config as Config);

		this.db = IndexedDB.getOrCreate(this.config.dbConfig);
		this.lastSync = new StorageKey<number>('last-sync--' + this.config.dbConfig.name);
		this.lastVersion = new StorageKey<string>('last-version--' + this.config.dbConfig.name);
	}

	protected init() {
		const previousVersion = this.lastVersion.get();
		const currentVersion = this.config.versions[0];
		this.lastVersion.set(currentVersion);

		if (previousVersion === currentVersion)
			return;

		this.logInfo(`Cleaning up & Sync...`);
		this.cache.clear(true)
			.then(() => this.logInfo(`Cleaning up & Sync: Completed`))
			.catch((e) => this.logError(`Cleaning up & Sync: ERROR`, e));
	}

	cache = {
		clear: async (resync = false) => {
			this.lastSync.delete();
			await this.db.deleteDB();
		},

		query: async (query?: string | number | string[] | number[], indexKey?: string) => (await this.db.query({query, indexKey})) || [],

		/**
		 * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
		 *
		 * @param {function} filter - Boolean returning function, to determine which objects to return.
		 * @param {Object} [query] - A query object
		 *
		 * @return Array of items or empty array
		 */
		filter: async (filter: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.queryFilter(filter, query),

		/**
		 * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
		 *
		 * @param {function} filter - Boolean returning function, to determine which object to return.
		 *
		 * @return a single item or undefined
		 */
		find: async (filter: (item: DBType) => boolean) => this.db.queryFind(filter),

		/**
		 * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
		 *
		 * @param {function} mapper - Function that returns data to map for the object
		 * @param {function} [filter] - Boolean returning function, to determine which item to map.
		 * @param {Object} [query] - A query object
		 *
		 * @return An array of mapped items
		 */
		map: async <MapType>(mapper: (item: DBType) => MapType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.WIP_queryMap(mapper, filter, query),

		/**
		 * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
		 * @param {function} reducer - Function that determines who to reduce the array.
		 * @param {*} initialValue - An initial value for the reducer
		 * @param {function} [filter] - Function that determines which DB objects to reduce.
		 * @param {Object} [query] - A query Object.
		 *
		 * @return a single reduced value.
		 */
		reduce: async <ReturnType>(reducer: ReduceFunction<DBType, ReturnType>, initialValue: ReturnType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) => this.db.queryReduce(reducer, initialValue, filter, query),

		unique: async (_key?: string | IndexKeys<DBType, Ks>) => {
			if (_key === undefined)
				return _key;

			const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key;
			return this.db.get(key);
		}
	};
}