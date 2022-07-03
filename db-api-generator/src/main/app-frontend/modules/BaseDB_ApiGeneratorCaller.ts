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

import {ApiDef, BaseHttpRequest, ErrorResponse, RequestErrorHandler, TypedApi} from '@nu-art/thunderstorm';
import {
	ApiGen_ApiDefs,
	DBDef,
	TypedApi_Delete,
	TypedApi_DeleteAll,
	TypedApi_Patch,
	TypedApi_Query,
	TypedApi_UniqueQuery,
	TypedApi_Upsert,
	TypedApi_UpsertAll,
} from '../shared';
import {FirestoreQuery} from '@nu-art/firebase';
import {ThunderDispatcher, XhrHttpModule} from '@nu-art/thunderstorm/frontend';

import {_keys, addItemToArray, DB_BaseObject, DB_Object, Module, PreDB, removeItemFromArray} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {EventType_Create, EventType_Delete, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update, EventType_UpsertAll} from '../consts';
import {getModuleFEConfig} from '../db-def';


export type BaseApiConfig = {
	relativeUrl: string
	key: string
}

export type ApiCallerEventType = [SingleApiEvent, string, boolean] | [MultiApiEvent, string[], boolean];

export abstract class BaseDB_ApiGeneratorCaller<DBType extends DB_Object, Config extends BaseApiConfig = BaseApiConfig>
	extends Module<BaseApiConfig> {
	readonly version = 'v1';

	private readonly errorHandler: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		if (this.onError(request, resError))
			return;

		return XhrHttpModule.handleRequestFailure(request, resError);
	};

	private defaultDispatcher?: ThunderDispatcher<any, string, ApiCallerEventType>;

	constructor(dbDef: DBDef<DBType>) {
		super();
		const config = getModuleFEConfig(dbDef);

		this.setDefaultConfig(config);
	}

	getDefaultDispatcher() {
		return this.defaultDispatcher;
	}

	setDefaultDispatcher(defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventType>) {
		this.defaultDispatcher = defaultDispatcher;
	}

	protected createRequest<API extends TypedApi<any, any, any, any>>(apiDef: ApiDef<any>, body?: API['B'], requestData?: string): BaseHttpRequest<API> {

		const request = XhrHttpModule.createRequest<API>(apiDef.method, requestData || `request-api--${this.config.key}-${apiDef.path}`)
			.setRelativeUrl(`${this.config.relativeUrl}${apiDef.path ? '/' + apiDef.path : ''}`)
			.setOnError(this.errorHandler) as BaseHttpRequest<any>;

		if (body)
			request.setJsonBody(body);

		const timeout = this.timeoutHandler(apiDef);
		if (timeout)
			request.setTimeout(timeout);

		return request;
	}

	protected timeoutHandler(apiDef: ApiDef<any>): number | void {
	}

	protected onError(request: BaseHttpRequest<any>, resError?: ErrorResponse<any>): boolean {
		return false;
	}

	upsert = (toUpsert: PreDB<DBType>, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_Upsert<DBType>> =>
		this.createRequest<TypedApi_Upsert<DBType>>(ApiGen_ApiDefs.Upsert, toUpsert, requestData)
			.execute(async (response) => {
				await this.onEntryUpdated({...toUpsert, _id: response._id} as unknown as DBType, response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});

	upsertAll = (toUpsert: PreDB<DBType>[], responseHandler?: ((response: DBType[]) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_UpsertAll<DBType>> =>
		this.createRequest<TypedApi_UpsertAll<DBType>>(ApiGen_ApiDefs.UpsertAll, toUpsert, requestData)
			.execute(async (response) => {
				await this.onEntriesUpdated(response);
				if (responseHandler)
					return responseHandler(response);
			});

	patch = (toUpdate: Partial<DBType> & DB_BaseObject, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_Patch<DBType>> => {
		return this.createRequest<TypedApi_Patch<DBType>>(ApiGen_ApiDefs.Patch, toUpdate, requestData)
			.execute(async response => {
				await this.onEntryPatched(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	query = (query?: FirestoreQuery<DBType>, responseHandler?: ((response: DBType[]) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_Query<DBType>> => {
		let _query = query;
		if (!_query)
			_query = {} as FirestoreQuery<DBType>;

		return this
			.createRequest<TypedApi_Query<DBType>>(ApiGen_ApiDefs.Query, _query, requestData)
			.execute(async response => {
				await this.onQueryReturned(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	unique = (_id: string, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_UniqueQuery<DBType>> => {
		return this
			.createRequest<TypedApi_UniqueQuery<DBType>>(ApiGen_ApiDefs.UniqueQuery, undefined, requestData)
			.setUrlParams({_id})
			.execute(async response => {
				await this.onGotUnique(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	deleteAll = (responseHandler?: (() => Promise<void>) | void): BaseHttpRequest<TypedApi_DeleteAll<DBType>> => {
		return this
			.createRequest<TypedApi_DeleteAll<DBType>>(ApiGen_ApiDefs.DeleteAll)
			.execute(async () => {
				if (responseHandler)
					return responseHandler();
			});
	};

	delete = (_id: string, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<TypedApi_Delete<DBType>> => {
		return this
			.createRequest<TypedApi_Delete<DBType>>(ApiGen_ApiDefs.Delete, undefined, requestData)
			.setUrlParams({_id})
			.setOnError(() => this.dispatchSingle(EventType_Delete, _id, false))
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

	private dispatchSingle = (event: SingleApiEvent, itemId: string, success = true) => {
		this.defaultDispatcher?.dispatchModule(event, itemId, success);
		this.defaultDispatcher?.dispatchUI(event, itemId, success);
	};

	private dispatchMulti = (event: MultiApiEvent, itemId: string[], success = true) => {
		this.defaultDispatcher?.dispatchModule(event, itemId, success);
		this.defaultDispatcher?.dispatchUI(event, itemId, success);
	};

	protected async onEntryDeleted(item: DBType, requestDaTS_FilterInputta?: string): Promise<void> {
		removeItemFromArray(this.ids, item._id);
		delete this.items[item._id];

		this.dispatchSingle(EventType_Delete, item._id);
	}

	protected async onEntriesUpdated(items: DBType[], requestData?: string): Promise<void> {
		items.forEach(item => {
			if (!this.ids.includes(item._id))
				addItemToArray(this.ids, item._id);

			this.items[item._id] = item;
		});

		this.dispatchMulti(EventType_UpsertAll, items.map(item => item._id));
	}

	protected async onEntryCreated(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Create, item, requestData);
	}

	protected async onEntryUpdated(original: DBType, item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Update, item, requestData);
	}

	protected async onEntrysUpdated(original: DBType, item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Update, item, requestData);
	}

	protected async onEntryPatched(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Patch, item, requestData);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType, requestData?: string): Promise<void> {
		if (!this.ids.includes(item._id))
			addItemToArray(this.ids, item._id);

		this.items[item._id] = item;
		this.dispatchSingle(event, item._id);
	}

	protected async onGotUnique(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Unique, item, requestData);
	}

	protected async onQueryReturned(items: DBType[], requestData?: string): Promise<void> {
		this.items = items.reduce((toRet, item) => {
			toRet[item._id] = item;
			return toRet;
		}, this.items);

		this.ids = _keys(this.items);

		this.dispatchMulti(EventType_Query, this.ids);
	}
}
