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
import {
	ApiBinder_DBDelete,
	ApiBinder_DBPatch,
	ApiBinder_DBQuery,
	ApiBinder_DBUniuqe,
	ApiBinder_DBUpsert,
	DefaultApiDefs,
	GenericApiDef,
	PreDBObject
} from "../index";
import {DB_Object, FirestoreQuery} from "@nu-art/firebase";
import {ThunderDispatcher, XhrHttpModule} from "@nu-art/thunderstorm/frontend";

import {_keys, addItemToArray, compare, DB_BaseObject, Module, removeItemFromArray} from "@nu-art/ts-common";

export type BaseApiConfig = {
	relativeUrl: string
	key: string
}

export type SingleApiEvent = "create" | "update" | "unique" | "delete" | "patch"
export type MultiApiEvent = "query" | "multi-update"

export type ApiCallerEventType = [SingleApiEvent, string] | [MultiApiEvent, string[]];

export abstract class BaseDB_ApiGeneratorCaller<DBType extends DB_Object>
	extends Module<BaseApiConfig> {

	private readonly errorHandler: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		if (this.onError(request, resError))
			return;

		return XhrHttpModule.handleRequestFailure(request, resError);
	};

	private defaultDispatcher?: ThunderDispatcher<any, string, ApiCallerEventType>;

	constructor(config: BaseApiConfig) {
		super();
		this.setDefaultConfig(config);
	}

	getDefaultDispatcher() {
		return this.defaultDispatcher;
	}

	setDefaultDispatcher(defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType>) {
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


	unique = (_id: string, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBUniuqe<DBType>> => {
		return this
			.createRequest<ApiBinder_DBUniuqe<DBType>>(DefaultApiDefs.Unique, undefined, requestData)
			.setUrlParams({_id})
			.execute(async response => {
				await this.onGotUnique(response, requestData);
				if (responseHandler)
					return responseHandler(response);
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


	private ids: string[] = [];
	private items: { [k: string]: DBType } = {};

	public getId = (item: DBType) => item._id;

	public getItems = () => this.ids.map(id => this.items[id]);

	public getItem = (id?: string): DBType | undefined => id ? this.items[id] : undefined;

	private dispatchSingle = (event: SingleApiEvent, itemId: string) => {
		this.defaultDispatcher?.dispatchModule([event, itemId]);
		this.defaultDispatcher?.dispatchUI([event, itemId]);
	};

	private dispatchMulti = (event: MultiApiEvent, itemId: string[]) => {
		this.defaultDispatcher?.dispatchModule([event, itemId]);
		this.defaultDispatcher?.dispatchUI([event, itemId]);
	};

	protected async onEntryDeleted(item: DBType, requestData?: string): Promise<void> {
		removeItemFromArray(this.ids, item._id);
		delete this.items[item._id];

		this.dispatchSingle("delete", item._id);
	}

	protected async onEntriesUpdated(items: DBType[], requestData?: string): Promise<void> {
		items.forEach(item => {
			if (!this.ids.includes(item._id))
				addItemToArray(this.ids, item._id);

			this.items[item._id] = item;
		})

		this.dispatchMulti("multi-update", items.map(item => item._id));
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
		if (!this.ids.includes(item._id))
			addItemToArray(this.ids, item._id);

		this.items[item._id] = item;
		this.dispatchSingle(event, item._id);
	}

	protected async onGotUnique(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl("unique", item, requestData);
	}

	protected async onQueryReturned(items: DBType[], requestData?: string): Promise<void> {
		this.items = items.reduce((toRet, item) => {
			toRet[item._id] = item;
			return toRet;
		}, this.items);

		this.ids = _keys(this.items);

		this.dispatchMulti("query", this.ids);
	}
}
