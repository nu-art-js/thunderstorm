/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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
	BaseUploaderFile,
	TempSecureUrl
} from "../../shared/types";
import {
	BaseUploaderModule_Class,
	Request_Uploader
} from "../../shared/modules/BaseUploaderModule";
import {
	Axios_RequestConfig,
	AxiosHttpModule,
	AxiosHttpModule_Class
} from "@ir/thunderstorm/backend";

export type ServerFilesToUpload = Request_Uploader & {
	file: Buffer
}

export class ServerUploaderModule_Class
	extends BaseUploaderModule_Class<AxiosHttpModule_Class, { requestConfig: Axios_RequestConfig }> {

	constructor() {
		super(AxiosHttpModule);
	}

	init() {
		super.init();
		AxiosHttpModule.setRequestOption(this.config.requestConfig);
	}

	upload(files: ServerFilesToUpload[]): BaseUploaderFile[] {
		return this.uploadImpl(files);
	}

	protected async subscribeToPush(toSubscribe: TempSecureUrl[]): Promise<void> {
		// Not sure now
		// We said timeout
	}
}

export const ServerUploaderModule = new ServerUploaderModule_Class();




