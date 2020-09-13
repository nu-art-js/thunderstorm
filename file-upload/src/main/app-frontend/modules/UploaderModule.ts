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
	ThunderDispatcher
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

export enum FileStatus {
	ObtainingUrl   = "ObtainingUrl",
	UploadingFile  = "UploadingFile",
	// I can assume that in between I upload and I get
	// the push I'm processing the file in the be
	PostProcessing = "PostProcessing",
	Completed      = "Completed",
	Error          = "Error"
}

export type FileInfo = {
	status: FileStatus
	messageStatus?: string
	progress?: number
	request?: HttpRequest<any>
	file: File
};

export interface OnFileStatusChanged {
	__onFileStatusChanged: (id?: string) => void
}

export class UploaderModule_Class
	extends Module<{}>
	implements OnPushMessageReceived<Push_FileUploaded> {
	private files: { [id: string]: FileInfo } = {};
	private readonly uploadQueue: Queue = new Queue("File Uploader").setParallelCount(3);
	private readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged')

	constructor() {
		super();
	}

	getFileInfo<K extends keyof FileInfo>(id: string, key: K): FileInfo[K] | undefined {
		return this.files[id] && this.files[id][key]
	}

	getFullFileInfo(id: string): FileInfo | undefined {
		return this.files[id]
	}

	private setFileInfo<K extends keyof FileInfo>(id: string, key: K, value: FileInfo[K]) {
		if (!this.files[id])
			throw new BadImplementationException(`Trying to set ${key} for non existent file with id: ${id}`);

		this.files[id][key] = value;
		this.dispatchFileStatusChange(id)
	}

	private dispatchFileStatusChange(id?: string) {
		this.dispatch_fileStatusChange.dispatchUI([id]);
		this.dispatch_fileStatusChange.dispatchModule([id])
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
				status: FileStatus.ObtainingUrl
			};
			return requestBody;
		});

		HttpModule
			.createRequest<Api_GetUploadUrl>(HttpMethod.POST, RequestKey_UploadUrl)
			.setRelativeUrl("/v1/upload/get-url")
			.setJsonBody(body)
			.setOnError((request) => {
				body.forEach(f => {
					this.setFileInfo(f.feId, "messageStatus", __stringify(request.xhr.response));
					this.setFileInfo(f.feId, "status", FileStatus.Error);
				})
			})
			.execute(async (response: TempSecureUrl[]) => {
				this.dispatchFileStatusChange();
				await this.uploadFiles(response)
			});

		return body;
	}

	private uploadFiles = async (response: TempSecureUrl[]) => {
		// Subscribe
		await PushPubSubModule.subscribeMulti(response.map(r => ({pushKey: fileUploadedKey, props: {feId: r.tempDoc.feId}})));

		response.forEach(r => {
			this.uploadQueue.addItem(async () => {
				await this.uploadFile(r);
				//TODO: Probably need to set a timer here in case we dont get a push back (contingency)
			});
		})
	};

	private uploadFile = async (response: TempSecureUrl) => {
		this.setFileInfo(response.tempDoc.feId, "status", FileStatus.UploadingFile);

		const fileInfo = this.files[response.tempDoc.feId];
		if (!fileInfo)
			throw new BadImplementationException(`Missing file with id ${response.tempDoc.feId} and name: ${response.tempDoc.name}`);

		fileInfo.request = HttpModule
			.createRequest(HttpMethod.PUT, RequestKey_UploadFile)
			.setUrl(response.secureUrl)
			.setOnError((request) => {
				this.setFileInfo(response.tempDoc.feId, "status", FileStatus.Error);
				this.setFileInfo(response.tempDoc.feId, "messageStatus", __stringify(request.xhr.response))
			})
			.setOnProgressListener((ev: ProgressEvent) => {
				this.setFileInfo(response.tempDoc.feId, "progress", ev.loaded / ev.total);
			})
			.setTimeout(10 * Minute)
			.setBody(fileInfo.file);

		await fileInfo.request.executeSync();

		this.setFileInfo(response.tempDoc.feId, "progress", undefined);
		this.setFileInfo(response.tempDoc.feId, "request", undefined);
		this.setFileInfo(response.tempDoc.feId, "status", FileStatus.PostProcessing);
	};

	__onMessageReceived(pushKey: string, props: { feId: string }, data: { message: string, result: string }): void {
		this.logInfo('Message received from service worker', pushKey, props, data);
		if (pushKey !== fileUploadedKey)
			return;

		switch (data.result) {
			case UploadResult.Success:
				this.setFileInfo(props.feId, "status", FileStatus.Completed);
				break;
			case UploadResult.Failure:
				this.setFileInfo(props.feId, "status", FileStatus.Error);
				break
		}

		PushPubSubModule.unsubscribe({pushKey: fileUploadedKey, props}).catch()
	}
}

export const UploaderModule = new UploaderModule_Class();




