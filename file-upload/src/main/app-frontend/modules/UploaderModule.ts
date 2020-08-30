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
	Minute,
	Module
} from "@nu-art/ts-common";
import {HttpMethod} from "@nu-art/thunderstorm";
import {
	HttpModule,
	ToastModule
} from "@nu-art/thunderstorm/frontend";

import {
	Api_GetUploadUrl,
	fileUploadedKey,
	Request_GetUploadUrl,
	UploadResult
} from "../../shared/types";
import {
	OnPushMessageReceived,
	PushPubSubModule
} from "@nu-art/push-pub-sub/frontend";
import {SubscribeProps} from "@nu-art/push-pub-sub";

const RequestKey_UploadUrl = 'get-upload-url';
const RequestKey_UploadFile = 'upload-file';

type Config = {}

export class UploaderModule_Class
	extends Module<Config>
	implements OnPushMessageReceived {

	upload(file: File, key?: string) {
		const requestBody: Request_GetUploadUrl = {
			name: file.name,
			type: file.type,
			key
		};
		HttpModule
			.createRequest<Api_GetUploadUrl>(HttpMethod.POST, RequestKey_UploadUrl)
			.setRelativeUrl("/v1/upload/get-url")
			.setJsonBody(requestBody)
			.execute(response => {
				this.uploadFile(file, response.secureUrl)
				PushPubSubModule.subscribe({pushKey: fileUploadedKey, props: {_id: response.tempId}});
			});

	}

	__onMessageReceived(pushKey: string, props?: SubscribeProps, data?: any): void {
		this.logInfo('message received', pushKey, props, data);
		if (pushKey !== fileUploadedKey)
			return;

		switch (data.result) {
			case UploadResult.Success:
				return ToastModule.toastSuccess(data.message);
			case UploadResult.Failure:
				ToastModule.toastError(data.message)
		}
	}

	private uploadFile(file: File, secureUrl: string) {
		HttpModule
			.createRequest(HttpMethod.PUT, RequestKey_UploadFile)
			.setUrl(secureUrl)
			.setTimeout(10 * Minute)
			.setBody(file)
			.execute(response => {
				ToastModule.toastSuccess(`File ${file.name} uploaded!`)
			});
	}
}

export const UploaderModule = new UploaderModule_Class();




