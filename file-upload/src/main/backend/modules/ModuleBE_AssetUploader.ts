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

import {ModuleBase_AssetUploader, UploaderConfig,} from '../../shared/modules/ModuleBase_AssetUploader';
import {apiWithBodyAxios, apiWithQueryAxios, Axios_RequestConfig, AxiosHttpModule} from '@nu-art/thunderstorm/backend';
import {ApiDef_AssetUploader, TempSignedUrl, UI_Asset} from '../shared';


export type ServerFilesToUpload = UI_Asset & {
	file: Buffer
}

type Config = UploaderConfig & { requestConfig: Axios_RequestConfig };

export class ModuleBE_AssetUploader_Class
	extends ModuleBase_AssetUploader<Config> {

	constructor() {
		super();
		this.vv1 = {
			// uploadFile: apiWithBodyAxios(ApiDef_AssetUploader.vv1.uploadFile),
			getUploadUrl: apiWithBodyAxios(ApiDef_AssetUploader.vv1.getUploadUrl),
			processAssetManually: apiWithQueryAxios(ApiDef_AssetUploader.vv1.processAssetManually),
		};
	}

	init() {
		super.init();
		AxiosHttpModule.setRequestOption(this.config.requestConfig);
	}

	upload(files: ServerFilesToUpload[]): UI_Asset[] {
		return this.uploadImpl(files);
	}

	protected async subscribeToPush(toSubscribe: TempSignedUrl[]): Promise<void> {
		// Not sure now
		// We said timeout
	}
}

export const ModuleBE_AssetUploader = new ModuleBE_AssetUploader_Class();
