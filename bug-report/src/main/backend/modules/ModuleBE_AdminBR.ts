/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {Module} from '@nu-art/ts-common';
import {ApiDef_AdminBugReport, DB_BugReport, Paths} from '../../shared/api';

import {FirestoreCollection, ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase/backend';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';


type Config = {
	projectId: string
	bucket?: string,
}

export class ModuleBE_AdminBR_Class
	extends Module<Config> {

	private bugReport!: FirestoreCollection<DB_BugReport>;
	private storage!: StorageWrapperBE;

	constructor() {
		super();

	}

	protected init(): void {
		super.init();
		const sessAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = sessAdmin.getFirestore();
		this.bugReport = firestore.getCollection<DB_BugReport>('bug-report', ['_id']);
		this.storage = sessAdmin.getStorage();
		addRoutes([
			createBodyServerApi(ApiDef_AdminBugReport.v1.downloadLogs, ModuleBE_AdminBR.downloadFiles),
			createQueryServerApi(ApiDef_AdminBugReport.v1.retrieveLogs, ModuleBE_AdminBR.getFilesFirebase),

		]);
	}

	getFilesFirebase = async () => this.bugReport.getAll();

	downloadFiles = async (path: Paths) => {
		const bucket = await this.storage.getOrCreateBucket(this.config?.bucket);
		const file = await bucket.getFile(path.path);
		return file.getReadSignedUrl(600000, 'application/zip');
	};
}

export const ModuleBE_AdminBR = new ModuleBE_AdminBR_Class();