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
import {PermissionsApi_UserUrlsPermissions, ModuleBE_Permissions, Request_UserUrlsPermissions} from './_imports';
import {HttpMethod} from '@nu-art/thunderstorm';
import {AccountModuleBE} from '@nu-art/user-account/backend';

class ServerApi_UserUrlsPermissions
	extends ServerApi<PermissionsApi_UserUrlsPermissions> {

	constructor() {
		super(HttpMethod.POST, 'user-urls-permissions');
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UserUrlsPermissions) {
		const account = await AccountModuleBE.validateSession(request);
		return ModuleBE_Permissions.getUserUrlsPermissions(body.projectId, body.urls, account._id, body.requestCustomField);
	}
}

module.exports = new ServerApi_UserUrlsPermissions();
