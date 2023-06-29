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

import {
	__stringify,
	_values,
	ApiException,
	DB_BaseObject,
	DB_Object,
	DB_Object_Metadata,
	Metadata,
	Module,
	PreDB
} from '@nu-art/ts-common';

import {IndexKeys, QueryParams} from '@nu-art/thunderstorm';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {_EmptyQuery, DBApiDefGeneratorIDB, UpgradeCollectionBody} from '../shared';
import {DBApiConfig, ModuleBE_BaseDB} from './ModuleBE_BaseDB';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase';


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

	private _deleteAll = async (ignore: {}, mem: MemStorage) => this.dbModule.deleteAll(mem);

	private _upgradeCollection = async (body: UpgradeCollectionBody, mem: MemStorage) => {
		const forceUpdate = body.forceUpdate || false;
		// this should be paginated
		let items = (await this.dbModule.collection.query(_EmptyQuery)) as DBType[];
		if (!forceUpdate)
			items = items.filter(item => item._v !== this.dbModule.dbDef.versions![0]);
		await this.dbModule.upgradeInstances(items, mem);
		await this.dbModule.upsertAll(items, mem);
	};

	private _sync = async (query: FirestoreQuery<DBType>, mem: MemStorage) => this.dbModule.querySync(query, mem);
	private _deleteQuery = async (query: FirestoreQuery<DBType>, mem: MemStorage): Promise<DBType[]> => {
		if (!query.where)
			throw new ApiException(400, `Cannot delete without a where clause, using query: ${__stringify(query)}`);

		if (_values(query.where).filter(v => v === undefined || v === null).length > 0)
			throw new ApiException(400, `Cannot delete with property value undefined or null, using query: ${__stringify(query)}`);

		return this.dbModule.delete(query, mem);
	};

	private _deleteUnique = async (id: DB_BaseObject, mem: MemStorage): Promise<DBType> => this.dbModule.deleteUnique(id._id, mem);

	/*›
 * TO BE MOVED ABOVE THIS COMMENT
 *
 *
 *  -- Everything under this comment should be revised and move up --
 *
 *
 * TO BE MOVED ABOVE THIS COMMENT
 */

	private _upsert = async (instance: PreDB<DBType>, mem: MemStorage) => this.dbModule.upsert(instance, mem);

	private _upsertAll = async (instances: PreDB<DBType>[], mem: MemStorage) => this.dbModule.upsertAll(instances, mem);

	private _patch = async (instance: IndexKeys<DBType, Ks> & Partial<DBType>, mem: MemStorage) => this.dbModule.patch(instance, mem);

	private _query = async (query: FirestoreQuery<DBType>, mem: MemStorage) => this.dbModule.query(query, mem);

	private _queryUnique = async (where: QueryParams, mem: MemStorage) => this.dbModule.queryUnique(where as Clause_Where<DBType>, mem);

}

export const createApisForDBModule = <DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>(dbModule: ModuleBE_BaseDB<DBType, ConfigType, Ks>) => {
	return new ModuleBE_BaseApi_Class<DBType, ConfigType, Ks>(dbModule);
};