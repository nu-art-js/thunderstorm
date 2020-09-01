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
	BadImplementationException,
	generateHex,
	Minute,
	Module,
	Queue
} from "@nu-art/ts-common";
import {HttpMethod} from "@nu-art/thunderstorm";
import {
	HttpModule,
	ToastModule
} from "@nu-art/thunderstorm/frontend";

import {
	Api_GetUploadUrl,
	BaseUploaderFile,
	fileUploadedKey,
	Push_FileUploaded,
	TempSecureUrl,
	UploadResult
} from "../../shared/types";
import {
	OnPushMessageReceived,
	PushPubSubModule
} from "@nu-art/push-pub-sub/frontend";

const RequestKey_UploadUrl = 'get-upload-url';
const RequestKey_UploadFile = 'upload-file';

export class UploaderModule_Class
	extends Module<{}>
	implements OnPushMessageReceived<Push_FileUploaded> {
	private files: { [id: string]: File } = {};
	private readonly uploadQueue: Queue = new Queue("File Uploader").setParallelCount(3);

	constructor() {
		super();
	}

	upload(files: File[], key?: string) {
		const body: BaseUploaderFile[] = files.map(file => {
			const requestBody: BaseUploaderFile = {
				feId: generateHex(32),
				name: file.name,
				mimeType: file.type
			};

			if (key)
				requestBody.key = key;

			this.files[requestBody.feId] = file;
			return requestBody;
		});

		HttpModule
			.createRequest<Api_GetUploadUrl>(HttpMethod.POST, RequestKey_UploadUrl)
			.setRelativeUrl("/v1/upload/get-url")
			.setJsonBody(body)
			.execute(async (response: TempSecureUrl[]) => {
				await this.uploadFiles(response)
			});
	}

	private uploadFile = async (response: TempSecureUrl) => {
		const file = this.files[response.tempDoc.feId];
		if (!file)
			throw new BadImplementationException(`Missing file with id ${response.tempDoc.feId} and name: ${response.tempDoc.name}`);

		return HttpModule
			.createRequest(HttpMethod.PUT, RequestKey_UploadFile)
			.setUrl(response.secureUrl)
			.setTimeout(10 * Minute)
			.setBody(file)
			.executeSync();
	};

	private uploadFiles = async (response: TempSecureUrl[]) => {
		// Subscribe
		await PushPubSubModule.subscribeMulti(response.map(r => ({pushKey: fileUploadedKey, props: {_id: r.tempDoc._id}})));
		//
		response.forEach(r => {
			this.uploadQueue.addItem(async () => {
				return this.uploadFile(r)
			});
		})
	};

	__onMessageReceived(pushKey: string, props: { _id: string }, data: { message: string, result: string }): void {
		if (pushKey !== fileUploadedKey)
			return;

		switch (data.result) {
			case UploadResult.Success:
				ToastModule.toastSuccess(data.message);
				break;
			case UploadResult.Failure:
				ToastModule.toastError(data.message);
				break
		}

		PushPubSubModule.unsubscribe({pushKey: fileUploadedKey, props})
	}
}

export const UploaderModule = new UploaderModule_Class();




