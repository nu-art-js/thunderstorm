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

import {Dispatcher, Module} from '@nu-art/ts-common';
import {ApiDef_SyncManager, ApiDefCaller, ApiStruct_SyncManager, DBSyncData, Response_DBSyncData} from '../../shared';
import {apiWithQuery} from '../../core';


export type SyncIfNeeded = {
	__syncIfNeeded: (syncData: DBSyncData[]) => Promise<void>
}
export type OnSyncCompleted = {
	__onSyncCompleted: () => void
}

export const dispatch_syncIfNeeded = new Dispatcher<SyncIfNeeded, '__syncIfNeeded'>('__syncIfNeeded');
export const dispatch_onSyncCompleted = new Dispatcher<OnSyncCompleted, '__onSyncCompleted'>('__onSyncCompleted');

export class ModuleFE_SyncManager_Class
	extends Module
	implements ApiDefCaller<ApiStruct_SyncManager> {

	readonly v1;

	constructor() {
		super();
		this.v1 = {
			checkSync: apiWithQuery(ApiDef_SyncManager.v1.checkSync, this.onReceivedSyncData)
		};
	}

	public onReceivedSyncData = async (response: Response_DBSyncData) => {
		await dispatch_syncIfNeeded.dispatchModuleAsync(response.syncData);
		dispatch_onSyncCompleted.dispatchModule();
	};
}

export const ModuleFE_SyncManager = new ModuleFE_SyncManager_Class();


