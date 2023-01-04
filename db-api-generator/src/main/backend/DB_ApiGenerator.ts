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

import {Clause_Where, FirestoreQuery,} from '@nu-art/firebase';
import {__stringify, _values, DB_BaseObject, DB_Object, Module, PreDB} from '@nu-art/ts-common';

import {IndexKeys, QueryParams} from '@nu-art/thunderstorm';
import {ApiDefServer, ApiException, ApiModule, ApiServerRouter, createBodyServerApi, createQueryServerApi, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {_EmptyQuery, ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB, UpgradeCollectionBody} from '../shared';
import {BaseDB_ModuleBE, DBApiConfig} from './BaseDB_ModuleBE';
import {Metadata} from '../shared/types';


/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export class DB_ApiGenerator_Class<DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>
	extends Module
	implements ApiDefServer<ApiStruct_DBApiGenIDB<DBType, Ks>>, ApiModule {

	readonly v1: ApiDefServer<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];
	readonly dbModule: BaseDB_ModuleBE<DBType, any, Ks>;

	constructor(dbModule: BaseDB_ModuleBE<DBType, any, Ks>) {
		super();
		this.dbModule = dbModule;
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbModule.dbDef);
		this.v1 = {
			query: createBodyServerApi(apiDef.v1.query, this._query),
			sync: createBodyServerApi(apiDef.v1.sync, this._sync),
			queryUnique: createQueryServerApi(apiDef.v1.queryUnique, this._queryUnique),
			upsert: createBodyServerApi(apiDef.v1.upsert, this._upsert),
			upsertAll: createBodyServerApi(apiDef.v1.upsertAll, this._upsertAll),
			patch: createBodyServerApi(apiDef.v1.patch, this._patch),
			delete: createQueryServerApi(apiDef.v1.delete, this._deleteUnique),
			deleteQuery: createBodyServerApi(apiDef.v1.deleteQuery, this._deleteQuery),
			deleteAll: createQueryServerApi(apiDef.v1.deleteAll, this._deleteAll),
			upgradeCollection: createBodyServerApi(apiDef.v1.upgradeCollection, this._upgradeCollection),
			metadata: createQueryServerApi(apiDef.v1.metadata, this._metadata),
		};
	}

	useRoutes(): ApiServerRouter<any> {
		return this.v1;
	}

	init() {
	}

	private _metadata = async (): Promise<Metadata<DBType>> => {
		return this.dbModule.dbDef.metadata || `not implemented yet for collection '${this.dbModule.dbDef.dbName}'` as unknown as Metadata<DBType>;
	};

	private _deleteAll = async (ignore?: {}) => this.dbModule.deleteAll();

	private _upgradeCollection = async (body: UpgradeCollectionBody) => {
		const forceUpdate = body.forceUpdate || false;
		// this should be paginated
		let items = (await this.dbModule.collection.query(_EmptyQuery));
		if (!forceUpdate)
			items = items.filter(item => item._v !== this.dbModule.dbDef.versions![0]);
		await this.dbModule.upgradeInstances(items);
		await this.dbModule.upsertAll(items);
	};

	private _sync = async (query: FirestoreQuery<DBType>) => this.dbModule.querySync(query);
	private _deleteQuery = async (query: FirestoreQuery<DBType>): Promise<DBType[]> => {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete(query);
	};

	private _deleteUnique = async (id: DB_BaseObject): Promise<DBType> => this.dbModule.deleteUnique(id._id);

	/*›
 * TO BE MOVED ABOVE THIS COMMENT
 *
 *
 *  -- Everything under this comment should be revised and move up --
 *
 *
 * TO BE MOVED ABOVE THIS COMMENT
 */

	private _upsert = async (instance: PreDB<DBType>, request?: ExpressRequest) => this.dbModule.upsert(instance, undefined, request);

	private _upsertAll = async (instances: PreDB<DBType>[], request?: ExpressRequest) => this.dbModule.upsertAll(instances, undefined, request);

	private _patch = async (instance: IndexKeys<DBType, Ks> & Partial<DBType>, request?: ExpressRequest) => this.dbModule.patch(instance, undefined, request);

	private _query = async (query: FirestoreQuery<DBType>, request?: ExpressRequest) => this.dbModule.query(query, undefined, request);

	private _queryUnique = async (where: QueryParams, request?: ExpressRequest) => this.dbModule.queryUnique(where as Clause_Where<DBType>, undefined, request);

}

export const DB_ApiGenerator = DB_ApiGenerator_Class;
export const createApisForDBModule = <DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>(dbModule: BaseDB_ModuleBE<DBType, ConfigType, Ks>) => {
	return new DB_ApiGenerator_Class<DBType, ConfigType, Ks>(dbModule);
};