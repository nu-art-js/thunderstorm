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

import {__stringify, _values, ApiException, DB_BaseObject, Module, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import type {CrudApiTypes, CrudTypes} from '@nu-art/db-api-shared';
import {CrudApiDef, CrudApiDef_Type, CrudEmptyQuery} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB.js';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import {ApiHandler, ApiHandler_FlushPendingRoutes, HttpServer} from '@nu-art/http-server';


interface Params<Types extends CrudTypes> {
	dbModule: ModuleBE_BaseDB<Types>
	crudApiDef: CrudApiDef_Type<Types>,
	httpServer?: ResolvableContent<HttpServer>
}

/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * Typed by CrudTypes (shared with FE); no Proto in the base.
 */
export class ModuleBE_BaseApi_Class<Types extends CrudTypes>
	extends Module {

	readonly dbModule: ModuleBE_BaseDB<Types>;
	readonly httpServer: ResolvableContent<HttpServer>;
	readonly crudApiDef: CrudApiDef_Type<Types>;

	constructor(params: Params<Types>) {
		super(`GenApi(${params.dbModule.getName()})`);
		if (!params.crudApiDef)
			throw new Error('ModuleBE_BaseApi: crudApiDef is required');
		this.dbModule = params.dbModule;
		this.crudApiDef = params.crudApiDef;
		this.httpServer = params.httpServer ?? (() => HttpServer.getDefault());
		ApiHandler_FlushPendingRoutes();
	}

	init() {
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.query,
		{
			httpServer: m => resolveContent(m.httpServer)
		}
	)
	async query(queryBody: CrudApiTypes<Types>['query']['Body']): Promise<Types['dbItem'][]> {
		const items = await this.dbModule.query.where(queryBody as FirestoreQuery<Types['dbItem']>);
		await this.dbModule.upgradeInstances(items);
		return items;
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.queryUnique,
		{
			httpServer: m => resolveContent(m.httpServer)
		}
	)
	async queryUnique(queryObject: DB_BaseObject): Promise<Types['dbItem']> {
		const toReturnItem = await this.dbModule.query.unique(queryObject._id);
		if (!toReturnItem)
			throw new ApiException(404, `Could not find ${this.dbModule.dbDef.entityName} with _id: ${queryObject._id}`);
		return toReturnItem;
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.upsert,
		{ httpServer: m => resolveContent(m.httpServer) }
	)
	async upsert(body: Types['uiItem']): Promise<Types['dbItem']> {
		return this.dbModule.set.item(body);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.upsertAll,
		{ httpServer: m => resolveContent(m.httpServer) }
	)
	async upsertAll(body: Types['uiItem'][]): Promise<Types['dbItem'][]> {
		return this.dbModule.set.all(body);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.deleteUnique,
		{ httpServer: m => resolveContent(m.httpServer) }
	)
	async delete(toDeleteObject: DB_BaseObject): Promise<Types['dbItem'] | undefined> {
		return this.dbModule.delete.unique(toDeleteObject._id);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.deleteQuery,
		{ httpServer: m => resolveContent(m.httpServer) }
	)
	async deleteQuery(query: CrudApiTypes<Types>['deleteQuery']['Body']): Promise<Types['dbItem'][]> {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete.query(query as FirestoreQuery<Types['dbItem']>);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Types>) => m.crudApiDef.deleteAll,
		{ httpServer: m => resolveContent(m.httpServer) }
	)
	async deleteAll(_params?: unknown): Promise<Types['dbItem'][]> {
		void _params;
		return this.dbModule.delete.query(CrudEmptyQuery as FirestoreQuery<Types['dbItem']>);
	}
}

export const createApisForDBModule = <Types extends CrudTypes>(dbModule: ModuleBE_BaseDB<Types>, version?: string) => {
	return new ModuleBE_BaseApi_Class<Types>({ dbModule, crudApiDef: CrudApiDef(dbModule.dbDef.dbKey, version) });
};
