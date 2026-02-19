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

import {__stringify, _values, ApiException, Module, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import type {CrudApiTypes, DB_BaseObject, DB_Prototype} from '@nu-art/db-api-shared';
import {CrudApiDef, CrudApiDef_Type, CrudEmptyQuery} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB.js';
import type {FirestoreQuery} from '@nu-art/firebase-shared';
import {ApiHandler, ApiHandler_FlushPendingRoutes, HttpServer} from '@nu-art/http-server';


interface Params<Database extends DB_Prototype> {
	dbModule: ModuleBE_BaseDB<Database>
	crudApiDef: CrudApiDef_Type<Database>,
	httpServer?: ResolvableContent<HttpServer>
}

/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * Typed by DB_Prototype (shared with FE); no Proto in the base.
 */
export class ModuleBE_BaseApi_Class<Database extends DB_Prototype>
	extends Module {

	readonly dbModule: ModuleBE_BaseDB<Database>;
	readonly httpServer: ResolvableContent<HttpServer>;
	readonly crudApiDef: CrudApiDef_Type<Database>;

	constructor(params: Params<Database>) {
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
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.query,
		{
			httpServer: m => resolveContent(m.httpServer)
		}
	)
	async query(queryBody: CrudApiTypes<Database>['query']['Body']): Promise<Database['dbType'][]> {
		const items = await this.dbModule.query.where(queryBody as FirestoreQuery<Database['dbType']>);
		await this.dbModule.upgradeInstances(items);
		return items;
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.queryUnique,
		{
			httpServer: m => resolveContent(m.httpServer)
		}
	)
	async queryUnique(queryObject: DB_BaseObject<Database['dbKey']>): Promise<Database['dbType']> {
		const toReturnItem = await this.dbModule.query.unique(queryObject._id);
		if (!toReturnItem)
			throw new ApiException(404, `Could not find ${this.dbModule.dbDef.entityName} with _id: ${queryObject._id}`);
		return toReturnItem;
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.upsert,
		{httpServer: m => resolveContent(m.httpServer)}
	)
	async upsert(body: Database['uiType']): Promise<Database['dbType']> {
		return this.dbModule.set.item(body);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.upsertAll,
		{httpServer: m => resolveContent(m.httpServer)}
	)
	async upsertAll(body: Database['uiType'][]): Promise<Database['dbType'][]> {
		return this.dbModule.set.all(body);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.deleteUnique,
		{httpServer: m => resolveContent(m.httpServer)}
	)
	async delete(toDeleteObject: DB_BaseObject): Promise<Database['dbType'] | undefined> {
		return this.dbModule.delete.unique(toDeleteObject._id);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.deleteQuery,
		{httpServer: m => resolveContent(m.httpServer)}
	)
	async deleteQuery(query: CrudApiTypes<Database>['deleteQuery']['Body']): Promise<Database['dbType'][]> {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete.query(query as FirestoreQuery<Database['dbType']>);
	}

	@ApiHandler(
		(m: ModuleBE_BaseApi_Class<Database>) => m.crudApiDef.deleteAll,
		{httpServer: m => resolveContent(m.httpServer)}
	)
	async deleteAll(_params?: unknown): Promise<Database['dbType'][]> {
		void _params;
		return this.dbModule.delete.query(CrudEmptyQuery as FirestoreQuery<Database['dbType']>);
	}
}

export const createApisForDBModule = <Database extends DB_Prototype>(dbModule: ModuleBE_BaseDB<Database, any>, version?: string) => {
	return new ModuleBE_BaseApi_Class<Database>({dbModule, crudApiDef: CrudApiDef<Database>(dbModule.dbDef.dbKey, version)});
};
