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
import {_EmptyQuery, ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB, DBDef, DBSyncData,} from '../shared';
import {FirestoreQuery} from '@nu-art/firebase';
import {apiWithBody, apiWithQuery, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';

import {BadImplementationException, DB_BaseObject, DB_Object, merge, PreDB, TypedMap} from '@nu-art/ts-common';

import {DBApiFEConfig} from '../db-def';
import {SyncIfNeeded} from './ModuleFE_SyncManager';
import {ApiCallerEventTypeV2} from './types';
import {DataStatus} from './consts';
import {ModuleFE_BaseDB} from './ModuleFE_BaseDB';


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

export abstract class ModuleFE_BaseApi<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends ModuleFE_BaseDB<DBType, Ks, Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>, SyncIfNeeded {

	// @ts-ignore
	readonly v1: ApiDefCaller<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
	private operations: TypedMap<Operation> = {};

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		super(dbDef, defaultDispatcher);

		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbDef);

		const _query = apiWithBody(apiDef.v1.query, (response) => this.onQueryReturned(response));
		const sync = apiWithBody(apiDef.v1.sync, this.onSyncCompleted);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		const upsert = apiWithBody(apiDef.v1.upsert, this.onEntryUpdated);
		const patch = apiWithBody(apiDef.v1.patch, this.onEntryPatched);

		// this.dataStatus = this.IDB.getLastSync() !== 0 ? DataStatus.containsData : DataStatus.NoData;

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
					return _execute(onSuccess, onError);
				};

				syncRequest.executeSync = async () => {
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
				this.validateImpl(toUpsert);
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

			this.setDataStatus(DataStatus.containsData);
			return;
		}

		await this.v1.sync().executeSync();
	};
}