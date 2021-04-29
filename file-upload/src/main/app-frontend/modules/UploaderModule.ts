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
	ThunderDispatcher,
	XhrHttpModule,
	XhrHttpModule_Class
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
import {DB_Notifications} from "@nu-art/push-pub-sub";
import {
	Second,
	timeout
} from "@nu-art/ts-common";

export class UploaderModule_Class
	extends BaseUploaderModule_Class<XhrHttpModule_Class>
	implements OnPushMessageReceived<Push_FileUploaded> {

	protected readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, "__onFileStatusChanged">("__onFileStatusChanged");

	constructor() {
		super(XhrHttpModule);
	}

	protected dispatchFileStatusChange(id?: string) {
		this.dispatch_fileStatusChange.dispatchUI([id]);
		super.dispatchFileStatusChange(id);
	}

	upload(files: File[], key?: string, _public?: boolean): BaseUploaderFile[] {
		return this.uploadImpl(files.map((file => {
			return {
				name: file.name,
				mimeType: file.type,
				key,
				file,
				public: _public
			};
		})));
	}

	protected async subscribeToPush(toSubscribe: TempSecureUrl[]): Promise<void> {
		PushPubSubModule.subscribeMulti(toSubscribe.map(r => ({pushKey: fileUploadedKey, props: {feId: r.tempDoc.feId}})));
		await timeout(Second);
	}

	__onMessageReceived(notification: DB_Notifications): void {
		this.logInfo("Message received from service worker", notification.pushKey, notification.props, notification.data);
		if (notification.pushKey !== fileUploadedKey)
			return;

		switch (notification.data.result) {
			case UploadResult.Success:
				this.setFileInfo(notification.props?.feId as string, "status", FileStatus.Completed);
				break;
			case UploadResult.Failure:
				this.setFileInfo(notification.props?.feId as string, "status", FileStatus.Error);
				break;
		}

		PushPubSubModule.unsubscribe({pushKey: fileUploadedKey, props: notification.props});
	}
}

export const UploaderModule = new UploaderModule_Class();
