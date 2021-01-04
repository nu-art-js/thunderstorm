/*
 * A backend boilerplate with example apis
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
	ApiResponse,
	ExpressRequest,
	ServerApi
} from "@ir/thunderstorm/backend";
import {HttpMethod} from "@ir/thunderstorm";
import {
	PermissionsApi_UserUrlsPermissions,
	Request_UserUrlsPermissions
} from "@ir/permissions";

class ServerApi_UserUrlsPermissions
	extends ServerApi<PermissionsApi_UserUrlsPermissions> {

	constructor() {
		super(HttpMethod.POST, "user-urls-permissions");
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UserUrlsPermissions) {
		return {'/v1/test/api': true};
	}
}

module.exports = new ServerApi_UserUrlsPermissions();

