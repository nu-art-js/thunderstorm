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
import type {ApiDef, GeneralApi} from '@nu-art/api-types';
import {
	ApiDef_AssetUploader,
	FileStatus,
	type IAssetUploadRequest,
	OnFileStatusChanged,
	PushKey_FileUploaded,
	TempSignedUrl,
	UI_Asset,
} from '@nu-art/file-upload-shared';
import {ModuleBase_AssetUploader} from '@nu-art/file-upload-shared';
import {BaseSubscriptionData, PushMessage_Payload} from '@nu-art/push-pub-sub-shared';
import {ModuleFE_PushPubSub} from '@nu-art/push-pub-sub-frontend';
import {generateHex} from '@nu-art/ts-common';
import {PushMessage_FileUploaded} from '@nu-art/file-upload-shared';
import {HttpClient} from '@nu-art/http-client';
import {ThunderDispatcher} from '@nu-art/thunder-core';

function wrapHttpRequest<API extends GeneralApi>(req: ReturnType<HttpClient['createRequest']>): IAssetUploadRequest<API> {
	return {
		setUrl(url: string) {
			req.setUrl(url);
			return this;
		},
		setHeader(key: string, value: string) {
			req.setHeader(key, value);
			return this;
		},
		setTimeout(ms: number) {
			req.setTimeout(ms);
			return this;
		},
		setBody(body: unknown) {
			if (typeof body === 'string' || body === undefined || (typeof File !== 'undefined' && body instanceof File))
				req.setBody(body);
			else
				req.setBodyAsJson(body);
			return this;
		},
		setOnProgressListener(cb: (ev: { loaded: number; total?: number }) => void) {
			req.setOnProgressListener(cb);
			return this;
		},
		executeSync: () => req.execute(),
		execute(cb: (response: unknown) => void) {
			req.execute().then(cb);
		},
	};
}

export class ModuleFE_AssetUploader_Class
	extends ModuleBase_AssetUploader {

	protected readonly dispatch_fileStatusChange = new ThunderDispatcher<OnFileStatusChanged, '__onFileStatusChanged'>('__onFileStatusChanged');

	constructor() {
		super();
		(this as unknown as { vv1: unknown }).vv1 = {
			getUploadUrl: (body: UI_Asset[]) => {
				const req = HttpClient.default.createRequest(ApiDef_AssetUploader.getUploadUrl).setBodyAsJson(body);
				return {
					execute: (cb: (response: unknown) => void) => {
						req.execute().then(cb);
					},
				};
			},
			processAssetManually: (params: { feId?: string }) => {
				const query: Record<string, string> = params.feId !== undefined ? {feId: params.feId} : {};
				const req = () => HttpClient.default.createRequest(ApiDef_AssetUploader.processAssetManually).setUrlParams(query);
				const out = {
					setUrlParam(key: string, value: string) {
						query[key] = value;
						return out;
					},
					execute: () => req().execute(),
				};
				return out;
			},
		};
	}

	upload(files: File[], key: string, _public: boolean = false): UI_Asset[] {
		return this.uploadImpl(files.map((file) => ({
			feId: generateHex(32),
			name: file.name,
			mimeType: file.type,
			key,
			file,
			ext: '',
		})));
	}

	createRequest<API extends GeneralApi>(uploadFile: ApiDef<API>): IAssetUploadRequest<API> {
		return wrapHttpRequest<API>(HttpClient.default.createRequest(uploadFile));
	}

	protected dispatchFileStatusChange(id: string) {
		this.dispatch_fileStatusChange.dispatchUI(id);
	}

	protected async subscribeToPush(toSubscribe: TempSignedUrl[]): Promise<void> {
		const subscriptions: BaseSubscriptionData[] = toSubscribe.map<BaseSubscriptionData>((r) => ({
			topic: PushKey_FileUploaded,
			props: {feId: r.asset.feId},
		}));
		await ModuleFE_PushPubSub.registerAll(subscriptions).executeSync();
	}

	__onMessageReceived(notification: PushMessage_Payload<PushMessage_FileUploaded>): void {
		super.__onMessageReceived(notification);
		if (notification.message?.status === FileStatus.Completed || notification.message?.status?.startsWith('Error'))
			ModuleFE_PushPubSub.unregister({topic: PushKey_FileUploaded, filter: notification.filter});
	}
}

export const ModuleFE_AssetUploader = new ModuleFE_AssetUploader_Class();
