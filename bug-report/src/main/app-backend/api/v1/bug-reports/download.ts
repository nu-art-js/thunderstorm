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

import {ApiResponse, ExpressRequest, ServerApi_Post} from '@nu-art/thunderstorm/backend';
import {AdminBRModule, ApiDef_AdminBugReport, ApiStruct_AdminBugReport, Paths} from './_imports';

// import {AccountModuleBE} from "@nu-art/user-account/backend";

class ServerApi_DownloadLogs
	extends ServerApi_Post<ApiStruct_AdminBugReport['v1']['downloadLogs']> {

	constructor() {
		super(ApiDef_AdminBugReport.v1.downloadLogs);
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Paths) {
		// const email = await ModuleBE_Account.validateSession({},request);
		return AdminBRModule.downloadFiles(body);
	}
}

module.exports = new ServerApi_DownloadLogs();