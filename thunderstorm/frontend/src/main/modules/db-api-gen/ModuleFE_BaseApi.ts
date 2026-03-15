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

import {DB_BaseObject, Database, DB_Prototype} from '@nu-art/db-api-shared';
import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase-shared';
import {BadImplementationException, IndexKeys, TypedMap} from '@nu-art/ts-common';
import {ModuleFE_BaseDB} from './ModuleFE_BaseDB.js';
import {ApiDefCaller, ApiStruct_DBApiGenIDBV3, BaseHttpRequest, DBApiDefGeneratorIDBV3, HttpException, TypedApi} from '../../shared.js';
import {DBApiFEConfig} from '../../core/db-api-gen/db-def.js';
import {ThunderDispatcher} from '../../core/thunder-dispatcher.js';
import {apiWithBody, apiWithQuery} from '../../core/typed-api.js';
import {CustomMemCreators, ModuleSyncType} from './types.js';


/**
 * Type representing possible database operation request types
 */
type RequestType = 'upsert' | 'patch' | 'delete';

/**
 * Interface representing a pending database operation
 */
type Pending = {
	/** The type of request being made */
	requestType: RequestType;
	/** The HTTP request object */
	request: BaseHttpRequest<any>
	/** Optional success callback */
	onSuccess?: (response: any, data?: string) => Promise<void> | void,
	/** Optional error callback */
	onError?: (reason: HttpException) => any
};

/**
 * Interface representing the state of database operations
 */
type Operation = {
	/** Currently executing operation */
	running: Pending,
	/** Operation waiting to be executed */
	pending?: Pending
}

/**
 * Base API module for frontend database operations
 *
 * Provides core functionality for database CRUD operations through API endpoints
 * including support for operation queueing and request management.
 *
 * @template Proto - Database protocol type extending DBProto
 * @template _Config - Base configuration type
 * @template Config - Extended configuration type with DBApiFEConfig
 */
export abstract class ModuleFE_BaseApi<Proto extends DB_Prototype, _Config extends object = object, Config extends _Config & DBApiFEConfig<Proto> = _Config & DBApiFEConfig<Proto>>
	extends ModuleFE_BaseDB<Proto, Config>
	implements ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>> {

	readonly query: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['query'];
	readonly queryUnique: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['queryUnique'];
	readonly upsert: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['upsert'];
	readonly upsertAll: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['upsertAll'];
	readonly patch: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['patch'];
	readonly delete: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['delete'];
	readonly deleteQuery: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['deleteQuery'];
	readonly deleteAll: ApiDefCaller<ApiStruct_DBApiGenIDBV3<Proto>>['deleteAll'];
	private operations: TypedMap<Operation> = {};

	/**
	 * Creates an instance of ModuleFE_BaseApi
	 *
	 * @param dbDef - Database definition
	 * @param defaultDispatcher - Default dispatcher for events
	 * @param version - Optional API version string
	 * @param customMemCreators - Optional custom memory creators for the database
	 */
	protected constructor(dbDef: Database<Proto>, defaultDispatcher: ThunderDispatcher<any, string>, version?: string, customMemCreators?: CustomMemCreators<Proto>) {
		super(dbDef, defaultDispatcher, ModuleSyncType.APISync, customMemCreators);

		const apiDef = this.resolveApiDef(dbDef, version);

		const _query = apiWithBody(apiDef.query, (response) => this.onQueryReturned(response));
		const queryUniqueFn = apiWithQuery(apiDef.queryUnique, this.onGotUnique);
		const upsertFn = apiWithBody(apiDef.upsert, async (item, original) => {
			const toRet = await this.onEntryUpdated(item, JSON.parse(original as unknown as string));
			this.IDB.setLastUpdated(item.__updated);
			return toRet;
		});
		const patchFn = apiWithBody(apiDef.patch, (items) => this.onEntryPatched(items));

		const _delete = apiWithQuery(apiDef.delete, this.onEntryDeleted);
		this.query = (query?: FirestoreQuery<Proto['dbType']>) => _query(query || _EmptyQuery);
		this.queryUnique = (_id: string) => queryUniqueFn({_id});
		this.upsert = (toUpsert: Proto['uiType']) => {
			toUpsert = this.cleanUp(toUpsert);
			this.validateInternal(toUpsert);
			return this.updatePending(toUpsert as DB_BaseObject, upsertFn(toUpsert), 'upsert');
		};
		this.upsertAll = apiWithBody(apiDef.upsertAll, async (items) => {
			const toRet = await this.onEntriesUpdated(items);
			const lastUpdated = items.reduce((toRet, current) => Math.max(toRet, current.__updated), -1);
			this.IDB.setLastUpdated(lastUpdated);
			return toRet;
		});
		this.patch = (toPatch: Partial<Proto['dbType']>) =>
			this.updatePending(toPatch as DB_BaseObject, patchFn(toPatch as IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Proto['uiType']), 'patch');
		this.delete = (item: DB_BaseObject) => this.updatePending(item, _delete(item), 'delete');
		this.deleteQuery = apiWithBody(apiDef.deleteQuery, this.onEntriesDeleted);
		this.deleteAll = apiWithQuery(apiDef.deleteAll);
	}

	/**
	 * Resolves the API definition for the database
	 *
	 * @param dbDef - Database definition
	 * @param version - Optional API version
	 * @returns Generated API definition for the database
	 */
	protected resolveApiDef(dbDef: Database<Proto>, version: string | undefined) {
		return DBApiDefGeneratorIDBV3<Proto>(dbDef, version);
	}

	/**
	 * Cleans up data before upserting to database
	 *
	 * @param toUpsert - Data to be upserted
	 * @returns Cleaned up data
	 */
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
				operation.running.request.clearOnCompleted();
			}

			return request;
		};

		return request;
	}
}