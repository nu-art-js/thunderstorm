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

import {
	__stringify,
	_logger_logException,
	currentTimeMillis,
	dispatch_onServerError,
	Dispatcher,
	filterInstances,
	ServerErrorSeverity,
	TS_Object
} from '@nu-art/ts-common';
import {FirebaseScheduledFunction} from '@nu-art/firebase/app-backend/functions/firebase-function';
import {FirebaseModule} from '@nu-art/firebase/app-backend/FirebaseModule';
import {ActDetailsDoc,} from './CleanupScheduler';
import {FirestoreCollection} from '@nu-art/firebase/app-backend/firestore/FirestoreCollection';
import {FirestoreQuery} from '@nu-art/firebase';


export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
}

export type FirestoreBackupDetails<T extends TS_Object> = {
	moduleKey: string,
	interval: number,
	keepInterval?: number,
	collection: FirestoreCollection<T>,
	backupQuery: FirestoreQuery<T>
}

export interface OnFirestoreBackupSchedulerAct {
	__onFirestoreBackupSchedulerAct: () => FirestoreBackupDetails<any>[];
}

const dispatch_onFirestoreBackupSchedulerAct = new Dispatcher<OnFirestoreBackupSchedulerAct, '__onFirestoreBackupSchedulerAct'>('__onFirestoreBackupSchedulerAct');

export class FirestoreBackupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
	}

	onScheduledEvent = async (): Promise<any> => {
		const backupStatusCollection = FirebaseModule.createAdminSession().getFirestore()
			.getCollection<BackupDoc>('firestore-backup-status', ['moduleKey', 'timestamp']);

		const backups: FirestoreBackupDetails<any>[] = [];
		filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule()).forEach(backupArray => {
			backups.push(...backupArray);
		});

		const bucket = await FirebaseModule.createAdminSession().getStorage().getOrCreateBucket();
		await Promise.all(backups.map(async (backupItem) => {
			const query: FirestoreQuery<BackupDoc> = {
				where: {moduleKey: backupItem.moduleKey},
				orderBy: [{key: 'timestamp', order: 'asc'}],
				limit: 1
			};
			const docs = await backupStatusCollection.query(query);
			const latestDoc = docs[0];
			if (latestDoc && latestDoc.timestamp + backupItem.interval > currentTimeMillis())
				return;

			const backupPath = `backup/firestore/${backupItem.moduleKey}/${currentTimeMillis()}.json`;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				await (await bucket.getFile(backupPath)).write(toBackupData);
				await backupStatusCollection.upsert({timestamp: currentTimeMillis(), moduleKey: backupItem.moduleKey, backupPath});

				const keepInterval = backupItem.keepInterval;
				if (keepInterval) {
					const queryOld = {where: {moduleKey: backupItem.moduleKey, timestamp: {$lt: currentTimeMillis() - keepInterval}}};
					const oldDocs = await backupStatusCollection.query(queryOld);
					await Promise.all(oldDocs.map(async oldDoc => {
						await (await bucket.getFile(oldDoc.backupPath)).delete();
					}));

					await backupStatusCollection.delete(queryOld);
				}

			} catch (e: any) {
				this.logWarning(`backup of ${backupItem.moduleKey} has failed with error`, e);
				const errorMessage = `Error backing up firestore collection config:\n ${__stringify(backupItem, true)}\nError: ${_logger_logException(e)}`;

				await dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Critical, this, errorMessage);

			}
		}));
	};
}

export const FirestoreBackupScheduler = new FirestoreBackupScheduler_Class();
