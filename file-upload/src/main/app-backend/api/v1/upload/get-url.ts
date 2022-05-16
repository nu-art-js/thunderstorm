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
	ApiResponse,
	ExpressRequest,
	ServerApi_Post
} from "@nu-art/thunderstorm/backend";
import {
	Api_GetUploadUrl,
	BaseUploaderFile
} from "../../../../shared/types";
import {QueryParams} from "@nu-art/thunderstorm";
import {AssetsModuleBE} from "../../../modules/AssetsModuleBE";


class ServerApi_GetUploadUrl
	extends ServerApi_Post<Api_GetUploadUrl> {
	constructor() {
		super('get-url');
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: QueryParams, body: BaseUploaderFile[]) {
		return AssetsModuleBE.getUrl(body);
	}
}

module.exports = new ServerApi_GetUploadUrl();