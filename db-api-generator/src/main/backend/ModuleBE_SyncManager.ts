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

import {DatabaseWrapper, FirebaseModule} from '@nu-art/firebase/backend';
import {QueryParams} from '@nu-art/thunderstorm';
import {ApiServerRouter, createQueryServerApi, ExpressRequest} from '@nu-art/thunderstorm/backend';
import {_keys, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncManager, ApiStruct_SyncManager, DBSyncData} from '../shared';


type LastUpdated = { lastUpdated: number };
type Type_SyncData = TypedMap<LastUpdated>

export class ModuleBE_SyncManager_Class
	extends Module
	implements ApiServerRouter<ApiStruct_SyncManager> {

	readonly v1;
	private database!: DatabaseWrapper;

	constructor() {
		super();
		this.v1 = {
			checkSync: createQueryServerApi(ApiDef_SyncManager.v1.checkSync, this.fetchDBSyncData)
		};
	}

	init() {
		this.database = FirebaseModule.createAdminSession().getDatabase();
	}

	private fetchDBSyncData = async (_: QueryParams, request: ExpressRequest) => {
		const fbSyncData = await this.database.get<Type_SyncData>(`/state/${this.getName()}/syncData`) || {};
		const syncData = _keys(fbSyncData).reduce<DBSyncData[]>((response, dbName) => {
			response.push({name: String(dbName), lastUpdated: fbSyncData[dbName].lastUpdated});
			return response;
		}, []);
		return {syncData};
	};

	async setLastUpdated(collectionName: string, lastUpdated: number) {
		return this.database.set<LastUpdated>(`/state/${this.getName()}/syncData/${collectionName}`, {lastUpdated});
	}
}

export const ModuleBE_SyncManager = new ModuleBE_SyncManager_Class();

