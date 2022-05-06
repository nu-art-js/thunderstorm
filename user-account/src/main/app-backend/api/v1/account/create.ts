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

import {ApiResolver} from '@nu-art/thunderstorm';
import {ApiResponse, ExpressRequest, ServerApi} from '@nu-art/thunderstorm/backend';

import {AccountModuleBE, ApiDef_UserAccount_Create, Request_CreateAccount} from './_imports';


class ServerApi_Account_Create
	extends ServerApi<ApiResolver<typeof ApiDef_UserAccount_Create>> {

	constructor() {
		super(ApiDef_UserAccount_Create);
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_CreateAccount) {
		this.assertProperty(body, ['password', 'email']);

		return AccountModuleBE.create(body);
	}
}

module.exports = new ServerApi_Account_Create();
