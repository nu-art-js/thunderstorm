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

import {BaseDB_ApiGenerator} from "./BaseDB_ApiGenerator";
import {ApiTypeBinder, DeriveBodyType, DeriveQueryType, DeriveResponseType, QueryParams} from "@nu-art/thunderstorm";
import {ApiBinder_DBDelete, ApiBinder_DBPatch, ApiBinder_DBQuery, ApiBinder_DBUniuqe, ApiBinder_DBUpsert, DefaultApiDefs, GenericApiDef, PreDBObject} from "..";
import {Clause_Where, FirestoreQuery} from "@nu-art/firebase";
import {ApiResponse, ExpressRequest, ServerApi} from "@nu-art/thunderstorm/backend";
import {addItemToArray, DB_BaseObject, DB_Object} from "@nu-art/ts-common";

export function resolveUrlPart(dbModule: BaseDB_ApiGenerator<any>, pathPart?: string, pathSuffix?: string) {
	return `${!pathPart ? dbModule.getItemName() : pathPart}${pathSuffix ? "/" + pathSuffix : ""}`;
}

export abstract class GenericServerApi<DBType extends DB_Object, Binder extends ApiTypeBinder<string, R, B, P>, PostProcessor = never, R = DeriveResponseType<Binder>, B = DeriveBodyType<Binder>, P extends QueryParams | {} = DeriveQueryType<Binder>>
	extends ServerApi<Binder> {

	protected readonly dbModule: BaseDB_ApiGenerator<DBType>;
	protected readonly postProcessors: PostProcessor[] = [];

	protected constructor(dbModule: BaseDB_ApiGenerator<DBType>, def: GenericApiDef, pathPart?: string) {
		super(def.method, resolveUrlPart(dbModule, pathPart, def.suffix));
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
	extends GenericServerApi<DBType, ApiBinder_DBUpsert<DBType>, (item: DBType) => DBType> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, DefaultApiDefs.Upsert, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: PreDBObject<DBType>) {
		let toRet = await this.dbModule.upsert(body, undefined, request);
		for (const postProcessor of this.postProcessors) {
			toRet = await postProcessor(toRet);
		}
		return toRet;
	}
}

export class ServerApi_Patch<DBType extends DB_Object>
	extends GenericServerApi<DBType, ApiBinder_DBPatch<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, DefaultApiDefs.Patch, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: DBType): Promise<DBType> {
		return this.dbModule.patch(body, undefined, request);
	}
}

export class ServerApi_Unique<DBType extends DB_Object>
	extends GenericServerApi<DBType, ApiBinder_DBUniuqe<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, DefaultApiDefs.Unique, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DB_BaseObject, body: void): Promise<DBType> {
		return this.dbModule.queryUnique(queryParams as Clause_Where<DBType>, request);
	}
}

export class ServerApi_Query<DBType extends DB_Object>
	extends GenericServerApi<DBType, ApiBinder_DBQuery<DBType>, () => Promise<Partial<DBType>[]>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, DefaultApiDefs.Query, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, query: FirestoreQuery<DBType>): Promise<DBType[]> {
		return this.dbModule.query(query, request);
	}
}

export class ServerApi_Delete<DBType extends DB_Object>
	extends GenericServerApi<DBType, ApiBinder_DBDelete<DBType>> {

	constructor(dbModule: BaseDB_ApiGenerator<DBType>, pathPart?: string) {
		super(dbModule, DefaultApiDefs.Delete, pathPart);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: DB_Object, body: void) {
		return this.dbModule.deleteUnique(queryParams._id, undefined, request);
	}
}
