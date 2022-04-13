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
	ApiException,
	ApiResponse,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	AccountModule,
	AccountApi_Logout,
	Header_SessionId
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";

class ServerApi_Account_Logout
	extends ServerApi<AccountApi_Logout> {

	constructor() {
		super(HttpMethod.POST, "logout");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: {}) {
		const sessionId = Header_SessionId.get(request);
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		return AccountModule.logout(sessionId);
	}
}

module.exports = new ServerApi_Account_Logout();
