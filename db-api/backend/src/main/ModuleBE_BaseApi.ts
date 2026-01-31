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

import {__stringify, _values, ApiException, DB_BaseObject, IndexKeys, Metadata, Module} from '@nu-art/ts-common';
import type {CrudTypes} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from './ModuleBE_BaseDB.js';
import {_EmptyQuery, FirestoreQuery} from '@nu-art/firebase-shared';
import {ApiHandler} from '@nu-art/http-server';
import {DBApiDefGeneratorIDBV3} from './db-api-gen-v3.js';
import type {ApiDefResolver_DBApiGenIDBV3} from './db-api-gen-v3.js';


/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * Typed by CrudTypes (shared with FE); no Proto in the base.
 */
export class ModuleBE_BaseApi_Class<Types extends CrudTypes>
	extends Module {

	readonly dbModule: ModuleBE_BaseDB<Types>;
	readonly apiDef: ApiDefResolver_DBApiGenIDBV3<Types>;

	constructor(dbModule: ModuleBE_BaseDB<Types, any>, version?: string) {
		super(`GenApiV3(${dbModule.getName()})`);
		this.dbModule = dbModule;
		this.apiDef = DBApiDefGeneratorIDBV3<Types>(this.dbModule.dbDef, version);
	}

	init() {
		this.logDebug(`Adding routes : ${this.apiDef.v1.query.path}`);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.query)
	async query(queryBody: FirestoreQuery<Types['dbItem']>): Promise<Types['dbItem'][]> {
		const items = await this.dbModule.query.where(queryBody);
		await this.dbModule.upgradeInstances(items);
		return items;
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.queryUnique)
	async queryUnique(queryObject: DB_BaseObject): Promise<Types['dbItem']> {
		const toReturnItem = await this.dbModule.query.unique(queryObject._id);
		if (!toReturnItem)
			throw new ApiException(404, `Could not find ${this.dbModule.dbDef.entityName} with _id: ${queryObject._id}`);
		return toReturnItem;
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.upsert)
	async upsert(body: Types['uiItem']): Promise<Types['dbItem']> {
		return this.dbModule.set.item(body);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.upsertAll)
	async upsertAll(body: Types['uiItem'][]): Promise<Types['dbItem'][]> {
		return this.dbModule.set.all(body);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.patch)
	async patch(body: IndexKeys<Types['dbItem'], keyof Types['dbItem']> & Partial<Types['dbItem']>): Promise<Types['dbItem']> {
		if (body._id === undefined || body._id === null || body._id === '')
			throw new ApiException(400, `patch requires _id`);
		const doc = this.dbModule.doc.unique(body._id);
		const existing = await doc.get();
		if (!existing)
			throw new ApiException(404, `Could not find ${this.dbModule.dbDef.entityName} with _id: ${body._id}`);
		return doc.update(body);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.delete)
	async delete(toDeleteObject: DB_BaseObject): Promise<Types['dbItem'] | undefined> {
		return this.dbModule.delete.unique(toDeleteObject._id);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.deleteQuery)
	async deleteQuery(query: FirestoreQuery<Types['dbItem']>): Promise<Types['dbItem'][]> {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete.query(query);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.deleteAll)
	async deleteAll(_params?: unknown): Promise<Types['dbItem'][]> {
		void _params;
		return this.dbModule.delete.query(_EmptyQuery);
	}

	@ApiHandler((m: ModuleBE_BaseApi_Class<any>) => m.apiDef.v1.metadata)
	async metadata(_params?: unknown): Promise<Metadata<Types['dbItem']>> {
		void _params;
		return {...this.dbModule.dbDef.metadata} as unknown as Metadata<Types['dbItem']>;
	}
}

export const createApisForDBModuleV3 = <Types extends CrudTypes>(dbModule: ModuleBE_BaseDB<Types>, version?: string) => {
	return new ModuleBE_BaseApi_Class<Types>(dbModule, version);
};
