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
import {
	auditBy,
	generateHex,
	Hour,
	Module
} from "@nu-art/ts-common";
import {
	FirebaseModule,
	StorageWrapper
} from "@nu-art/firebase/backend";
import {Request_GetUploadUrl} from "../../shared/types";
import {
	BucketConfig,
	DB_Temp_File,
	UploaderTempFileModule
} from "./UploaderTempFileModule";

export const Temp_Path = 'files-temp';
export const App_Path = 'files-app';

type Config = {
	bucket?: BucketConfig
}

export class UploaderModule_Class
	extends Module<Config> {
	private storage!: StorageWrapper;

	// private firestore!: FirestoreWrapper;

	init() {
		const session = FirebaseModule.createAdminSession(this.config.bucket?.projectId);
		this.storage = session.getStorage();
		// this.firestore = session.getFirestore();
	}

	async getUrl(body: Request_GetUploadUrl) {
		const _id = generateHex(32);
		const path = `${Temp_Path}/${_id}`;
		const instance: DB_Temp_File = {
			_id,
			name: body.name,
			type: body.type,
			path,
			_audit: auditBy('be-stub')
		};
		if (this.config.bucket)
			instance.bucket = this.config.bucket;

		const temp = await UploaderTempFileModule.upsert(instance);
		const bucket = await this.storage.getOrCreateBucket(this.config.bucket?.name);
		const file = await bucket.getFile(temp.path);
		const url = await file.getWriteSecuredUrl(body.type, Hour);
		// await file.setMetadata({_id, path});
		return {secureUrl: url.securedUrl}
	}

	async fileUploaded(filePath?: string) {
		const doc = await UploaderTempFileModule.queryUnique({path: filePath});
	}
}

export const UploaderModule = new UploaderModule_Class();




