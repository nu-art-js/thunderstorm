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

import {Dispatcher, Module, Queue} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery} from '../../core/typed-api';
import {
	ApiStruct_SyncManager,
	DBSyncData,
	Response_DBSyncData,
	Response_SmartSync,
	SmartSync_DeltaSync,
	SmartSync_FullSync
} from '../../../shared/sync-manager/types';
import {ApiDefCaller, ApiModule} from '../../../shared';
import {ApiDef_SyncManagerV2} from '../../../shared/sync-manager/apis';
import {Thunder} from '../../core/Thunder';
import {ModuleFE_BaseApi} from '../db-api-gen/ModuleFE_BaseApi';


export type SyncIfNeeded = {
	__syncIfNeeded: (syncData: DBSyncData[]) => Promise<void>
}
export type OnSyncCompleted = {
	__onSyncCompleted: () => void
}

export const dispatch_syncIfNeeded = new Dispatcher<SyncIfNeeded, '__syncIfNeeded'>('__syncIfNeeded');
export const dispatch_onSyncCompleted = new Dispatcher<OnSyncCompleted, '__onSyncCompleted'>('__onSyncCompleted');

export class ModuleFE_SyncManagerV2_Class
	extends Module
	implements ApiDefCaller<ApiStruct_SyncManager> {

	readonly v1;
	private syncQueue;

	constructor() {
		super();

		this.syncQueue = new Queue('Sync Queue');
		this.v1 = {
			checkSync: apiWithQuery(ApiDef_SyncManagerV2.v1.checkSync, this.onReceivedSyncData),
			smartSync: apiWithBody(ApiDef_SyncManagerV2.v1.smartSync, this.onSmartSyncCompleted)
		};
	}

	public onReceivedSyncData = async (response: Response_DBSyncData) => {
		await dispatch_syncIfNeeded.dispatchModuleAsync(response.syncData);
		dispatch_onSyncCompleted.dispatchModule();
	};

	public onSmartSyncCompleted = async (response: Response_SmartSync) => {
		const modulesToSync = response.modules.filter(module => module.sync === SmartSync_FullSync);
		modulesToSync.forEach(moduleToSync => {
			const module = Thunder.getInstance().modules.find(module => (module as unknown as ApiModule['dbModule']).dbDef?.dbName === moduleToSync.name);
			if (!module)
				return this.logError(`Couldn't find module with dbName: '${moduleToSync.name}'`);

			this.syncQueue.addItem(async () => {
				this.logInfo(`Full sync for: '${moduleToSync.name}'`);
				await (module as ModuleFE_BaseApi<any>).v1.sync().executeSync();
			});
		});

		const modulesToUpdate = response.modules.filter(module => module.sync === SmartSync_DeltaSync);
		for (const moduleToUpdate of modulesToUpdate) {
			const module = Thunder.getInstance().modules
				.find(module => (module as unknown as ApiModule['dbModule']).dbDef?.dbName === moduleToUpdate.name) as ModuleFE_BaseApi<any>;

			await module.onEntriesUpdated(moduleToUpdate.items?.toUpdate ?? []);
			await module.onEntriesDeleted(moduleToUpdate.items?.toDelete ?? []);
		}

		dispatch_onSyncCompleted.dispatchModule();
	};
}

export const ModuleFE_SyncManagerV2 = new ModuleFE_SyncManagerV2_Class();
