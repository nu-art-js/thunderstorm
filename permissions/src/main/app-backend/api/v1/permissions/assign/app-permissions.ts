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
	ExpressRequest,
	ServerApi,
	ApiException
} from "@nu-art/thunderstorm/backend";
import {
	GroupPermissionsDB,
	Permissions_AssignAppPermissions,
	Request_AssignAppPermissions,
	UserPermissionsDB,
} from "../_imports";
import {
	HttpMethod,
	QueryParams
} from "@nu-art/thunderstorm";

import {_keys} from "@nu-art/ts-common";

class ServerApi_UserUrlsPermissions
	extends ServerApi<Permissions_AssignAppPermissions> {

	constructor() {
		super(HttpMethod.GET, "app-permissions");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: QueryParams, body: Request_AssignAppPermissions) {
		await UserPermissionsDB.assignAppPermissions(body);
	}
}

module.exports = new ServerApi_UserUrlsPermissions();
