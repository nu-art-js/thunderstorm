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
	DeriveRealBinder,
	HttpModule,
	ThunderDispatcher
} from "@nu-art/thunderstorm/frontend";

import {
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
import {
	BaseUploaderModule_Class,
	FileStatus,
	OnFileStatusChanged
} from "../../shared/modules/BaseUploaderModule";
import {
	ApiTypeBinder,
	BaseHttpRequest,
	DeriveBodyType,
	DeriveQueryType,
	DeriveResponseType,
	DeriveUrlType,
	HttpMethod,
	QueryParams
} from "@nu-art/thunderstorm";


export class UploaderModule_Class
	extends BaseUploaderModule_Class
	implements OnPushMessageReceived<Push_FileUploaded> {

	protected readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged');

	protected createRequest<Binder extends ApiTypeBinder<U, R, B, P>,
		U extends string = DeriveUrlType<Binder>,
		R = DeriveResponseType<Binder>,
		B = DeriveBodyType<Binder>,
		P extends QueryParams = DeriveQueryType<Binder>>(method: HttpMethod, key: string, data?: string): BaseHttpRequest<DeriveRealBinder<Binder>> {
		return HttpModule.createRequest(method, key, data);
	}

	protected dispatchFileStatusChange(id?: string) {
		this.dispatch_fileStatusChange.dispatchUI([id]);
		super.dispatchFileStatusChange(id);
	}

	upload(files: File[], key?: string): BaseUploaderFile[] | undefined {
		return this.uploadImpl(files.map((file => {
			return {
				name: file.name,
				mimeType: file.type,
				key,
				file
			};
		})));
	}

	protected async subscribeToPush(toSubscribe: TempSecureUrl[]): Promise<void> {
		await PushPubSubModule.subscribeMulti(toSubscribe.map(r => ({pushKey: fileUploadedKey, props: {feId: r.tempDoc.feId}})));
	}

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
				break;
		}

		PushPubSubModule.unsubscribe({pushKey: fileUploadedKey, props}).catch();
	}
}

export const UploaderModule = new UploaderModule_Class();




