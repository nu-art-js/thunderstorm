/*
 * Permissions management system, define access level for each of 
 * your server apis, and restrict users by giving them access levels
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
import {FirestoreQuery} from "@nu-art/firebase";
import {DB_BaseObject, DB_Object, PartialProperties} from "@nu-art/ts-common";
import {ApiWithBody, ApiWithQuery, HttpMethod,} from "@nu-art/thunderstorm";

export type PreDBObject<T extends DB_Object> = PartialProperties<T, "_id" | "__created" | "__updated">

export const DefaultApiDefs: { [k: string]: GenericApiDef; } = {
	Upsert: {
		method: HttpMethod.POST,
		key: "upsert",
		suffix: "create"
	},
	Patch: {
		method: HttpMethod.POST,
		key: "patch",
		suffix: "update"
	},
	Delete: {
		method: HttpMethod.GET, // delete doesn't works, so we changed it to get
		key: "delete",
		suffix: "delete"
	},
	Unique: {
		method: HttpMethod.GET,
		key: "unique",
		suffix: "unique"
	},
	Query: {
		method: HttpMethod.POST,
		key: "query",
		suffix: "query"
	},
};

export const ErrorKey_BadInput = "bad-input";

export type BadInputErrorBody = { path: string, input?: string };

export type GenericApiDef = { method: HttpMethod, key: string, suffix?: string };

export type ApiBinder_DBUpsert<DBType extends DB_Object, RequestType extends PreDBObject<DBType> = PreDBObject<DBType>> = ApiWithBody<string, RequestType, DBType>;
export type ApiBinder_DBDelete<DBType extends DB_Object> = ApiWithQuery<string, DBType, DB_BaseObject>;
export type ApiBinder_DBUniuqe<DBType extends DB_Object> = ApiWithQuery<string, DBType, DB_BaseObject>;
export type ApiBinder_DBPatch<DBType extends DB_Object> = ApiWithBody<string, Partial<DBType> & DB_BaseObject, DBType>;
export type ApiBinder_DBQuery<DBType extends DB_Object> = ApiWithBody<string, FirestoreQuery<DBType>, DBType[]>;

