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
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	ServerErrorSeverity,
	TS_Object
} from '@nu-art/ts-common';
import {FirebaseScheduledFunction} from '@nu-art/firebase/backend/functions/firebase-function';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend/ModuleBE_Firebase';
import {ActDetailsDoc,} from './CleanupScheduler';
import {FirestoreCollection} from '@nu-art/firebase/backend/firestore/FirestoreCollection';
import {FirestoreQuery} from '@nu-art/firebase';


export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
}

export type FirestoreBackupDetails<T extends TS_Object> = {
	moduleKey: string,
	minTimeThreshold: number, // minimum time to pass before another backup can occur.
	keepInterval?: number, // how long to keep
	collection: FirestoreCollection<T>,
	backupQuery: FirestoreQuery<T>
}

export interface OnFirestoreBackupSchedulerAct {
	__onFirestoreBackupSchedulerAct: () => FirestoreBackupDetails<any>[];
}

export interface OnModuleCleanup {
	__onCleanupInvoked: () => Promise<void>;
}

const dispatch_onModuleCleanup = new Dispatcher<OnModuleCleanup, '__onCleanupInvoked'>('__onCleanupInvoked');
const dispatch_onFirestoreBackupSchedulerAct = new Dispatcher<OnFirestoreBackupSchedulerAct, '__onFirestoreBackupSchedulerAct'>('__onFirestoreBackupSchedulerAct');

export class FirestoreBackupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
		this.setRuntimeOptions({timeoutSeconds: 300});
	}

	onScheduledEvent = async (): Promise<any> => {
		this.logInfoBold('Running function FirestoreBackupScheduler');

		try {
			this.logInfo('Cleaning modules...');
			await dispatch_onModuleCleanup.dispatchModuleAsync();
			this.logInfo('Cleaned modules!');
		} catch (e: any) {
			this.logWarning(`modules cleanup has failed with error`, e);
			const errorMessage = `modules cleanup has failed with error\nError: ${_logger_logException(e)}`;

			await dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Critical, this, errorMessage);
		}

		const backupStatusCollection = ModuleBE_Firebase.createAdminSession().getFirestore()
			.getCollection<BackupDoc>('firestore-backup-status', ['moduleKey', 'timestamp']);

		const backups: FirestoreBackupDetails<any>[] = [];
		filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule()).forEach(backupArray => {
			backups.push(...backupArray);
		});

		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		await Promise.all(backups.map(async (backupItem) => {
			const query: FirestoreQuery<BackupDoc> = {
				where: {moduleKey: backupItem.moduleKey},
				orderBy: [{key: 'timestamp', order: 'asc'}],
				limit: 1
			};
			const docs = await backupStatusCollection.query(query);
			const latestDoc = docs[0];
			const nowMs = currentTimeMillis();
			if (latestDoc && latestDoc.timestamp + backupItem.minTimeThreshold > nowMs)
				return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.

			const fileName = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
			const backupPath = `backup/firestore/${backupItem.moduleKey}/${fileName}.json`;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				await (await bucket.getFile(backupPath)).write(toBackupData);

				this.logInfoBold('Upserting Backup for ' + backupItem.moduleKey);
				await backupStatusCollection.upsert({timestamp: nowMs, moduleKey: backupItem.moduleKey, backupPath});

				this.logInfoBold('Upserting BackupStatus for ' + backupItem.moduleKey); // happened 30 seconds later
				const keepInterval = backupItem.keepInterval;
				if (keepInterval) {
					this.logInfoBold('Querying for items to delete for ' + backupItem.moduleKey);
					const queryOld = {where: {moduleKey: backupItem.moduleKey, timestamp: {$lt: nowMs - keepInterval}}};
					const oldDocs = await backupStatusCollection.query(queryOld);

					this.logInfoBold('Received items to delete total: ' + oldDocs.length);
					await Promise.all(oldDocs.map(async oldDoc => {
						try {
							await (await bucket.getFile(oldDoc.backupPath)).delete();
							await backupStatusCollection.deleteItem(oldDoc);
						} catch (e: any) {
							this.logError('error deleting file: ', oldDoc, e);
						}
					}));

					this.logInfoBold('Successfully deleted items for ' + backupItem.moduleKey);
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
