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
	ApiResponse,
	ServerApi,
} from "@ir/thunderstorm/backend";


import {auditBy,} from "@ir/ts-common";
import {
	ApiHistoryLiveDocs,
	LiveDocHistoryReqParams,
	LiveDocsModule
} from "./_imports";
import {HttpMethod} from "@ir/thunderstorm";
import {ExpressRequest} from "@ir/thunderstorm/backend";

class ServerApi_LiveDoc_ChangeHistory
	extends ServerApi<ApiHistoryLiveDocs> {

	constructor() {
		super(HttpMethod.POST, "change-history");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: LiveDocHistoryReqParams) {
		// const user = await KasperoProxy.assertPermissions(request, "Re-Write Live-Doc history", PermissionCategory_LiveDoc,
		//                                                   PermissionAccessLevel_LiveDoc.ReWriteHistory);

		this.assertProperty(body, ["key", "change"]);

		await LiveDocsModule.changeHistory(auditBy("user.userId"), body.key, body.change);
	}
}

module.exports = new ServerApi_LiveDoc_ChangeHistory();
