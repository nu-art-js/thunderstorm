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
import {DB_BaseObject, DB_Object, PreDBObject} from '@nu-art/ts-common';
import {BodyApi, QueryApi, HttpMethod, ApiDef,} from '@nu-art/thunderstorm';


export const ApiDef_Upsert: ApiDef<TypedApi_Upsert<any>> = {
	method: HttpMethod.POST,
	path: 'upsert',
};
export const ApiDef_Patch: ApiDef<TypedApi_Patch<any>> = {
	method: HttpMethod.POST,
	path: 'patch',
};
export const ApiDef_Delete: ApiDef<TypedApi_Delete<any>> = {
	method: HttpMethod.GET,
	path: 'delete',
};
export const ApiDef_UniqueQuery: ApiDef<TypedApi_UniqueQuery<any>> = {
	method: HttpMethod.GET,
	path: 'upsert',
};
export const ApiDef_Query: ApiDef<TypedApi_Upsert<any>> = {
	method: HttpMethod.POST,
	path: 'query',
};

export const ApiGen_ApiDefs = {
	Query: ApiDef_Query,
	Upsert: ApiDef_Upsert,
	Patch: ApiDef_Patch,
	Delete: ApiDef_Delete,
	UniqueQuery: ApiDef_UniqueQuery,
};

export const ErrorKey_BadInput = 'bad-input';

export type BadInputErrorBody = { path: string, input?: string };

export type TypedApi_Upsert<DBType extends DB_Object, RequestType extends PreDBObject<DBType> = PreDBObject<DBType>> = BodyApi<DBType, RequestType>;
export type TypedApi_Delete<DBType extends DB_Object> = QueryApi<DBType, DB_BaseObject>;
export type TypedApi_UniqueQuery<DBType extends DB_Object> = QueryApi<DBType, DB_BaseObject>;
export type TypedApi_Patch<DBType extends DB_Object> = BodyApi<DBType, Partial<DBType> & DB_BaseObject>;
export type TypedApi_Query<DBType extends DB_Object> = BodyApi<DBType[], FirestoreQuery<DBType>>;

