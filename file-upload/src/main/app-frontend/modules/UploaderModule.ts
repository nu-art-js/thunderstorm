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
	HttpRequest,
	ThunderDispatcher,
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

export enum StatusEnum {
	ObtainingUrl   = "ObtainingUrl",
	UploadingFile  = "UploadingFile",
	// I can assume that in between I upload and I get
	// the push I'm processing the file in the be
	PostProcessing = "PostProcessing",
	Completed      = "Completed",
	Error          = "Error"
}

export type FileStatus = {
	status: StatusEnum
	progress?: number
	request?: HttpRequest<any>
	file: File
};

export interface OnFileStatusChanged {
	__onFileStatusChanged: (id: string) => void
}

export class UploaderModule_Class
	extends Module<{}>
	implements OnPushMessageReceived<Push_FileUploaded> {
	private files: { [id: string]: FileStatus } = {};
	private readonly uploadQueue: Queue = new Queue("File Uploader").setParallelCount(3);
	private readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged')

	constructor() {
		super();
	}

	upload(files: File[], key?: string): BaseUploaderFile[] {
		const body: BaseUploaderFile[] = files.map(file => {
			const requestBody: BaseUploaderFile = {
				feId: generateHex(32),
				name: file.name,
				mimeType: file.type
			};

			if (key)
				requestBody.key = key;

			this.files[requestBody.feId] = {
				file,
				status: StatusEnum.ObtainingUrl
			};
			return requestBody;
		});

		HttpModule
			.createRequest<Api_GetUploadUrl>(HttpMethod.POST, RequestKey_UploadUrl)
			.setRelativeUrl("/v1/upload/get-url")
			.setJsonBody(body)
			.execute(async (response: TempSecureUrl[]) => {
				await this.uploadFiles(response)
			});

		return body;
	}

	setStatus<K extends keyof FileStatus>(id: string, key: K, value: FileStatus[K]) {
		this.files[id][key] = value;
		this.dispatch_fileStatusChange.dispatchUI([id]);
		this.dispatch_fileStatusChange.dispatchModule([id])
	}

	private uploadFile = async (response: TempSecureUrl) => {
		const file = this.files[response.tempDoc.feId];
		if (!file)
			throw new BadImplementationException(`Missing file with id ${response.tempDoc.feId} and name: ${response.tempDoc.name}`);

		return HttpModule
			.createRequest(HttpMethod.PUT, RequestKey_UploadFile)
			.setUrl(response.secureUrl)
			.setOnProgressListener((ev: ProgressEvent) => {
				this.setStatus(response.tempDoc.feId, "progress", ev.loaded / ev.total);
			})
			.setTimeout(10 * Minute)
			.setBody(file.file)
			.executeSync();
	};

	private uploadFiles = async (response: TempSecureUrl[]) => {
		// Subscribe
		await PushPubSubModule.subscribeMulti(response.map(r => ({pushKey: fileUploadedKey, props: {_id: r.tempDoc.feId}})));
		//
		response.forEach(r => {
			this.uploadQueue.addItem(async () => {
				this.setStatus(r.tempDoc.feId, "status", StatusEnum.UploadingFile);
				await this.uploadFile(r);
				this.setStatus(r.tempDoc.feId, "status", StatusEnum.PostProcessing);
			});
		})
	};

	__onMessageReceived(pushKey: string, props: { feId: string }, data: { message: string, result: string }): void {
		if (pushKey !== fileUploadedKey)
			return;

		switch (data.result) {
			case UploadResult.Success:
				this.setStatus(props.feId, "status", StatusEnum.Completed);
				ToastModule.toastSuccess(data.message);
				break;
			case UploadResult.Failure:
				this.setStatus(props.feId, "status", StatusEnum.Error);
				ToastModule.toastError(data.message);
				break
		}

		PushPubSubModule.unsubscribe({pushKey: fileUploadedKey, props}).catch()
	}
}

export const UploaderModule = new UploaderModule_Class();




