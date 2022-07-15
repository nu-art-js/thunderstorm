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

import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiStruct_DBApiGen, DBApiDefGenerator, DBDef,} from '../shared';
import {apiWithBody, apiWithQuery, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';

import {_keys, addItemToArray, DB_Object, Module, removeItemFromArray} from '@nu-art/ts-common';
import {MultiApiEvent, SingleApiEvent} from '../types';
import {EventType_Create, EventType_Delete, EventType_Patch, EventType_Query, EventType_Unique, EventType_Update, EventType_UpsertAll} from '../consts';
import {getModuleFEConfig} from '../db-def';
import {FirestoreQuery} from '@nu-art/firebase';


export type BaseApiConfig = {
	relativeUrl: string
	key: string
}

export type ApiCallerEventType = [SingleApiEvent, string, boolean] | [MultiApiEvent, string[], boolean];

export abstract class BaseDB_ApiGeneratorCaller<DBType extends DB_Object, Config extends BaseApiConfig = BaseApiConfig>
	extends Module<BaseApiConfig>
	implements ApiDefCaller<ApiStruct_DBApiGen<DBType>> {

	readonly version = 'v1';

	private defaultDispatcher?: ThunderDispatcher<any, string, ApiCallerEventType>;

	readonly v1: ApiDefCaller<ApiStruct_DBApiGen<DBType>>['v1'];

	constructor(dbDef: DBDef<DBType>) {
		super();
		const config = getModuleFEConfig(dbDef);

		this.setDefaultConfig(config);
		const apiDef = DBApiDefGenerator<DBType>(dbDef.relativeUrl);

		const query = apiWithBody(apiDef.v1.query, this.onQueryReturned);
		const queryUnique = apiWithQuery(apiDef.v1.queryUnique, this.onGotUnique);
		this.v1 = {
			query: (body?: FirestoreQuery<DBType> | undefined | {}) => query((body || {}) as FirestoreQuery<DBType>),
			queryUnique: (_id) => queryUnique({_id}),
			upsert: apiWithBody(apiDef.v1.upsert, this.onEntryUpdated),
			upsertAll: apiWithBody(apiDef.v1.upsertAll, this.onEntriesUpdated),
			patch: apiWithBody(apiDef.v1.patch, this.onEntryPatched),
			delete: apiWithQuery(apiDef.v1.delete, this.onEntryDeleted),
			deleteAll: apiWithQuery(apiDef.v1.deleteAll),
		};
	}

	getDefaultDispatcher() {
		return this.defaultDispatcher;
	}

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

	protected async onEntryDeleted(item: DBType): Promise<void> {
		removeItemFromArray(this.ids, item._id);
		delete this.items[item._id];

		this.dispatchSingle(EventType_Delete, item._id);
	}

	protected async onEntriesUpdated(items: DBType[]): Promise<void> {
		items.forEach(item => {
			if (!this.ids.includes(item._id))
				addItemToArray(this.ids, item._id);

			this.items[item._id] = item;
		});

		this.dispatchMulti(EventType_UpsertAll, items.map(item => item._id));
	}

	protected async onEntryCreated(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Create, item);
	}

	protected async onEntryUpdated(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Update, item);
	}

	protected async onEntrysUpdated(original: DBType, item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Update, item);
	}

	protected async onEntryPatched(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Patch, item);
	}

	private async onEntryUpdatedImpl(event: SingleApiEvent, item: DBType): Promise<void> {
		if (!this.ids.includes(item._id))
			addItemToArray(this.ids, item._id);

		this.items[item._id] = item;
		this.dispatchSingle(event, item._id);
	}

	protected async onGotUnique(item: DBType): Promise<void> {
		return this.onEntryUpdatedImpl(EventType_Unique, item);
	}

	protected async onQueryReturned(items: DBType[]): Promise<void> {
		this.items = items.reduce((toRet, item) => {
			toRet[item._id] = item;
			return toRet;
		}, this.items);

		this.ids = _keys(this.items);

		this.dispatchMulti(EventType_Query, this.ids);
	}
}
