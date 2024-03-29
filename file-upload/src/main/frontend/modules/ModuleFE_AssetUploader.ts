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
import {apiWithBody, apiWithQuery, ModuleFE_XHR, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {ApiDef_AssetUploader, ApiStruct_AssetUploader, FileStatus, OnFileStatusChanged, PushKey_FileUploaded, TempSignedUrl, UI_Asset} from '../../shared';
import {ModuleBase_AssetUploader} from '../../shared/modules/ModuleBase_AssetUploader';
import {BaseSubscriptionData, PushMessage_Payload} from '@nu-art/push-pub-sub';
import {ModuleFE_PushPubSub} from '@nu-art/push-pub-sub/frontend/modules/ModuleFE_PushPubSub';
import {ApiDef, ApiDefCaller, BaseHttpRequest, TypedApi} from '@nu-art/thunderstorm';
import {generateHex} from '@nu-art/ts-common';
import {PushMessage_FileUploaded} from '../../shared/assets/messages';


export class ModuleFE_AssetUploader_Class
	extends ModuleBase_AssetUploader {

	protected readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged');
	readonly vv1: ApiDefCaller<ApiStruct_AssetUploader>['vv1'];

	constructor() {
		super();
		this.vv1 = {
			getUploadUrl: apiWithBody(ApiDef_AssetUploader.vv1.getUploadUrl),
			processAssetManually: apiWithQuery(ApiDef_AssetUploader.vv1.processAssetManually),
		};
	}

	upload(files: File[], key: string, _public: boolean = false): UI_Asset[] {
		return this.uploadImpl(files.map((file => {
			return {
				feId: generateHex(32),
				name: file.name,
				mimeType: file.type,
				key,
				file,
				ext: ''
			};
		})));
	}

	createRequest<API extends TypedApi<any, any, any, any>>(uploadFile: ApiDef<API>): BaseHttpRequest<API> {
		return ModuleFE_XHR.createRequest(uploadFile);
	}

	protected dispatchFileStatusChange(id: string) {
		this.dispatch_fileStatusChange.dispatchUI(id);
	}

	protected async subscribeToPush(toSubscribe: TempSignedUrl[]): Promise<void> {
		const subscriptions: BaseSubscriptionData[] = toSubscribe.map<BaseSubscriptionData>(r => ({topic: PushKey_FileUploaded, props: {feId: r.asset.feId}}));
		await ModuleFE_PushPubSub.v1.registerAll(subscriptions).executeSync();
	}

	__onMessageReceived(notification: PushMessage_Payload<PushMessage_FileUploaded>): void {
		super.__onMessageReceived(notification);
		if (notification.message?.status === FileStatus.Completed || notification.message?.status?.startsWith('Error'))
			ModuleFE_PushPubSub.v1.unregister({topic: PushKey_FileUploaded, filter: notification.filter});
	}
}

export const ModuleFE_AssetUploader = new ModuleFE_AssetUploader_Class();
