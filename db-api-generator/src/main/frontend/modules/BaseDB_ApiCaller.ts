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
import {_EmptyQuery, ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB, DBDef, DBSyncData, Response_DBSync,} from '../shared';
import {FirestoreQuery} from '@nu-art/firebase';
import {apiWithBody, apiWithQuery, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';

import {BadImplementationException, DB_BaseObject, DB_Object, merge, PreDB, TypedMap} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {
	EventType_Create,
	EventType_Delete,
	EventType_DeleteMulti,
	EventType_Patch,
	EventType_Query,
	EventType_Sync,
	EventType_Unique,
	EventType_Update,
	EventType_UpsertAll
} from '../consts';

import {DBApiFEConfig} from '../db-def';
import {SyncIfNeeded} from './ModuleFE_SyncManager';
import {BaseDB_ModuleFE} from './BaseDB_ModuleFE';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export enum SyncStatus {
	idle,
	read,
	write
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

type Operation = {
	running: Pending,
	pending?: Pending
}

export abstract class BaseDB_ApiCaller<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends BaseDB_ModuleFE<DBType, Ks, Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>, SyncIfNeeded {

	readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>;
	// @ts-ignore
	readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
	private syncStatus: SyncStatus;
	private dataStatus: DataStatus;
	private operations: TypedMap<Operation> = {};

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		super(dbDef);

		this.defaultDispatcher = defaultDispatcher;
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbDef);

		const _query = apiWithBody(apiDef.v1.query, (response) => this.onQueryReturned(response));
		const sync = apiWithBody(apiDef.v1.sync, this.onSyncCompleted);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		const upsert = apiWithBody(apiDef.v1.upsert, this.onEntryUpdated);
		const patch = apiWithBody(apiDef.v1.patch, this.onEntryPatched);

		//Set Statuses
		this.syncStatus = SyncStatus.idle;
		this.dataStatus = this.IDB.getLastSync() !== 0 ? DataStatus.containsData : DataStatus.NoData;

		const _delete = apiWithQuery(apiDef.v1.delete, this.onEntryDeleted);
		// @ts-ignore
		this.v1 = {
			sync: (additionalQuery: FirestoreQuery<DBType> = _EmptyQuery) => {
				const originalSyncQuery = {
					where: {__updated: {$gt: this.IDB.getLastSync()}},
					orderBy: [{key: '__updated', order: 'desc'}],
				};
				const query: FirestoreQuery<DBType> = merge(originalSyncQuery, additionalQuery);

				const syncRequest = sync(query);
				const _execute = syncRequest.execute.bind(syncRequest);
				const _executeSync = syncRequest.executeSync.bind(syncRequest);

				syncRequest.execute = (onSuccess, onError) => {
					this.setSyncStatus(SyncStatus.read);
					return _execute(onSuccess, onError);
				};

				syncRequest.executeSync = async () => {
					this.setSyncStatus(SyncStatus.read);
					return _executeSync();
				};

				return syncRequest;
			},

			query: (query?: FirestoreQuery<DBType>) => _query(query || _EmptyQuery),
			// @ts-ignore
			queryUnique: (uniqueKeys: string | IndexKeys<DBType, Ks>) => {
				return queryUnique(typeof uniqueKeys === 'string' ? {_id: uniqueKeys} : uniqueKeys as unknown as QueryParams);
			},
			// @ts-ignore
			upsert: (toUpsert: PreDB<DBType>) => {
				return this.updatePending(toUpsert as DB_BaseObject, upsert(toUpsert), 'upsert');
			},
			upsertAll: apiWithBody(apiDef.v1.upsertAll, this.onEntriesUpdated),
			// @ts-ignore
			patch: (toPatch: Partial<DBType>) => {
				return this.updatePending(toPatch as DB_BaseObject, patch(toPatch as IndexKeys<DBType, Ks> & Partial<DBType>), 'patch');
			},
			delete: (item: DB_BaseObject) => {
				return this.updatePending(item, _delete(item), 'delete');
			},
			deleteAll: apiWithQuery(apiDef.v1.deleteAll),
			upgradeCollection: apiWithQuery(apiDef.v1.upgradeCollection, () => this.v1.sync().executeSync())
		};

		const superClear = this.IDB.clear;
		this.IDB.clear = async (reSync = false) => {
			await superClear();
			this.setSyncStatus(SyncStatus.idle);
			this.setDataStatus(DataStatus.NoData);
			if (reSync)
				this.v1.sync().execute();
		};
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
				// this.logInfo(`pre-executing operation(${requestType}) for ${id}: ${item.label}`);

				return _execute((r) => {
					// @ts-ignore
					// this.logInfo(`executing operation(${requestType}) for ${id}: ${item.label}`);
					const pending = this.operations[id].pending;
					delete this.operations[id];
					if (!pending)
						return onSuccess?.(r);

					pending.request.execute(pending.onSuccess, pending.onError);
				}, (e) => {
					delete this.operations[id];
					onError?.(e);
				});
			}

			const runningRequestType = operation.running.requestType;
			const pendingRequestType = operation.pending?.requestType;

			if (runningRequestType === 'delete' || pendingRequestType === 'delete') {
				throw new BadImplementationException(`Item with id: ${id} is marked for deletion`);
			}

			if (runningRequestType === 'upsert' || runningRequestType === 'patch') {
				if (operation.pending) { // @ts-ignore
					// this.logInfo(`canceling pending operation(${operation.pending.requestType}) for ${id}`);
				}

				// @ts-ignore
				// this.logInfo(`scheduling pending operation(${requestType}) for ${id}: ${item.label}`);
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
		if (mySyncData && mySyncData.oldestDeleted !== undefined && mySyncData.oldestDeleted > this.IDB.getLastSync()) {
			this.logWarning('DATA WAS TOO OLD, Cleaning Cache', `${mySyncData.oldestDeleted} > ${this.IDB.getLastSync()}`);
			await this.IDB.clear();
		}

		if (mySyncData && mySyncData.lastUpdated <= this.IDB.getLastSync()) {
			this.setDataStatus(DataStatus.containsData);
			this.setSyncStatus(SyncStatus.idle);
			await this.cache.load();
			return;
		}

		await this.v1.sync().executeSync();
	};

	private setSyncStatus(status: SyncStatus) {
		this.logDebug(`Sync status updated: ${SyncStatus[this.syncStatus]} => ${SyncStatus[status]}`);
		if (this.syncStatus === status)
			return;

		this.syncStatus = status;
		this.OnSyncStatusChanged();
	}

	getSyncStatus() {
		return this.syncStatus;
	}

	private setDataStatus(status: DataStatus) {
		this.logDebug(`Data status updated: ${DataStatus[this.dataStatus]} => ${DataStatus[status]}`);
		this.dataStatus = status;
	}

	getDataStatus() {
		return this.dataStatus;
	}

	onSyncCompleted = async (syncData: Response_DBSync<DBType>) => {
		this.logDebug(`onSyncCompleted: ${this.config.dbConfig.name}`);
		await this.IDB.syncIndexDb(syncData.toUpdate, syncData.toDelete);
		this.setDataStatus(DataStatus.containsData);
		this.setSyncStatus(SyncStatus.idle);

		await this.cache.load();
		if (syncData.toDelete)
			this.dispatchMulti(EventType_DeleteMulti, syncData.toDelete as DBType[]);
		if (syncData.toUpdate)
			this.dispatchMulti(EventType_Query, syncData.toUpdate);
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
		await this.IDB.syncIndexDb([], [item]);
		this.cache.onEntriesDeleted([item]);
		this.dispatchSingle(EventType_Delete, item);
	};

	protected onEntriesUpdated = async (items: DBType[]): Promise<void> => {
		await this.IDB.syncIndexDb(items);
		this.cache.onEntriesUpdated(items);
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	};

	protected onEntryUpdated = async (item: DBType, original: PreDB<DBType>): Promise<void> => {
		this.cache.onEntriesUpdated([item]);
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item);
	};

	protected onEntryPatched = async (item: DBType): Promise<void> => {
		this.cache.onEntriesUpdated([item]);
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	};

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType): Promise<void> {
		await this.IDB.syncIndexDb([item]);
		this.cache.onEntriesUpdated([item]);
		this.dispatchSingle(event, item);
	}

	protected onGotUnique = async (item: DBType): Promise<void> => {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	};

	protected onQueryReturned = async (toUpdate: DBType[], toDelete: DB_Object[] = []): Promise<void> => {
		await this.IDB.syncIndexDb(toUpdate, toDelete);
		this.dispatchMulti(EventType_Query, toUpdate);
	};

}