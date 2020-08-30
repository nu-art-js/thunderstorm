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
	__stringify,
	auditBy,
	generateHex,
	Hour,
	ImplementationMissingException,
	Module,
    BadImplementationException
} from "@nu-art/ts-common";
import {
	FileWrapper,
	FirebaseModule,
	StorageWrapper
} from "@nu-art/firebase/backend";
import {
	fileUploadedKey,
	Request_GetUploadUrl,
	UploadResult
} from "../../shared/types";
import {
	DB_Temp_File,
	UploaderTempFileModule
} from "./UploaderTempFileModule";
import {PushPubSubModule} from "@nu-art/push-pub-sub/backend";

export const Temp_Path = 'files-temp';

type Config = {
	bucketName?: string
}

export class UploaderModule_Class
	extends Module<Config> {
	private storage!: StorageWrapper;

	private postProcessor!: { [k: string]: (file: FileWrapper) => Promise<void> };

	setPostProcessor(validator: { [k: string]: (file: FileWrapper) => Promise<void> }) {
		this.postProcessor = validator
	};

	init() {
		if (!this.postProcessor)
			throw new ImplementationMissingException('You must set a postProcessor for the UploaderModule');

		this.storage = FirebaseModule.createAdminSession().getStorage();
	}

	async getUrl(body: Request_GetUploadUrl) {
		const key = body.key || body.type;
		if (!this.postProcessor[key])
			throw new ImplementationMissingException(`Missing validator for type ${key}`);

		const _id = generateHex(32);
		const path = `${Temp_Path}/${_id}`;
		const instance: DB_Temp_File = {
			_id,
			name: body.name,
			type: body.type,
			key,
			path,
			_audit: auditBy('be-stub')
		};
		if (this.config?.bucketName)
			instance.bucketName = this.config.bucketName;

		const temp = await UploaderTempFileModule.upsert(instance);
		const bucket = await this.storage.getOrCreateBucket(instance.bucketName);
		const file = await bucket.getFile(temp.path);
		const url = await file.getWriteSecuredUrl(body.type, Hour);
		return {
			secureUrl: url.securedUrl,
			tempId: temp._id
		}
	}

	async fileUploaded(filePath?: string) {
		if (!filePath)
			throw new BadImplementationException('Missing file path');

		this.logInfo(`Looking for file with path ${filePath}`);
		// I use collection and not the module directly since I want to handle failure my way
		const tempMeta = await UploaderTempFileModule.collection.queryUnique({where: {path: filePath}});
		if (!tempMeta)
			throw new BadImplementationException(`File with path: ${filePath}, not found in temp collection db`);

		this.logInfo(`Found temp meta with _id: ${tempMeta._id}`, tempMeta);
		const val = this.postProcessor[tempMeta.key];
		this.logInfo(`Found a validator ${!!val}`);
		if (!val)
			return this.notifyFrontend(tempMeta._id, `Missing a validator for ${tempMeta.key} for file: ${tempMeta.name}`, UploadResult.Failure);

		const bucket = await this.storage.getOrCreateBucket(tempMeta.bucketName);
		const file = await bucket.getFile(tempMeta.path);
		try {
			await val(file);
		} catch (e) {
			return await this.notifyFrontend(tempMeta._id, `Post-processing failed for file: ${tempMeta.name} with error: ${__stringify(e)}`, UploadResult.Failure);
		}
		return this.notifyFrontend(tempMeta._id, `Successfully parsed and processed file ${tempMeta.name}`, UploadResult.Success)
	}

	private notifyFrontend = async (_id: string, message: string, result: UploadResult) => {
		await PushPubSubModule.pushToKey(fileUploadedKey, {_id}, {message, result})
	};

}

export const UploaderModule = new UploaderModule_Class();




