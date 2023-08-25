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

import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase';
import {
	BadImplementationException,
	DB_BaseObject,
	DBDef_V3,
	DBProto,
	IndexKeys,
	merge,
	TypedMap
} from '@nu-art/ts-common';
import {ModuleFE_v3_BaseDB} from './ModuleFE_v3_BaseDB';
import {
	ApiDefCaller,
	ApiStruct_DBApiGenIDBV3,
	BaseHttpRequest,
	DBApiDefGeneratorIDBV3,
	DBSyncData,
	HttpException,
	QueryParams,
	TypedApi
} from '../../shared';
import {DBApiFEConfigV3} from '../../core/db-api-gen/v3-db-def';
import {SyncIfNeeded} from '../sync-manager/ModuleFE_SyncManager';
import {apiWithBody, apiWithQuery, ThunderDispatcher} from '../../core';
import {ApiCallerEventTypeV3} from '../../core/db-api-gen/v3_types';
import {DataStatus} from '../../core/db-api-gen/consts';


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

export abstract class ModuleFE_v3_BaseApi<Proto extends DBProto<any>, Config extends DBApiFEConfigV3<Proto> = DBApiFEConfigV3<Proto>>
	extends ModuleFE_v3_BaseDB<Proto, Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>, SyncIfNeeded {

	// @ts-ignore
	readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['v1'];
	private operations: TypedMap<Operation> = {};

	protected constructor(dbDef: DBDef_V3<Proto>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV3<Proto>>) {
		super(dbDef, defaultDispatcher);

		const apiDef = DBApiDefGeneratorIDBV3<Proto>(dbDef);

		const _query = apiWithBody(apiDef.v1.query, (response) => this.onQueryReturned(response));
		const sync = apiWithBody(apiDef.v1.sync, this.onSyncCompleted);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		const upsert = apiWithBody(apiDef.v1.upsert, this.onEntryUpdated);
		const patch = apiWithBody(apiDef.v1.patch, this.onEntryPatched);

		// this.dataStatus = this.IDB.getLastSync() !== 0 ? DataStatus.containsData : DataStatus.NoData;

		const _delete = apiWithQuery(apiDef.v1.delete, this.onEntryDeleted);
		// @ts-ignore
		this.v1 = {
			sync: (additionalQuery: FirestoreQuery<Proto['dbType']> = _EmptyQuery) => {
				const originalSyncQuery = {
					where: {__updated: {$gt: this.IDB.getLastSync()}},
					orderBy: [{key: '__updated', order: 'desc'}],
				};
				const query: FirestoreQuery<Proto['dbType']> = merge(originalSyncQuery, additionalQuery);

				const syncRequest = sync(query);
				const _execute = syncRequest.execute.bind(syncRequest);
				const _executeSync = syncRequest.executeSync.bind(syncRequest);

				syncRequest.execute = (onSuccess, onError) => {
					return _execute(onSuccess, onError);
				};

				syncRequest.executeSync = async () => {
					return _executeSync();
				};

				return syncRequest;
			},

			query: (query?: FirestoreQuery<Proto['dbType']>) => _query(query || _EmptyQuery),
			// @ts-ignore
			queryUnique: (uniqueKeys: string | IndexKeys<DBType, Ks>) => {
				return queryUnique(typeof uniqueKeys === 'string' ? {_id: uniqueKeys} : uniqueKeys as unknown as QueryParams);
			},
			// @ts-ignore
			upsert: (toUpsert: Proto['uiType']) => {
				toUpsert = this.cleanUp(toUpsert);
				this.validateImpl(toUpsert);
				return this.updatePending(toUpsert as DB_BaseObject, upsert(toUpsert), 'upsert');
			},
			upsertAll: apiWithBody(apiDef.v1.upsertAll, this.onEntriesUpdated),
			// @ts-ignore
			patch: (toPatch: Partial<DBType>) => {
				return this.updatePending(toPatch as DB_BaseObject, patch(toPatch as IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Proto['uiType']), 'patch');
			},
			delete: (item: DB_BaseObject) => {
				return this.updatePending(item, _delete(item), 'delete');
			},
			deleteQuery: apiWithBody(apiDef.v1.deleteQuery, this.onEntriesDeleted),
			deleteAll: apiWithQuery(apiDef.v1.deleteAll, () => this.v1.sync().executeSync()),
			upgradeCollection: apiWithBody(apiDef.v1.upgradeCollection, () => this.v1.sync().executeSync())
		};

		const superClear = this.IDB.clear;
		this.IDB.clear = async (reSync = false) => {
			await superClear();
			this.setDataStatus(DataStatus.NoData);
			if (reSync)
				this.v1.sync().execute();
		};
	}

	protected cleanUp = (toUpsert: Proto['uiType']) => {
		return toUpsert;
	};

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
			this.cache.clear();
		}

		if (mySyncData && mySyncData.lastUpdated <= this.IDB.getLastSync()) {
			if (!this.cache.loaded)
				await this.cache.load();

			this.setDataStatus(DataStatus.ContainsData);
			return;
		}

		this.setDataStatus(DataStatus.UpdatingData);
		await this.v1.sync().executeSync();
	};
}