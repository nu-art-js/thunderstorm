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

import {ApiTypeBinder, BaseHttpRequest, ErrorResponse, QueryParams, RequestErrorHandler} from '@nu-art/thunderstorm';
import {
	ApiBinder_DBDelete,
	ApiBinder_DBPatch,
	ApiBinder_DBQuery,
	ApiBinder_DBUniuqe,
	ApiBinder_DBUpsert,
	DefaultApiDefs,
	GenericApiDef,
} from '../../index';
import {FirestoreQuery} from '@nu-art/firebase';
import {ThunderDispatcher, XhrHttpModule} from '@nu-art/thunderstorm/frontend';

import {_keys, addItemToArray, compare, DB_BaseObject, Module, removeItemFromArray, DB_Object, PreDBObject} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {EventType_Create, EventType_Delete, EventType_MultiUpdate, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update} from '../consts';

export type BaseApiConfig = {
	relativeUrl: string
	key: string
}

export type ApiCallerEventType = [SingleApiEvent, string, boolean] | [MultiApiEvent, string[], boolean];

export abstract class BaseDB_ApiGeneratorCaller<DBType extends DB_Object, Config extends BaseApiConfig = BaseApiConfig>
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

	protected createRequest<Binder extends ApiTypeBinder<any, any, any, any>,
		U extends string = Binder['url'],
		R = Binder['response'],
		B = Binder['body'],
		P extends QueryParams = Binder['params']>(apiDef: GenericApiDef, body?: B, requestData?: string): BaseHttpRequest<Binder> {

		const request = XhrHttpModule.createRequest<Binder>(apiDef.method, requestData || `request-api--${this.config.key}-${apiDef.key}`)
			.setRelativeUrl(`${this.config.relativeUrl}${apiDef.suffix ? '/' + apiDef.suffix : ''}`)
			.setOnError(this.errorHandler) as BaseHttpRequest<any>;

		if (body)
			request.setJsonBody(body);

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
			.execute(async (response) => {
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

		this.dispatchMulti(EventType_MultiUpdate, items.map(item => item._id));
	}

	protected async onEntryCreated(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Create, item, requestData);
	}

	protected async onEntryUpdated(original: DBType, item: DBType, requestData?: string): Promise<void> {
		if (!compare(item, original))
			this.logWarning('Hmmmm.. queried value not what was expected!');

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
