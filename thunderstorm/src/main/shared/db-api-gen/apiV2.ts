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
import {DB_BaseObject, DB_Object, DBDef, IndexKeys, Metadata, PreDB, Second} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '../types';
import {Response_DBSync, UpgradeCollectionBody} from './apiV1';

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
export type ApiStruct_DBApiGenV2<DBType extends DB_Object> = {
	v1: {
		sync: BodyApi<DBType[], FirestoreQuery<DBType>, undefined>,
		query: BodyApi<DBType[], FirestoreQuery<DBType>, FirestoreQuery<DBType> | undefined | {}>,
		queryUnique: QueryApi<DBType, DB_BaseObject, string>,
		upsert: BodyApi<DBType, PreDB<DBType>>,
		upsertAll: BodyApi<DBType[], PreDB<DBType>[]>,
		patch: BodyApi<DBType, PreDB<DBType>>
		delete: QueryApi<DBType, DB_BaseObject>,
		deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>,
		deleteAll: QueryApi<void>
		upgradeCollection: BodyApi<void, UpgradeCollectionBody>, //todo taken from original api file
		metadata: QueryApi<Metadata<DBType>>,
	},
}

export type ApiStruct_DBApiGenIDBV2<DBType extends DB_Object, Ks extends keyof DBType> = {
	v1: {
		sync: BodyApi<Response_DBSync<DBType>, FirestoreQuery<DBType>, undefined>, //todo taken from original api file
		query: BodyApi<DBType[], FirestoreQuery<DBType>>,
		queryUnique: QueryApi<DBType, DB_BaseObject, string | IndexKeys<DBType, Ks>>,
		upsert: BodyApi<DBType, PreDB<DBType>>,
		upsertAll: BodyApi<DBType[], PreDB<DBType>[]>,
		patch: BodyApi<DBType, IndexKeys<DBType, Ks> & Partial<DBType>>
		delete: QueryApi<DBType | undefined, DB_BaseObject>,
		deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>,
		deleteAll: QueryApi<DBType[]>,
		upgradeCollection: BodyApi<void, UpgradeCollectionBody>, //todo taken from original api file
		metadata: QueryApi<Metadata<DBType>>,
	},
}

export const DBApiDefGeneratorV2 = <DBType extends DB_Object>(dbDef: DBDef<DBType, '_id'>): ApiDefResolver<ApiStruct_DBApiGenV2<DBType>> => {
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

export const DBApiDefGeneratorIDBV2 = <DBType extends DB_Object, Ks extends keyof DBType>(dbDef: DBDef<DBType, Ks>): ApiDefResolver<ApiStruct_DBApiGenIDBV2<DBType, Ks>> => {
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