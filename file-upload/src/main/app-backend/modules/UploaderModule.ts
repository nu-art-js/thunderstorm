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
	ImplementationMissingException,
	Module,
	ThisShouldNotHappenException,
	TypedMap
} from "@nu-art/ts-common";
import {
	FileWrapper,
	FirebaseModule,
	FirestoreTransaction,
	StorageWrapper
} from "@nu-art/firebase/backend";
import {
	BaseUploaderFile,
	DB_Temp_File,
	fileUploadedKey,
	Push_FileUploaded,
	TempSecureUrl,
	UploadResult
} from "../../shared/types";
import {UploaderTempFileModule} from "./UploaderTempFileModule";
import {PushPubSubModule} from "@nu-art/push-pub-sub/backend";

export const Temp_Path = 'files-temp';

type Config = {
	bucketName?: string
}

export type PostProcessor = (transaction: FirestoreTransaction, file: FileWrapper, doc: DB_Temp_File) => Promise<void>;
type AssetProcessor = {
	callback: (file: FileWrapper, doc: DB_Temp_File) => void
}


export class UploaderModule_Class
	extends Module<Config> {
	private storage!: StorageWrapper;
	processor: TypedMap<AssetProcessor> = {};

	register() {

	}

	init() {
		this.storage = FirebaseModule.createAdminSession().getStorage();
	}

	async getUrl(body: BaseUploaderFile[]): Promise<TempSecureUrl[]> {
		const bucketName = this.config?.bucketName;
		const bucket = await this.storage.getOrCreateBucket(bucketName);
		return Promise.all(body.map(async _file => {
			const key = _file.key || _file.mimeType;
			if (!this.postProcessor[key])
				throw new ImplementationMissingException(`Missing validator for type ${key}`);

			const _id = generateHex(32);
			const path = `${Temp_Path}/${_id}`;
			const instance: DB_Temp_File = {
				_id,
				feId: _file.feId,
				name: _file.name,
				mimeType: _file.mimeType,
				key,
				path,
				_audit: auditBy('be-stub'),
				bucketName: bucket.bucketName
			};

			if (_file.public)
				instance.public = _file.public;

			const temp = await UploaderTempFileModule.upsert(instance);
			const file = await bucket.getFile(temp.path);
			const url = await file.getWriteSecuredUrl(_file.mimeType, Hour);
			return {
				secureUrl: url.securedUrl,
				tempDoc: temp
			};
		}));
	}

	fileUploaded = async (filePath?: string) => {
		if (!filePath)
			throw new ThisShouldNotHappenException('Missing file path');

		this.logInfo(`Looking for file with path ${filePath}`);

		await UploaderTempFileModule.runInTransaction(async (transaction: FirestoreTransaction) => {
			// I use collection and not the module directly since I want to handle failure my way
			const tempMeta = await transaction.queryUnique(UploaderTempFileModule.collection, {where: {path: filePath}});
			if (!tempMeta)
				return this.logInfo(`File with path: ${filePath}, not found in temp collection db`);

			this.logInfo(`Found temp meta with _id: ${tempMeta._id}`, tempMeta);
			const val = this.postProcessor[tempMeta.key];
			this.logInfo(`Found a validator ${!!val}`);
			if (!val)
				return this.notifyFrontend(tempMeta.feId, UploadResult.Failure, `Missing a validator for ${tempMeta.key} for file: ${tempMeta.name}`);

			const bucket = await this.storage.getOrCreateBucket(tempMeta.bucketName);
			const file = await bucket.getFile(tempMeta.path);
			if (tempMeta.public) {
				try {
					await file.makePublic();
				} catch (e) {
					await this.notifyFrontend(tempMeta.feId, UploadResult.Failure, `Failed to make the file public: ${tempMeta.name}`, e);
				}
			}

			try {
				await val(transaction, file, tempMeta);
			} catch (e) {
				//TODO delete the file and the temp doc
				return await this.notifyFrontend(tempMeta.feId, UploadResult.Failure, `Post-processing failed for file: ${tempMeta.name}`, e);
			}
			return this.notifyFrontend(tempMeta.feId, UploadResult.Success, `Successfully parsed and processed file ${tempMeta.name}`);
		});
	};

	private notifyFrontend = async (feId: string, result: UploadResult, message: string, cause?: Error) => {
		cause && this.logWarning(cause);
		const data = {message, result, cause};
		await PushPubSubModule.pushToKey<Push_FileUploaded>(fileUploadedKey, {feId}, data);
	};

}

export const UploaderModule = new UploaderModule_Class();




