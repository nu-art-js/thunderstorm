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
import {ThunderDispatcher, XhrHttpModule, XhrHttpModule_Class} from '@nu-art/thunderstorm/frontend';
import {BaseUploaderFile, FileStatus, FileUploadResult, OnFileStatusChanged, PushKey_FileUploaded, TempSecureUrl} from '../../shared';
import {PushPubSubModule} from '@nu-art/push-pub-sub/frontend';
import {ModuleBase_AssetUploader} from '../../shared/modules/ModuleBase_AssetUploader';
import {DB_Notifications} from '@nu-art/push-pub-sub';


export class ModuleFE_AssetUploader_Class
	extends ModuleBase_AssetUploader<XhrHttpModule_Class> {

	protected readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged');

	constructor() {
		super(XhrHttpModule);
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

	protected dispatchFileStatusChange(id: string) {
		this.dispatch_fileStatusChange.dispatchUI(id);
	}

	protected async subscribeToPush(toSubscribe: TempSecureUrl[]): Promise<void> {
		return PushPubSubModule.subscribeMulti(toSubscribe.map(r => ({pushKey: PushKey_FileUploaded, props: {feId: r.asset.feId}})));
	}

	__onMessageReceived(notification: DB_Notifications<FileUploadResult>): void {
		super.__onMessageReceived(notification);
		if (notification.data?.status === FileStatus.Completed || notification.data?.status?.startsWith('Error'))
			PushPubSubModule.unsubscribe({pushKey: PushKey_FileUploaded, props: notification.props});
	}
}

export const ModuleFE_AssetUploader = new ModuleFE_AssetUploader_Class();
