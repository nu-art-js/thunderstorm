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
	dispatch_queryRequestInfo,
	ExpressRequest,
	ServerApi_Post,
} from "@nu-art/thunderstorm/backend";
import {
	ApiBugReport,
	BugReportModule,
	Request_BugReport
} from "./_imports";

// import {AccountModule} from "@nu-art/user-account/backend";

class ServerApi_SendReport
	extends ServerApi_Post<ApiBugReport> {

	constructor() {
		super("report");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_BugReport) {
		const resp = await dispatch_queryRequestInfo.dispatchModuleAsync([request]);
		const userId: string | undefined = resp.find(e => e.key === 'AccountsModule')?.data?.email || resp.find(e => e.key === 'RemoteProxy')?.data.email;
		console.log('this is the email: ', userId)
		await BugReportModule.saveFile(body, userId);
	}
}

module.exports = new ServerApi_SendReport();
