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

import {ApiResponse, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';


import {AccountModuleBE} from '@nu-art/user-account/backend';
import {PermissionsApi_AssertUserAccess, PermissionsAssert, Request_AssertApiForUser} from './_imports';
import {HttpMethod} from '@nu-art/thunderstorm';

class ServerApi_AssertPermissions
	extends ServerApi<PermissionsApi_AssertUserAccess> {

	constructor() {
		super(HttpMethod.POST, 'assert-user-access');
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_AssertApiForUser) {
		const account = await AccountModuleBE.validateSession(request);
		await PermissionsAssert.assertUserPermissions(body.projectId, body.path, account._id, body.requestCustomField);
		return {userId: account.email};
	}
}

module.exports = new ServerApi_AssertPermissions();
