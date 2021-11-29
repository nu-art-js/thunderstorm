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

import {
	ApiTypeBinder,
	BaseHttpRequest,
	DeriveBodyType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	ErrorResponse,
	QueryParams,
	RequestErrorHandler
} from "@nu-art/thunderstorm";
import {ApiBinder_DBDelete, ApiBinder_DBPatch, ApiBinder_DBQuery, ApiBinder_DBUpsert, DefaultApiDefs, GenericApiDef, PreDBObject} from "../index";
import {Clause_Where, DB_Object, FirestoreQuery} from "@nu-art/firebase";
import {DBConfig, IndexedDB, IndexedDBModule, IndexKeys, StorageKey, ThunderDispatcher, XhrHttpModule} from "@nu-art/thunderstorm/frontend";

import {compare, DB_BaseObject, Module} from "@nu-art/ts-common";
import {MultiApiEvent, SingleApiEvent} from "./types";

export type BaseApiConfigV2<DBType extends DB_Object, Ks extends keyof DBType = "_id"> = {
	relativeUrl: string
	key: string
	dbConfig: DBConfig<DBType, Ks>
}


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export abstract class BaseDB_ApiGeneratorCallerV2<DBType extends DB_Object, Ks extends keyof DBType = "_id", Config extends BaseApiConfigV2<DBType, Ks> = BaseApiConfigV2<DBType, Ks>>
	extends Module<Config> {

	private readonly errorHandler: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		if (this.onError(request, resError))
			return;

		return XhrHttpModule.handleRequestFailure(request, resError);
	};

	private defaultDispatcher?: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>;
	private db: IndexedDB<DBType, Ks>;
	private lastSync: StorageKey<number>;

	constructor(config: Config & { dbConfig?: DBConfig<DBType, Ks> }) {
		super();
		if (!config.dbConfig)
			config.dbConfig = {
				version: 1,
				name: config.key,
				autoIncrement: false,
				uniqueKeys: ["_id"] as Ks[]
			}

		this.setDefaultConfig(config);
		this.db = IndexedDBModule.getOrCreate(this.config.dbConfig);
		this.lastSync = new StorageKey<number>("last-sync--" + this.config.dbConfig.name);
	}

	getDefaultDispatcher() {
		return this.defaultDispatcher;
	}

	setDefaultDispatcher(defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		this.defaultDispatcher = defaultDispatcher;
	}

	protected createRequest<Binder extends ApiTypeBinder<U, R, B, P, any> = ApiTypeBinder<void, void, void, {}, any>,
		U extends string = DeriveUrlType<Binder>,
		R = DeriveResponseType<Binder>,
		B = DeriveBodyType<Binder>,
		P extends QueryParams = DeriveQueryType<Binder>>(apiDef: GenericApiDef, body?: B, requestData?: string): BaseHttpRequest<Binder> {

		const request = XhrHttpModule
			.createRequest(apiDef.method, requestData || `request-api--${this.config.key}-${apiDef.key}`)
			.setRelativeUrl(`${this.config.relativeUrl}${apiDef.suffix ? "/" + apiDef.suffix : ""}`)
			.setOnError(this.errorHandler) as BaseHttpRequest<any>;

		if (body)
			request.setJsonBody(body)

		const timeout = this.timeoutHandler(apiDef);
		if (timeout)
			request.setTimeout(timeout);

		return request;
	}

	protected timeoutHandler(apiDef: GenericApiDef): number | void {
	}

	protected onError(request: BaseHttpRequest<any>, resError?: ErrorResponse<any>): boolean {
		return false;
	}

	syncDB = (responseHandler?: ((response: DBType[]) => Promise<void> | void)) => {
		// locally indexing and sorting is not working????
		// {where: {__updated: {$gte: this.lastSync.get(0)}}, orderBy: [{key: "__updated", order: "desc"}]}

		// this.query({where: {__updated: {$gte: this.lastSync.get(0)}}, orderBy: [{key: "__updated", order: "desc"}]}, (items) => {
		this.query({where: {}}, (items) => {
			if (!items.length)
				return;

			this.lastSync.set(items[0].__updated);
			return responseHandler?.(items);
		})
	}

	upsert = (toUpsert: PreDBObject<DBType>, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBUpsert<DBType>> =>
		this.createRequest<ApiBinder_DBUpsert<DBType>>(DefaultApiDefs.Upsert, toUpsert, requestData)
			.execute(async (response: DBType) => {
				await this.onEntryUpdated({...toUpsert, _id: response._id} as unknown as DBType, response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});

	patch = (toUpdate: Partial<DBType> & DB_BaseObject, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBPatch<DBType>> => {
		return this.createRequest<ApiBinder_DBPatch<DBType>>(DefaultApiDefs.Patch, toUpdate, requestData)
			.execute(async response => {
				await this.onEntryPatched(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	query = (query?: FirestoreQuery<DBType>, responseHandler?: ((response: DBType[]) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBQuery<DBType>> => {
		let _query = query;
		if (!_query)
			_query = {} as FirestoreQuery<DBType>;

		return this
			.createRequest<ApiBinder_DBQuery<DBType>>(DefaultApiDefs.Query, _query, requestData)
			.execute(async response => {
				await this.onQueryReturned(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};


	unique = (keys: IndexKeys<DBType, Ks>, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBQuery<DBType>> => {
		const query: FirestoreQuery<DBType> = {
			where: keys as Clause_Where<DBType>,
			limit: 1
		}

		return this
			.createRequest<ApiBinder_DBQuery<DBType>>(DefaultApiDefs.Query, query, requestData)
			.execute(async response => {
				await this.onGotUnique(response[0], requestData);
				if (responseHandler)
					return responseHandler(response[0]);
			});
	};

	delete = (_id: string, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBDelete<DBType>> => {
		return this
			.createRequest<ApiBinder_DBDelete<DBType>>(DefaultApiDefs.Delete, undefined, requestData)
			.setUrlParams({_id})
			.execute(async response => {
				await this.onEntryDeleted(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	public getUniqueId = (item: DBType) => item._id;

	public async queryCache(query?: string | number | string[] | number[], indexKey?: string): Promise<DBType[]> {
		return (await this.db.query(query, indexKey)) || [];
	}

	public uniqueQueryCache = async (_key?: string | IndexKeys<DBType, Ks>): Promise<DBType | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === "string" ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key
		return this.db.get(key);
	};

	private dispatchSingle = (event: SingleApiEvent, item: DBType) => {
		this.defaultDispatcher?.dispatchModule([event, item]);
		this.defaultDispatcher?.dispatchUI([event, item]);
	};

	private dispatchMulti = (event: MultiApiEvent, items: DBType[]) => {
		this.defaultDispatcher?.dispatchModule([event, items]);
		this.defaultDispatcher?.dispatchUI([event, items]);
	};

	protected async onEntryDeleted(item: DBType, requestData?: string): Promise<void> {
		await this.db.delete(item);
		this.dispatchSingle("delete", item);
	}

	protected async onEntriesUpdated(items: DBType[], requestData?: string): Promise<void> {
		await this.db.upsertAll(items);
		this.dispatchMulti("multi-update", items.map(item => item));
	}

	protected async onEntryCreated(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl("create", item, requestData);
	}

	protected async onEntryUpdated(original: DBType, item: DBType, requestData?: string): Promise<void> {
		if (!compare(item, original))
			this.logWarning("Hmmmm.. queried value not what was expected!");

		return this.onEntryUpdatedImpl("update", item, requestData);
	}

	protected async onEntryPatched(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl("patch", item, requestData);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType, requestData?: string): Promise<void> {
		if (item)
			await this.db.upsert(item);
		this.dispatchSingle(event, item);
	}

	protected async onGotUnique(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl("unique", item, requestData);
	}

	protected async onQueryReturned(items: DBType[], requestData?: string): Promise<void> {
		await this.db.upsertAll(items);
		this.dispatchMulti("query", items);
	}
}
