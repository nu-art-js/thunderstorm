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

import {ApiDefCaller, BaseHttpRequest, HttpException, IndexKeys, QueryParams, TypedApi} from '@nu-art/thunderstorm';
import {ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB, DBDef, DBSyncData, Response_DBSync,} from '../shared';
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

import {BadImplementationException, DB_BaseObject, DB_Object, Module, PreDB, TypedMap} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {
	EventType_Create,
	EventType_Delete,
	EventType_Patch,
	EventType_Query,
	EventType_Sync,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll
} from '../consts';

import {DBApiFEConfig, getModuleFEConfig} from '../db-def';
import {SyncIfNeeded} from './ModuleFE_SyncManager';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export enum SyncStatus {
	OutOfSync,
	Syncing,
	Synced
}

export enum DataStatus {
	NoData,
	containsData,
}

type RequestType = 'upsert' | 'patch' | 'delete';
type Pending = {
	requestType: RequestType;
	request: BaseHttpRequest<any>
	onSuccess?: (response: any, data?: string) => Promise<void> | void,
	onError?: (reason: HttpException) => any
};
type Pah = {
	running: Pending,
	pending?: Pending
}

export abstract class BaseDB_ApiGeneratorCallerV2<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends Module<Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>, SyncIfNeeded {

	readonly version = 'v2';

	readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>;
	private db: IndexedDB<DBType, Ks>;
	private lastSync: StorageKey<number>;
	readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
	private syncStatus: SyncStatus = SyncStatus.OutOfSync;
	private operations: TypedMap<Pah> = {};

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		super();
		const config = getModuleFEConfig(dbDef);
		this.defaultDispatcher = defaultDispatcher;
		this.setDefaultConfig(config as Config);
		this.db = IndexedDBModule.getOrCreate(this.config.dbConfig);
		this.lastSync = new StorageKey<number>('last-sync--' + this.config.dbConfig.name);
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbDef);

		const _query = apiWithBody(apiDef.v1.query, (response) => this.onQueryReturned(response));
		const sync = apiWithBody(apiDef.v1.sync, this.onSyncCompleted);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		const upsert = apiWithBody(apiDef.v1.upsert, this.onEntryUpdated);
		const patch = apiWithBody(apiDef.v1.patch, this.onEntryPatched);

		const _delete = apiWithQuery(apiDef.v1.delete, this.onEntryDeleted);
		this.v1 = {
			sync: () => {
				this.setSyncStatus(SyncStatus.Syncing);
				const query: FirestoreQuery<DBType> = {
					withDeleted: true,
					where: {__updated: {$gt: this.lastSync.get(0)}},
					orderBy: [{key: '__updated', order: 'desc'}],
				};
				return sync(query);
			},

			query: (query?: FirestoreQuery<DBType>) => _query(query || {where: {}}),
			// @ts-ignore
			queryUnique: (uniqueKeys: string | IndexKeys<DBType, Ks>) => {
				return queryUnique(typeof uniqueKeys === 'string' ? {_id: uniqueKeys} : uniqueKeys as unknown as QueryParams);
			},
			upsert: (toUpsert: PreDB<DBType>) => {
				return this.updatePending(toUpsert as DB_BaseObject, upsert(toUpsert), 'upsert');
			},
			upsertAll: apiWithBody(apiDef.v1.upsertAll, this.onEntriesUpdated),
			patch: (toPatch: IndexKeys<DBType, Ks> & Partial<DBType>) => {
				return this.updatePending(toPatch as DB_BaseObject, patch(toPatch), 'patch');
			},
			delete: (item: DB_BaseObject) => {
				return this.updatePending(item, _delete(item), 'delete');
			},
			deleteAll: apiWithQuery(apiDef.v1.deleteAll),
		} as ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
	}

	private updatePending<API extends TypedApi<any, any, any, any>>(item: DB_BaseObject, request: BaseHttpRequest<API>, requestType: RequestType) {
		const id = item._id;
		if (id === undefined)
			return request;

		const _execute = request.execute.bind(request);
		request.execute = (onSuccess, onError) => {
			const operation = this.operations[id];

			if (!operation) {
				this.operations[id] = {running: {request, requestType}};
				// @ts-ignore
				this.logInfo(`pre-executing operation(${requestType}) for ${id}: ${item.label}`);

				return _execute((r) => {
					// @ts-ignore
					this.logInfo(`executing operation(${requestType}) for ${id}: ${item.label}`);
					const pending = this.operations[id].pending;
					delete this.operations[id];
					if (!pending)
						return onSuccess?.(r);

					pending.request.execute(pending.onSuccess, pending.onError);
				}, onError);
			}

			const runningRequestType = operation.running.requestType;
			const pendingRequestType = operation.pending?.requestType;

			if (runningRequestType === 'delete' || pendingRequestType === 'delete') {
				throw new BadImplementationException(`Item with id: ${id} is marked for deletion`);
			}

			if (runningRequestType === 'upsert' || runningRequestType === 'patch') {
				if (operation.pending) { // @ts-ignore
					this.logInfo(`canceling pending operation(${operation.pending.requestType}) for ${id}`);
				}

				// @ts-ignore
				this.logInfo(`scheduling pending operation(${requestType}) for ${id}: ${item.label}`);
				operation.pending = {request, requestType, onSuccess, onError};
				operation.running.request.setOnCompleted(undefined);
			}

			return request;
		};

		// request.executeSync = async () => {
		// 	const operation = this.operations[id];
		// 	if (!operation) {
		// 		this.operations[id] = {running: {request, requestType}};
		// 		return request.executeSync();
		// 	}
		// };
		return request;
	}

	__syncIfNeeded = async (syncData: DBSyncData[]) => {
		const mySyncData = syncData.find(sync => sync.name === this.config.dbConfig.name);
		if (mySyncData && mySyncData.lastUpdated <= this.lastSync.get(0)) {
			this.setSyncStatus(SyncStatus.Synced);
			return;
		}

		this.setSyncStatus(SyncStatus.Syncing);
		await this.v1.sync().executeSync();
		this.setSyncStatus(SyncStatus.Synced);
	};

	private setSyncStatus(status: SyncStatus) {
		this.logDebug(`Sync status updated: ${this.syncStatus} => ${status}`);
		this.syncStatus = status;
		this.OnSyncStatusChanged();
	}

	getSyncStatus() {
		return this.syncStatus;
	}

	onSyncCompleted = async (syncData: Response_DBSync<DBType>) => {
		this.logDebug(`onSyncCompleted: ${this.config.dbConfig.name}`);
		await this.syncIndexDb(syncData.toUpdate, syncData.toDelete);

		this.setSyncStatus(SyncStatus.Synced);
		this.dispatchMulti(EventType_Query, syncData.toUpdate);
	};

	private async syncIndexDb(toUpdate: DBType[], toDelete: DB_Object[] = []) {
		await this.db.upsertAll(toUpdate);
		await this.db.deleteAll(toDelete as DBType[]);

		let latest = -1;
		latest = toUpdate.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);
		latest = toDelete.reduce((toRet, current) => Math.max(toRet, current.__updated), latest);

		if (latest !== -1)
			this.lastSync.set(latest);
	}

	public async clearCache(sync = true) {
		this.lastSync.delete();
		await this.db.deleteDB();
		this.setSyncStatus(SyncStatus.OutOfSync);
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

	protected OnSyncStatusChanged = () => {
		this.dispatchMulti(EventType_Sync, []);
	};

	protected onEntryDeleted = async (item: DBType): Promise<void> => {
		await this.syncIndexDb([], [item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	protected onEntriesUpdated = async (items: DBType[]): Promise<void> => {
		await this.syncIndexDb(items);
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	};

	protected onEntryUpdated = async (item: DBType, original: PreDB<DBType>): Promise<void> => {
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item);
	};

	protected onEntryPatched = async (item: DBType): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	};

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType): Promise<void> {
		await this.syncIndexDb([item]);
		this.dispatchSingle(event, item);
	}

	protected onGotUnique = async (item: DBType): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	protected onQueryReturned = async (toUpdate: DBType[], toDelete: DB_Object[] = []): Promise<void> => {
		await this.syncIndexDb(toUpdate, toDelete);
		this.dispatchMulti(EventType_Query, toUpdate);
	};

}