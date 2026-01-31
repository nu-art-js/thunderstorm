/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Provides shared API definitions for database operations.
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

import {EntityDependencyError, FirestoreQuery} from '@nu-art/firebase-shared';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';
import {ApiDef, BodyApi, GeneralApi, HttpMethod, QueryApi} from '@nu-art/http-client';
import {Database, DatabasePrototype, IndexKeys} from './types.js';
import {DB_BaseObject} from './types/db-object.js';
import {Metadata} from './types/metadata.js';

/** Maps an API struct to ApiDef at each leaf (recursive). Used by DBApiDefGenerator return type. */
type ApiDefResolver<API_Struct> = API_Struct extends GeneralApi
	? ApiDef<API_Struct>
	: API_Struct extends object
		? { [P in keyof API_Struct]: ApiDefResolver<API_Struct[P]> }
		: never;


/**
 * API structure for database operations (standard version).
 *
 * Defines the complete set of database API endpoints including query, upsert, patch, delete operations.
 *
 * @template Proto - Database prototype type extending DatabasePrototype
 */
export type ApiStruct_DBApiGen<Proto extends DatabasePrototype<any, any, any>> = {
	v1: {
		query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>, FirestoreQuery<Proto['dbType']> | undefined | {}>,
		queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, ResponseError<string, any>, string>,
		upsert: BodyApi<Proto['dbType'], Proto['uiType']>,
		upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>,
		patch: BodyApi<Proto['dbType'], Proto['uiType']>
		delete: QueryApi<Proto['dbType'], DB_BaseObject>,
		deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		deleteAll: QueryApi<void>
		metadata: QueryApi<Metadata<Proto['dbType']>>,
	},
}

/**
 * API structure for database operations with IndexedDB support.
 *
 * Enhanced version that includes IndexedDB-specific query capabilities and error handling.
 *
 * @template Proto - Database prototype type extending DatabasePrototype
 */
export type ApiStruct_DBApiGenIDB<Proto extends DatabasePrototype<any, any, any>> = {
	v1: {
		query: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		queryUnique: QueryApi<Proto['dbType'], DB_BaseObject, ResponseError<string, any>, string | IndexKeys<Proto['dbType'], keyof Proto['dbType']>>,
		upsert: BodyApi<Proto['dbType'], Proto['uiType']>,
		upsertAll: BodyApi<Proto['dbType'][], Proto['uiType'][]>,
		patch: BodyApi<Proto['dbType'], IndexKeys<Proto['dbType'], keyof Proto['dbType']> & Partial<Proto['dbType']>>
		delete: QueryApi<Proto['dbType'] | undefined, DB_BaseObject, EntityDependencyError>,
		deleteQuery: BodyApi<Proto['dbType'][], FirestoreQuery<Proto['dbType']>>,
		deleteAll: QueryApi<Proto['dbType'][]>,
		metadata: QueryApi<Metadata<Proto['dbType']>>,
	},
}

/**
 * Generates API definitions for standard database operations.
 *
 * Creates API endpoint definitions for all database CRUD operations based on the database definition.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations
 */
export const DBApiDefGenerator = <Proto extends DatabasePrototype<any, any, any>>(dbDef: Database<Proto>, version = 'v1'): ApiDefResolver<ApiStruct_DBApiGen<Proto>> => {
	return {
		v1: {
			query: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/query`, timeout: 60000},
			queryUnique: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/patch`},
			delete: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-all`},
			metadata: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/metadata`},
		}
	};
};

/**
 * Generates API definitions for database operations with IndexedDB support.
 *
 * Creates API endpoint definitions optimized for IndexedDB caching and offline support.
 *
 * @template Proto - Database prototype type
 * @param dbDef - Database definition containing dbKey and other metadata
 * @param version - API version string (default: 'v1')
 * @returns API definition resolver for the database operations with IDB support
 */
export const DBApiDefGeneratorIDB = <Proto extends DatabasePrototype<any, any, any>>(dbDef: Database<Proto>, version = 'v1'): ApiDefResolver<ApiStruct_DBApiGenIDB<Proto>> => {
	return {
		v1: {
			query: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/query`, timeout: 60000},
			queryUnique: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/query-unique`},
			upsert: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert`},
			upsertAll: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/upsert-all`},
			patch: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/patch`},
			delete: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-unique`},
			deleteQuery: {method: HttpMethod.POST, path: `${version}/${dbDef.dbKey}/delete`},
			deleteAll: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/delete-all`},
			metadata: {method: HttpMethod.GET, path: `${version}/${dbDef.dbKey}/metadata`},
		}
	};
};
