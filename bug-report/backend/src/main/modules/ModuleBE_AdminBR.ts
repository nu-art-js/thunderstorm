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
import {API_AdminBugReport, ApiDef_AdminBugReport, DatabaseDef_BugReport, DBDef_BugReport, Paths} from '@nu-art/bug-report-shared/api';
import {FirestoreCollection, ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase-backend';
import {ApiHandler} from '@nu-art/http-server';
import {_EmptyQuery} from '@nu-art/firebase-shared';


type Config = {
	projectId: string
	bucket?: string,
}

export class ModuleBE_AdminBR_Class
	extends Module<Config> {

	private bugReport!: FirestoreCollection<DatabaseDef_BugReport>;
	private storage!: StorageWrapperBE;

	constructor() {
		super();
	}

	protected init(): void {
		super.init();
		const sessAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = sessAdmin.getFirestore();
		this.bugReport = firestore.getCollection(DBDef_BugReport);
		this.storage = sessAdmin.getStorage();
	}

	@ApiHandler(ApiDef_AdminBugReport.retrieveLogs)
	async retrieveLogs(_params?: API_AdminBugReport['retrieveLogs']['Params']): Promise<API_AdminBugReport['retrieveLogs']['Response']> {
		return this.bugReport.query.custom(_EmptyQuery);
	}

	@ApiHandler(ApiDef_AdminBugReport.downloadLogs)
	async downloadLogs(body: API_AdminBugReport['downloadLogs']['Body']): Promise<API_AdminBugReport['downloadLogs']['Response']> {
		return ModuleBE_AdminBR.downloadFiles(body);
	}

	getFilesFirebase = async () => this.bugReport.query.custom(_EmptyQuery);

	downloadFiles = async (path: Paths) => {
		const bucket = await this.storage.getOrCreateBucket(this.config?.bucket);
		const file = await bucket.getFile(path.path);
		return file.getReadSignedUrl(600000, 'application/zip');
	};
}

export const ModuleBE_AdminBR = new ModuleBE_AdminBR_Class();