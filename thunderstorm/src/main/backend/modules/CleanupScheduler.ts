/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {currentTimeMillis, Dispatcher} from '@nu-art/ts-common';
import {FirebaseScheduledFunction} from '@nu-art/firebase/backend/functions/firebase-function';
import {FirebaseModule} from '@nu-art/firebase/backend/FirebaseModule';


export type ActDetailsDoc = {
	timestamp: number,
	moduleKey: string
}

export type CleanupDetails = {
	cleanup: () => Promise<void>,
	interval: number,
	moduleKey: string
}

export interface OnCleanupSchedulerAct {
	__onCleanupSchedulerAct: () => CleanupDetails;
}

const dispatch_onCleanupSchedulerAct = new Dispatcher<OnCleanupSchedulerAct, '__onCleanupSchedulerAct'>('__onCleanupSchedulerAct');

export class CleanupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 1 hours');
	}

	onScheduledEvent = async (): Promise<any> => {
		const cleanupStatusCollection = FirebaseModule.createAdminSession().getFirestore().getCollection<ActDetailsDoc>('cleanup-status', ['moduleKey']);
		const cleanups = dispatch_onCleanupSchedulerAct.dispatchModule();
		await Promise.all(cleanups.map(async cleanupItem => {
			const doc = await cleanupStatusCollection.queryUnique({where: {moduleKey: cleanupItem.moduleKey}});
			if (doc && doc.timestamp + cleanupItem.interval > currentTimeMillis())
				return;

			try {
				await cleanupItem.cleanup();
				await cleanupStatusCollection.upsert({timestamp: currentTimeMillis(), moduleKey: cleanupItem.moduleKey});
			} catch (e: any) {
				this.logWarning(`cleanup of ${cleanupItem.moduleKey} has failed with error '${e}'`);
			}
		}));
	};
}

export const CleanupScheduler = new CleanupScheduler_Class();
