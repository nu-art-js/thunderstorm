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
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	PermissionsApi_UsersCFsByShareGroups,
	Request_UsersCFsByShareGroups,
	PermissionsModule
} from "../permissions/_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {AccountModule} from "@nu-art/user-account/backend";

class ServerApi_UsersCFsByShareGroups
	extends ServerApi<PermissionsApi_UsersCFsByShareGroups> {

	constructor() {
		super(HttpMethod.POST, "users-cf-by-share-groups");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UsersCFsByShareGroups) {
		await AccountModule.validateSession(request);
		return PermissionsModule.getUsersCFsByShareGroups(body.usersEmails, body.groupsIds);
	}
}

module.exports = new ServerApi_UsersCFsByShareGroups();
