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

import {FirebaseScheduledFunction} from '@nu-art/firebase/backend/functions/firebase-function';
import {FirestoreBackupDetailsV2, ModuleBE_BackupV2} from './ModuleBE_BackupV2';

export interface OnFirestoreBackupSchedulerActV2 {
	__onFirestoreBackupSchedulerActV2: () => FirestoreBackupDetailsV2<any>[];
}

export interface OnModuleCleanupV2 {
	__onCleanupInvokedV2: () => Promise<void>;
}


export class FirestoreBackupSchedulerV2_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
		this.setRuntimeOptions({timeoutSeconds: 300});
	}

	onScheduledEvent = async (): Promise<any> => {
		this.logInfoBold('Running function FirestoreBackupScheduler');

		await ModuleBE_BackupV2.initiateBackup();
	};
}

export const FirestoreBackupSchedulerV2 = new FirestoreBackupSchedulerV2_Class();
