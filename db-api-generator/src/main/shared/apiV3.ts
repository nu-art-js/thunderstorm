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

import {FirestoreQuery} from '@nu-art/firebase';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_BaseObject, DBDef_V3, DBProto, IndexKeys, Metadata, Second} from '@nu-art/ts-common';
import {Response_DBSync, UpgradeCollectionBody} from './api';

/**
 * !! Workaround !!
 *
 * there is a typescript bug... should be able to use
 *
 * upsert: BodyApi<DBType, PreDB<DBType>>,
 * patch: BodyApi<DBType, PreDB<DBType>>
 *
 * but something about the type resolution goes wrong and instead of seeing Type<GenericType>, it resolves to Type> which makes no sense
 */
export type ApiStruct_DBApiGenV3<Proto extends DBProto<any>> = {
	v1: {
		sync: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, undefined>,
		query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, FirestoreQuery<Proto['dbType']> | undefined | {}>,
		queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, string>,
		upsert: BodyApi<Proto['dbType'],Proto['uiType'] >,
		upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>,
		patch: BodyApi<Proto['dbType'], Proto['uiType']>
		delete: QueryApi<Proto['dbType'], DB_BaseObject>,
		deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		deleteAll: QueryApi<void>
		upgradeCollection: BodyApi<void, UpgradeCollectionBody>, //todo taken from original api file
		metadata: QueryApi<Metadata<Proto['dbType']>>,
	},
}

export type ApiStruct_DBApiGenIDBV3<Proto extends DBProto<any>> = {
	v1: {
		sync: BodyApi<Response_DBSync<Proto['dbType']>, FirestoreQuery<Proto['dbType']>, undefined>, //todo taken from original api file
		query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>>,
		upsert: BodyApi<Proto['dbType'], Proto['uiType']>,
		upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>,
		patch: BodyApi<Proto['dbType'], IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Partial<Proto['dbType']>>
		delete: QueryApi<Proto['dbType'] | undefined, DB_BaseObject>,
		deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		deleteAll: QueryApi<Proto['dbType'][]>,
		upgradeCollection: BodyApi<void, UpgradeCollectionBody>, //todo taken from original api file
		metadata: QueryApi<Metadata<Proto['dbType']>>,
	},
}

export const DBApiDefGeneratorV3 = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): ApiDefResolver<ApiStruct_DBApiGenV3<Proto>> => {
	return {
		v1: {
			sync: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/query`, timeout: 60 * Second},
			query: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/query`},
			queryUnique: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/patch`},
			delete: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-all`},
			upgradeCollection: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upgrade-collection`},
			metadata: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/metadata`},
		}
	};
};

export const DBApiDefGeneratorIDBV3 = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): ApiDefResolver<ApiStruct_DBApiGenIDBV3<Proto>> => {
	return {
		v1: {
			sync: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/sync`, timeout: 60 * Second},
			query: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/query`},
			queryUnique: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/patch`},
			delete: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/delete-all`},
			upgradeCollection: {method: HttpMethod.POST, path: `v1/${dbDef.dbName}/upgrade-collection`},
			metadata: {method: HttpMethod.GET, path: `v1/${dbDef.dbName}/metadata`},
		}
	};
};