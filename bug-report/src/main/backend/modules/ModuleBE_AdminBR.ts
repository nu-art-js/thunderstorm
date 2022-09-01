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
import {
	ApiDef_AdminBugReport,
	ApiStruct_AdminBugReport,
	DB_BugReport,
	Paths
} from '../../shared/api';

import {
	ModuleBE_Firebase,
	FirestoreCollection,
	StorageWrapperBE
} from '@nu-art/firebase/backend';
import {ApiDefServer, ApiResponse, ExpressRequest, ServerApi_Get, ServerApi_Post} from '@nu-art/thunderstorm/backend';

type Config = {
	projectId: string
	bucket?: string,
}

class ServerApi_DownloadLogs
	extends ServerApi_Post<ApiStruct_AdminBugReport['v1']['downloadLogs']> {

	constructor() {
		super(ApiDef_AdminBugReport.v1.downloadLogs);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Paths) {
		// const email = await ModuleBE_Account.validateSession({},request);
		return ModuleBE_AdminBR.downloadFiles(body);
	}
}

class ServerApi_GetReport
	extends ServerApi_Get<ApiStruct_AdminBugReport['v1']['retrieveLogs']> {

	constructor() {
		super(ApiDef_AdminBugReport.v1.retrieveLogs);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: void) {
		return ModuleBE_AdminBR.getFilesFirebase();
	}
}

export class ModuleBE_AdminBR_Class
	extends Module<Config> {

	private bugReport!: FirestoreCollection<DB_BugReport>;
	private storage!: StorageWrapperBE;
	readonly v1: ApiDefServer<ApiStruct_AdminBugReport>['v1'];

	constructor() {
		super();
		this.v1 = {
			downloadLogs: new ServerApi_DownloadLogs(),
			retrieveLogs: new ServerApi_GetReport(),
		};
	}


	protected init(): void {
		const sessAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = sessAdmin.getFirestore();
		this.bugReport = firestore.getCollection<DB_BugReport>('bug-report', ['_id']);
		this.storage = sessAdmin.getStorage();
	}

	getFilesFirebase = async () => this.bugReport.getAll();

	downloadFiles = async (path: Paths) => {
		const bucket = await this.storage.getOrCreateBucket(this.config?.bucket);
		const file = await bucket.getFile(path.path);
		return file.getReadSecuredUrl('application/zip', 600000);
	};
}

export const ModuleBE_AdminBR = new ModuleBE_AdminBR_Class();