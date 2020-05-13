/*
 * ts-common is the basic building blocks of our typescript projects
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
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	Permissions_ApiUserUrlsPermissions,
	Request_UserUrlsPermissions
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";
import { AccountModule } from "@nu-art/user-account/backend";
import {UserUrlsPermissionsModule} from "../../../modules/UserUrlsPermissionsModule";

class ServerApi_UserUrlsPermissions
	extends ServerApi<Permissions_ApiUserUrlsPermissions> {

	constructor() {
		super(HttpMethod.POST, "user-urls-permissions");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UserUrlsPermissions) {
		const userId = await AccountModule.validateSession(request);
		return UserUrlsPermissionsModule.getUserUrlsPermissions(body.projectId, body.urls, userId, body.requestCustomField);
	}

}

module.exports = new ServerApi_UserUrlsPermissions();
