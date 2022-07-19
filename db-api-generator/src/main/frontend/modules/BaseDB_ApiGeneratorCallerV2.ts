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

import {ApiDefCaller, IndexKeys, QueryParams} from '@nu-art/thunderstorm';
import {ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB, DBDef,} from '../shared';
import {FirestoreQuery} from '@nu-art/firebase';
import {
	apiWithBody,
	apiWithQuery,
	IndexDb_Query,
	IndexedDB,
	IndexedDBModule,
	ReduceFunction,
	StorageKey,
	ThunderDispatcher
} from '@nu-art/thunderstorm/frontend';

import {DB_Object, Module, PreDB} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {EventType_Create, EventType_Delete, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update, EventType_UpsertAll} from '../consts';

import {DBApiFEConfig, getModuleFEConfig} from '../db-def';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export abstract class BaseDB_ApiGeneratorCallerV2<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends Module<Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>> {

	readonly version = 'v2';

	readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>;
	private db: IndexedDB<DBType, Ks>;
	private lastSync: StorageKey<number>;
	readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		super();
		const config = getModuleFEConfig(dbDef);
		this.defaultDispatcher = defaultDispatcher;
		this.setDefaultConfig(config as Config);
		this.db = IndexedDBModule.getOrCreate(this.config.dbConfig);
		this.lastSync = new StorageKey<number>('last-sync--' + this.config.dbConfig.name);
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbDef.relativeUrl);

		const _query = apiWithBody(apiDef.v1.query, this.onQueryReturned);
		const sync = apiWithBody(apiDef.v1.query, this.onSyncCompleted);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		const upsert = apiWithBody(apiDef.v1.upsert, this.onEntryUpdated);
		const patch = apiWithBody(apiDef.v1.patch, this.onEntryPatched);

		this.v1 = {
			sync: () => sync({where: {__updated: {$gte: this.lastSync.get(0)}}}),
			query: (query?: FirestoreQuery<DBType>) => _query(query || {where: {}}),
			// @ts-ignore
			queryUnique: (uniqueKeys: string | IndexKeys<DBType, Ks>) => {
				return queryUnique(typeof uniqueKeys === 'string' ? {_id: uniqueKeys} : uniqueKeys as unknown as QueryParams);
			},
			// @ts-ignore
			upsert: (toUpsert: PreDB<DBType>) => {
				return upsert(toUpsert);
			},
			upsertAll: apiWithBody(apiDef.v1.upsertAll, this.onEntriesUpdated),
			// @ts-ignore
			patch: (toPatch: IndexKeys<DBType, Ks> & Partial<DBType>) => {
				return patch(toPatch);
			},
			delete: apiWithQuery(apiDef.v1.delete, this.onEntryDeleted),
			deleteAll: apiWithQuery(apiDef.v1.deleteAll),
		};
	}

	onSyncCompleted = async (items: DBType[]) => {
		await this.db.upsertAll(items);
		if (items.length)
			this.lastSync.set(items[0].__updated);

		this.dispatchMulti(EventType_Query, items);
	};

	public async clearCache(sync = true) {
		this.lastSync.delete();
		await this.db.deleteAll();
		if (sync)
			this.v1.sync().execute();
	}

	public async queryCache(query?: string | number | string[] | number[], indexKey?: string): Promise<DBType[]> {
		return (await this.db.query({query, indexKey})) || [];
	}

	/**
	 * Iterates over all DB objects in the related collection, and returns all the items that pass the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which objects to return.
	 * @param {Object} [query] - A query object
	 *
	 * @return Array of items or empty array
	 */
	public async queryFilter(filter: (item: DBType) => boolean, query?: IndexDb_Query): Promise<DBType[]> {
		return await this.db.queryFilter(filter, query);
	}

	/**
	 * Iterates over all DB objects in the related collection, and returns the first item that passes the filter
	 *
	 * @param {function} filter - Boolean returning function, to determine which object to return.
	 *
	 * @return a single item or undefined
	 */
	public async queryFind(filter: (item: DBType) => boolean) {
		return this.db.queryFind(filter);
	}

	/**
	 * Iterates over all DB objects in the related collection, and returns an array of items based on the mapper.
	 *
	 * @param {function} mapper - Function that returns data to map for the object
	 * @param {function} [filter] - Boolean returning function, to determine which item to map.
	 * @param {Object} [query] - A query object
	 *
	 * @return An array of mapped items
	 */
	public async queryMap<MapType>(mapper: (item: DBType) => MapType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) {
		return this.db.WIP_queryMap(mapper, filter, query);
	}

	/**
	 * iterates over all DB objects in the related collection, and reduces them to a single value based on the reducer.
	 * @param {function} reducer - Function that determines who to reduce the array.
	 * @param {*} initialValue - An initial value for the reducer
	 * @param {function} [filter] - Function that determines which DB objects to reduce.
	 * @param {Object} [query] - A query Object.
	 *
	 * @return a single reduced value.
	 */
	public async queryReduce<ReturnType>(reducer: ReduceFunction<DBType, ReturnType>, initialValue: ReturnType, filter?: (item: DBType) => boolean, query?: IndexDb_Query) {
		return this.db.queryReduce(reducer, initialValue, filter, query);
	}

	public uniqueQueryCache = async (_key?: string | IndexKeys<DBType, Ks>): Promise<DBType | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key;
		return this.db.get(key);
	};

	private dispatchSingle = (event: SingleApiEvent, item: DBType) => {
		this.defaultDispatcher?.dispatchModule(event, item);
		this.defaultDispatcher?.dispatchUI(event, item);
	};

	private dispatchMulti = (event: MultiApiEvent, items: DBType[]) => {
		this.defaultDispatcher?.dispatchModule(event, items);
		this.defaultDispatcher?.dispatchUI(event, items);
	};

	protected async onEntryDeleted(item: DBType): Promise<void> {
		await this.db.delete(item);
		this.dispatchSingle(EventType_Delete, item);
	}

	protected async onEntriesUpdated(items: DBType[]): Promise<void> {
		await this.db.upsertAll(items);
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	}

	protected async onEntryUpdated(item: DBType, original: PreDB<DBType>): Promise<void> {
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item);
	}

	protected async onEntryPatched(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType): Promise<void> {
		if (item)
			await this.db.upsert(item);

		this.dispatchSingle(event, item);
	}

	protected async onGotUnique(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	}

	protected async onQueryReturned(items: DBType[]): Promise<void> {
		await this.db.upsertAll(items);
		this.dispatchMulti(EventType_Query, items);
	}
}