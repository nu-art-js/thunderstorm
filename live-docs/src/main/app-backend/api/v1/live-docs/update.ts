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
	ServerApi,
} from "@nu-art/thunderstorm/backend";


import {auditBy,} from "@nu-art/ts-common";
import {HttpMethod} from "@nu-art/thunderstorm";

import {
	apiPatchLiveDocs,
	LiveDocsModule,
	Request_UpdateDocument
} from "./_imports";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";

class ServerApi_LiveDoc_Update
	extends ServerApi<apiPatchLiveDocs> {

	constructor() {
		super(HttpMethod.POST, "update");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UpdateDocument) {
		// const user = await KasperoProxy.assertPermissions(request, "Update Live-Doc history", PermissionCategory_LiveDoc, PermissionAccessLevel_LiveDoc.Read);

		this.assertProperty(body, ["key", "document"]);

		await LiveDocsModule.updateLiveDoc(auditBy("user.userId"), body);
	}
}

module.exports = new ServerApi_LiveDoc_Update();
