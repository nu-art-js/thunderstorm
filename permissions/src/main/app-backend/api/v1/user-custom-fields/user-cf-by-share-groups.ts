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

import {ApiResponse, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';
import {PermissionsApi_UserCFsByShareGroups, Request_UserCFsByShareGroups} from '../permissions/_imports';
import {HttpMethod} from '@nu-art/thunderstorm';
import {AccountModuleBE} from '@nu-art/user-account/backend';
import {PermissionsModule} from '../../../modules/PermissionsModule';

class ServerApi_UserCFsByShareGroups
	extends ServerApi<PermissionsApi_UserCFsByShareGroups> {

	constructor() {
		super(HttpMethod.POST, 'user-cf-by-share-groups');
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_UserCFsByShareGroups) {
		const account = await AccountModuleBE.validateSession(request);
		return PermissionsModule.getUserCFsByShareGroups(account._id, body.groupsIds);
	}
}

module.exports = new ServerApi_UserCFsByShareGroups();
