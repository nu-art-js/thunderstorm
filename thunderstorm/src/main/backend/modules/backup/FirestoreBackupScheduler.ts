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
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	generateHex,
	ServerErrorSeverity
} from '@nu-art/ts-common';
import {FirebaseScheduledFunction} from '@nu-art/firebase/backend/functions/firebase-function';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend/ModuleBE_Firebase';
import {ActDetailsDoc,} from '../CleanupScheduler';
import {FirestoreQuery} from '@nu-art/firebase';
import {FirestoreBackupDetails, ModuleBE_Backup} from './ModuleBE_Backup';


export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
	backupId: string,
}


export interface OnFirestoreBackupSchedulerAct {
	__onFirestoreBackupSchedulerAct: () => FirestoreBackupDetails<any>[];
}

export interface OnModuleCleanup {
	__onCleanupInvoked: () => Promise<void>;
}

const dispatch_onModuleCleanup = new Dispatcher<OnModuleCleanup, '__onCleanupInvoked'>('__onCleanupInvoked');

export class FirestoreBackupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
		this.setRuntimeOptions({timeoutSeconds: 300});
	}

	onScheduledEvent = async (force?: boolean): Promise<any> => {
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

		const backups: FirestoreBackupDetails<any>[] = ModuleBE_Backup.getBackupDetails();
		const backupId = generateHex(32);
		const nowMs = currentTimeMillis();

		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		await Promise.all(backups.map(async (backupItem) => {
			const query: FirestoreQuery<BackupDoc> = {
				where: {moduleKey: backupItem.moduleKey},
				orderBy: [{key: 'timestamp', order: 'asc'}],
				limit: 1
			};

			const docs = await ModuleBE_Backup.query(query);
			const latestDoc = docs[0];
			if (!force && latestDoc && latestDoc.timestamp + backupItem.minTimeThreshold > nowMs)
				return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.

			const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
			const backupPath = `backup/firestore/${timeFormat}/${backupItem.moduleKey}.json`;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				await (await bucket.getFile(backupPath)).write(toBackupData);

				this.logInfoBold('Upserting Backup for ' + backupItem.moduleKey);
				await ModuleBE_Backup.upsert({timestamp: nowMs, moduleKey: backupItem.moduleKey, backupPath, backupId: backupId});

				this.logInfoBold('Upserting BackupStatus for ' + backupItem.moduleKey); // happened 30 seconds later
				const keepInterval = backupItem.keepInterval;
				if (keepInterval) {
					this.logInfoBold('Querying for items to delete for ' + backupItem.moduleKey);
					const queryOld = {where: {moduleKey: backupItem.moduleKey, timestamp: {$lt: nowMs - keepInterval}}};
					const oldDocs = await ModuleBE_Backup.query(queryOld);

					this.logInfoBold('Received items to delete total: ' + oldDocs.length);
					await Promise.all(oldDocs.map(async oldDoc => {
						try {
							await (await bucket.getFile(oldDoc.backupPath)).delete();
							await ModuleBE_Backup.deleteItem(oldDoc);
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
