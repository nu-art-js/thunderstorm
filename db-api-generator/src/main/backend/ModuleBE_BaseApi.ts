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
import {addRoutes, ApiException, createBodyServerApi, createQueryServerApi, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {_EmptyQuery, DBApiDefGeneratorIDB, UpgradeCollectionBody} from '../shared';
import {DB_Object_Metadata, Metadata} from '../shared/types';
import {DBApiConfig, ModuleBE_BaseDB} from './ModuleBE_BaseDB';


/**
 * A base class used for implementing CRUD operations on a db module collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export class ModuleBE_BaseApi_Class<DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>
	extends Module {

	readonly dbModule: ModuleBE_BaseDB<DBType, any, Ks>;

	constructor(dbModule: ModuleBE_BaseDB<DBType, any, Ks>) {
		super(dbModule.getName());
		this.dbModule = dbModule;
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbModule.dbDef);
		addRoutes([
			createBodyServerApi(apiDef.v1.query, this._query),
			createBodyServerApi(apiDef.v1.sync, this._sync),
			createQueryServerApi(apiDef.v1.queryUnique, this._queryUnique),
			createBodyServerApi(apiDef.v1.upsert, this._upsert),
			createBodyServerApi(apiDef.v1.upsertAll, this._upsertAll),
			createBodyServerApi(apiDef.v1.patch, this._patch),
			createQueryServerApi(apiDef.v1.delete, this._deleteUnique),
			createBodyServerApi(apiDef.v1.deleteQuery, this._deleteQuery),
			createQueryServerApi(apiDef.v1.deleteAll, this._deleteAll),
			createBodyServerApi(apiDef.v1.upgradeCollection, this._upgradeCollection),
			createQueryServerApi(apiDef.v1.metadata, this._metadata)
		]);
	}

	init() {
	}

	private _metadata = async (): Promise<Metadata<DBType>> => {
		return {...this.dbModule.dbDef.metadata, ...DB_Object_Metadata} as Metadata<DBType> || `not implemented yet for collection '${this.dbModule.dbDef.dbName}'`;
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

	private _sync = async (query: FirestoreQuery<DBType>, request: ExpressRequest) => this.dbModule.querySync(query, request);
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

export const createApisForDBModule = <DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>(dbModule: ModuleBE_BaseDB<DBType, ConfigType, Ks>) => {
	return new ModuleBE_BaseApi_Class<DBType, ConfigType, Ks>(dbModule);
};

export const DB_ApiGenerator = ModuleBE_BaseApi_Class;
