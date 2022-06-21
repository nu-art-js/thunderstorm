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
	ApiBinder_DBDeleteAll,
	ApiBinder_DBPatch,
	ApiBinder_DBQuery,
	ApiBinder_DBUpsert,
	ApiBinder_DBUpsertAll,
	DBDef,
	DefaultApiDefs,
	GenericApiDef
} from '../../index';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase';
import {
	HOOK_useEffect,
	IndexDb_Query,
	IndexedDB,
	IndexedDBModule,
	IndexKeys,
	StorageKey,
	Thunder,
	ThunderDispatcher,
	XhrHttpModule
} from '@nu-art/thunderstorm/frontend';

import {DB_BaseObject, DB_Object, Module, PreDB} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {EventType_Create, EventType_Delete, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update, EventType_UpsertAll} from '../consts';
import {DBApiFEConfig, getModuleFEConfig} from '../db-def';


export type ApiCallerEventTypeV2<DBType extends DB_Object> = [SingleApiEvent, DBType] | [MultiApiEvent, DBType[]];

export abstract class BaseDB_ApiGeneratorCallerV2<DBType extends DB_Object, Ks extends keyof DBType = '_id', Config extends DBApiFEConfig<DBType, Ks> = DBApiFEConfig<DBType, Ks>>
	extends Module<Config> {
	readonly version = 'v2';

	private readonly errorHandler: RequestErrorHandler<any> = (request: BaseHttpRequest<any>, resError?: ErrorResponse<any>) => {
		if (this.onError(request, resError))
			return;

		return XhrHttpModule.handleRequestFailure(request, resError);
	};

	readonly defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>;
	private db: IndexedDB<DBType, Ks>;
	private lastSync: StorageKey<number>;

	protected constructor(dbDef: DBDef<DBType, Ks>, defaultDispatcher: ThunderDispatcher<any, string, ApiCallerEventTypeV2<DBType>>) {
		super();
		const config = getModuleFEConfig(dbDef);
		this.defaultDispatcher = defaultDispatcher;
		this.setDefaultConfig(config as Config);
		this.db = IndexedDBModule.getOrCreate(this.config.dbConfig);
		this.lastSync = new StorageKey<number>('last-sync--' + this.config.dbConfig.name);
	}

	protected createRequest<Binder extends ApiTypeBinder<any, any, any, any, any>,
		U extends string = Binder['url'],
		R = Binder['response'],
		P extends QueryParams = Binder['params']>(apiDef: GenericApiDef, requestData?: string): BaseHttpRequest<Binder> {

		const request = XhrHttpModule.createRequest<Binder>(apiDef.method, requestData || `request-api--${this.config.key}-${apiDef.key}`)
			.setRelativeUrl(`${this.config.relativeUrl}${apiDef.suffix ? '/' + apiDef.suffix : ''}`)
			.setOnError(this.errorHandler) as BaseHttpRequest<any>;

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

	registerComponent = (action: (...params: ApiCallerEventTypeV2<DBType>) => Promise<void>) => {
		HOOK_useEffect(() => {
			const listener = {
				[this.defaultDispatcher.method]: action
			};

			//@ts-ignore
			Thunder.getInstance().addUIListener(listener);
			return () => {
				//@ts-ignore
				Thunder.getInstance().removeUIListener(listener);
			};
		});
	};

	syncDB = (responseHandler?: ((response: DBType[]) => Promise<void> | void), dispatch = true) => {
		this.query({where: {__updated: {$gte: this.lastSync.get(0)}}}, (items) => {
			if (items.length)
				this.lastSync.set(items[0].__updated);
			return responseHandler?.(items);
		}, `sync-db--${this.config.key}`, dispatch);
	};

	/**
	 * Create or update, depending on existence of its unique key.
	 * @param toUpsert Object to create or update.
	 * @param responseHandler Callback post operation.
	 * @param requestData
	 */
	upsert = (toUpsert: PreDB<DBType>, responseHandler?: ((response: DBType) => Promise<void> | void), errorHandler?: RequestErrorHandler, requestData?: string): BaseHttpRequest<ApiBinder_DBUpsert<DBType>> =>
		this.createUpsertRequest(requestData)
			.setJsonBody(toUpsert)
			.setOnError(errorHandler)
			.execute(async (response) => {
				await this.onEntryUpdated(toUpsert as unknown as DBType, response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});

	upsertAll = (toUpsert: PreDB<DBType>[], responseHandler?: ((response: DBType[]) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBUpsertAll<DBType>> =>
		this.createRequest<ApiBinder_DBUpsertAll<DBType>>(DefaultApiDefs.UpsertAll, requestData)
			.setJsonBody(toUpsert)
			.execute(async (response) => {
				await this.onEntriesUpdated(response);
				if (responseHandler)
					return responseHandler(response);
			});

	createUpsertRequest = (requestData?: string): BaseHttpRequest<ApiBinder_DBUpsert<DBType>> => {
		return this.createRequest<ApiBinder_DBUpsert<DBType>>(DefaultApiDefs.Upsert, requestData);
	};

	patch = (toUpdate: Partial<DBType> & DB_BaseObject, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBPatch<DBType>> => {
		return this.createRequest<ApiBinder_DBPatch<DBType>>(DefaultApiDefs.Patch, requestData)
			.setJsonBody(toUpdate)
			.execute(async response => {
				await this.onEntryPatched(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	query = (query?: FirestoreQuery<DBType>, responseHandler?: ((response: DBType[]) => Promise<void> | void), requestData?: string, dispatch = true): BaseHttpRequest<ApiBinder_DBQuery<DBType>> => {
		let _query = query;
		if (!_query)
			_query = {} as FirestoreQuery<DBType>;

		return this
			.createRequest<ApiBinder_DBQuery<DBType>>(DefaultApiDefs.Query, requestData)
			.setJsonBody(_query)
			.execute(async response => {
				await this.onQueryReturned(response, requestData, dispatch);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	unique = (keys: IndexKeys<DBType, Ks>, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBQuery<DBType>> => {
		const query: FirestoreQuery<DBType> = {
			where: keys as Clause_Where<DBType>,
			limit: 1
		};

		return this
			.createRequest<ApiBinder_DBQuery<DBType>>(DefaultApiDefs.Query, requestData)
			.setJsonBody(query)
			.execute(async response => {
				await this.onGotUnique(response[0], requestData);
				if (responseHandler)
					return responseHandler(response[0]);
			});
	};

	deleteAll = (responseHandler?: (() => Promise<void>) | void): BaseHttpRequest<ApiBinder_DBDeleteAll<DBType>> => {
		return this
			.createRequest<ApiBinder_DBDeleteAll<DBType>>(DefaultApiDefs.DeleteAll)
			.execute(async () => {
				await this.db.deleteAll(); // does not work
				if (responseHandler)
					return responseHandler();
			});
	};

	delete = (_id: string, responseHandler?: ((response: DBType) => Promise<void> | void), requestData?: string): BaseHttpRequest<ApiBinder_DBDelete<DBType>> => {
		return this
			.createRequest<ApiBinder_DBDelete<DBType>>(DefaultApiDefs.Delete, requestData)
			.setJsonBody(undefined)
			.setUrlParams({_id})
			.setOnError(async request => {
				if (request.getStatus() === 404) {
					const item = await this.uniqueQueryCache(_id);
					if (item)
						return await this.onEntryDeleted(item, requestData);
				}

				this.errorHandler(request);
			})
			.execute(async response => {
				await this.onEntryDeleted(response, requestData);
				if (responseHandler)
					return responseHandler(response);
			});
	};

	public getUniqueId = (item: DBType) => item._id;

	public async clearCache(sync = true) {
		this.lastSync.delete();
		await this.db.deleteAll();
		if (sync)
			this.syncDB();
	}

	public async queryCache(query?: string | number | string[] | number[], indexKey?: string): Promise<DBType[]> {
		return (await this.db.query({query, indexKey})) || [];
	}

	/**
	 * Iterates over all DB objects in the related collection.
	 * @param filter boolean returning function, to determine which objects to return.
	 * @param query
	 */
	public async queryFilter(filter: (item: DBType) => boolean, query?: IndexDb_Query): Promise<DBType[]> {
		return await this.db.queryFilter(filter, query);
	}

	public uniqueQueryCache = async (_key?: string | IndexKeys<DBType, Ks>): Promise<DBType | undefined> => {
		if (_key === undefined)
			return _key;

		const key = typeof _key === 'string' ? {_id: _key} as unknown as IndexKeys<DBType, Ks> : _key;
		return this.db.get(key);
	};

	private dispatchSingle = (event: SingleApiEvent, item: DBType) => {
		this.defaultDispatcher?.dispatchModule(event, item);
		this.defaultDispatcher?.dispatchUI(event, item);
	};

	private dispatchMulti = (event: MultiApiEvent, items: DBType[]) => {
		this.defaultDispatcher?.dispatchModule(event, items);
		this.defaultDispatcher?.dispatchUI(event, items);
	};

	protected async onEntryDeleted(item: DBType, requestData?: string): Promise<void> {
		await this.db.delete(item);
		this.dispatchSingle(EventType_Delete, item);
	}

	protected async onEntriesUpdated(items: DBType[], requestData?: string): Promise<void> {
		await this.db.upsertAll(items);
		this.dispatchMulti(EventType_UpsertAll, items.map(item => item));
	}

	protected async onEntryCreated(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Create, item, requestData);
	}

	protected async onEntryUpdated(original: PreDB<DBType>, item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(original._id ? EventType_Update : EventType_Create, item, requestData);
	}

	protected async onEntryPatched(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Patch, item, requestData);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType, requestData?: string): Promise<void> {
		if (item)
			await this.db.upsert(item);

		this.dispatchSingle(event, item);
	}

	protected async onGotUnique(item: DBType, requestData?: string): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Unique, item, requestData);
	}

	protected async onQueryReturned(items: DBType[], requestData?: string, dispatch = true): Promise<void> {
		await this.db.upsertAll(items);
		if (dispatch)
			this.dispatchMulti(EventType_Query, items);
	}
}