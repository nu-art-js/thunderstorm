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

import {EntityDependencyError} from '@nu-art/firebase-shared';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';
import {ApiDef, BodyApi, HttpMethod, QueryApi} from '@nu-art/http-client';
import {IndexKeys} from './types.js';
import {DB_BaseObject} from './types/db-object.js';
import type {DB_Object, ValidatorTypeResolver} from '@nu-art/ts-common';
import type {CrudQuery} from './query-types.js';

export type CrudTypes<
	DBKey extends string = string,
	DBItem extends DB_Object = DB_Object,
	UIItem extends object & { _id?: string } = object & { _id?: string },
	Validator extends ValidatorTypeResolver<UIItem> = ValidatorTypeResolver<UIItem>,
	UniqueKeys extends (keyof DBItem)[] = (keyof DBItem)[]
> = {
	readonly dbKey: DBKey;
	readonly dbItem: DBItem;
	readonly uiItem: UIItem;
	readonly validator: Validator;
	readonly uniqueKeys: UniqueKeys;
};

/** Flat CRUD API defs object returned by DBApiDefGeneratorIDB (no v1 wrapper). Generic so ApiHandler infers payload types. */
export type CrudApiTypes<Types extends CrudTypes = CrudTypes> = {
	query: BodyApi<Types['dbItem'][], CrudQuery<Types['dbItem']>>;
	queryUnique: QueryApi<Types['dbItem'], DB_BaseObject, ResponseError<string, unknown>, string | IndexKeys<Types['dbItem'], keyof Types['dbItem']>>;
	upsert: BodyApi<Types['dbItem'], Types['uiItem']>;
	upsertAll: BodyApi<Types['dbItem'][], Types['uiItem'][]>;
	deleteUnique: QueryApi<Types['dbItem'] | undefined, DB_BaseObject, EntityDependencyError>;
	deleteQuery: BodyApi<Types['dbItem'][], CrudQuery<Types['dbItem']>>;
	deleteAll: QueryApi<Types['dbItem'][]>;
};

export type CrudApiDef_Type<Types extends CrudTypes = CrudTypes> = {
	query: ApiDef<CrudApiTypes<Types>['query']>
	queryUnique: ApiDef<CrudApiTypes<Types>['queryUnique']>
	upsert: ApiDef<CrudApiTypes<Types>['upsert']>
	upsertAll: ApiDef<CrudApiTypes<Types>['upsertAll']>
	deleteUnique: ApiDef<CrudApiTypes<Types>['deleteUnique']>
	deleteQuery: ApiDef<CrudApiTypes<Types>['deleteQuery']>
	deleteAll: ApiDef<CrudApiTypes<Types>['deleteAll']>
};


export function CrudApiDef<Types extends CrudTypes>(dbKey: string, version = 'v1'): CrudApiDef_Type<Types> {
	return {
		query: {method: HttpMethod.POST, path: `${version}/${dbKey}/query`, timeout: 60000},
		queryUnique: {method: HttpMethod.GET, path: `${version}/${dbKey}/query-unique`},
		upsert: {method: HttpMethod.POST, path: `${version}/${dbKey}/upsert`},
		upsertAll: {method: HttpMethod.POST, path: `${version}/${dbKey}/upsert-all`},
		deleteUnique: {method: HttpMethod.GET, path: `${version}/${dbKey}/delete-unique`},
		deleteQuery: {method: HttpMethod.POST, path: `${version}/${dbKey}/delete-query`},
		deleteAll: {method: HttpMethod.GET, path: `${version}/${dbKey}/delete-all`},
	};
}
