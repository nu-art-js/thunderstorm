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

import {BaseDB_ApiGenerator} from './BaseDB_ApiGenerator';
import {ApiDef, TypedApi} from '@nu-art/thunderstorm';
import {
	ApiGen_ApiDefs,
	TypedApi_Delete,
	TypedApi_DeleteAll,
	TypedApi_Patch,
	TypedApi_Query,
	TypedApi_UniqueQuery,
	TypedApi_Upsert,
	TypedApi_UpsertAll
} from '..';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase';
import {ApiResponse, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {addItemToArray, DB_BaseObject, DB_Object, PreDB} from '@nu-art/ts-common';


export function resolveUrlPart(dbModule: BaseDB_ApiGenerator<any, any>, pathPart?: string, pathSuffix?: string) {
	return `${!pathPart ? dbModule.getItemName() : pathPart}${pathSuffix ? '/' + pathSuffix : ''}`;
}

export abstract class GenericServerApi<DBType extends DB_Object, API extends TypedApi<any, any, any, any>, PostProcessor = never>
	extends ServerApi<API> {

	protected readonly dbModule: BaseDB_ApiGenerator<DBType>;
	protected readonly postProcessors: PostProcessor[] = [];

	protected constructor(dbModule: BaseDB_ApiGenerator<DBType>, def: ApiDef<any>, pathPart?: string) {
		super(def.method, resolveUrlPart(dbModule, pathPart, def.path));
		this.dbModule = dbModule;
	}

	addPostProcessor(processor: PostProcessor) {
		addItemToArray(this.postProcessors, processor);
	}

	// protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DeriveQueryType<Binder>, body: DeriveBodyType<Binder>): Promise<DeriveResponseType<Binder>> {
	// 	const toRet = await this._process(request, response, queryParams as P, body as B);
	//
	// 	return toRet as DeriveResponseType<Binder>;
	// }
	//
	// protected abstract async _process(request: ExpressRequest, response: ApiResponse, queryParams: P, body: B): Promise<R>;

}

export class ServerApi_Upsert<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_Upsert<DBType>, (item: DBType) => DBType> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.Upsert, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: PreDB<DBType>) {
		let toRet = await this.dbModule.upsert(body, undefined, request);
		for (const postProcessor of this.postProcessors) {
			toRet = await postProcessor(toRet);
		}
		return toRet;
	}
}

export class ServerApi_UpsertAll<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_UpsertAll<DBType>, (item: DBType) => DBType> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.UpsertAll, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: PreDB<DBType>[]) {
		return await this.dbModule.upsertAll(body, undefined, request);
	}
}

export class ServerApi_Patch<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_Patch<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.Patch, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: DBType): Promise<DBType> {
		return this.dbModule.patch(body, undefined, request);
	}
}

export class ServerApi_Unique<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_UniqueQuery<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.UniqueQuery, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DB_BaseObject, body: void): Promise<DBType> {
		return this.dbModule.queryUnique(queryParams as Clause_Where<DBType>, undefined, request);
	}
}

export class ServerApi_Query<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_Query<DBType>, () => Promise<Partial<DBType>[]>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.Query, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, query: FirestoreQuery<DBType>): Promise<DBType[]> {
		return this.dbModule.query(query, undefined, request);
	}
}

export class ServerApi_DeleteAll<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_DeleteAll<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.DeleteAll, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DB_Object, body: void) {
		return this.dbModule.deleteAll(request);
	}
}

export class ServerApi_Delete<DBType extends DB_Object>
	extends GenericServerApi<DBType, TypedApi_Delete<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, ApiGen_ApiDefs.Delete, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DB_Object, body: void) {
		return this.dbModule.deleteUnique(queryParams._id, undefined, request);
	}
}
