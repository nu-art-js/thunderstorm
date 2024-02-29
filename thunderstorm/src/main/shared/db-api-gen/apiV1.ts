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
import {DB_BaseObject, DB_Object, DBDef, IndexKeys, Metadata, PreDB} from '@nu-art/ts-common';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi, QueryParams} from '../types';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';


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
export type ApiStruct_DBApiGen<DBType extends DB_Object> = {
	v1: {
		query: BodyApi<DBType[], FirestoreQuery<DBType>, FirestoreQuery<DBType> | undefined | {}>,
		queryUnique: QueryApi<DBType, DB_BaseObject, ResponseError<string, any>, string>,
		upsert: BodyApi<DBType, PreDB<DBType>>,
		upsertAll: BodyApi<DBType[], PreDB<DBType>[]>,
		patch: BodyApi<DBType, PreDB<DBType>>
		delete: QueryApi<DBType, DB_BaseObject>,
		deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>,
		deleteAll: QueryApi<void>
		metadata: QueryApi<Metadata<DBType>>,
	},
}

export type ApiStruct_DBApiGenIDB<DBType extends DB_Object, Ks extends keyof DBType> = {
	v1: {
		query: BodyApi<DBType[], FirestoreQuery<DBType>>,
		queryUnique: QueryApi<DBType, QueryParams, ResponseError<string, any>, string | IndexKeys<DBType, Ks>>,
		upsert: BodyApi<DBType, PreDB<DBType>>,
		upsertAll: BodyApi<DBType[], PreDB<DBType>[]>,
		patch: BodyApi<DBType, IndexKeys<DBType, Ks> & Partial<DBType>>
		delete: QueryApi<DBType, DB_BaseObject>,
		deleteQuery: BodyApi<DBType[], FirestoreQuery<DBType>>,
		deleteAll: QueryApi<DBType[]>,
		metadata: QueryApi<Metadata<DBType>>,
	},
}

export const DBApiDefGenerator = <DBType extends DB_Object>(dbDef: DBDef<DBType, '_id'>): ApiDefResolver<ApiStruct_DBApiGen<DBType>> => {
	return {
		v1: {
			query: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/query`},
			queryUnique: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/patch`},
			delete: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/delete-all`},
			metadata: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/metadata`},
		}
	};
};

export const DBApiDefGeneratorIDB = <DBType extends DB_Object, Ks extends keyof DBType>(dbDef: DBDef<DBType, Ks>): ApiDefResolver<ApiStruct_DBApiGenIDB<DBType, Ks>> => {
	return {
		v1: {
			query: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/query`},
			queryUnique: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/patch`},
			delete: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `v1/${dbDef.dbKey}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/delete-all`},
			metadata: {method: HttpMethod.GET, path: `v1/${dbDef.dbKey}/metadata`},
		}
	};
};

