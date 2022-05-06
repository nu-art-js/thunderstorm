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

import {ApiResponse, ExpressRequest, ServerApi_Get} from '@nu-art/thunderstorm/backend';

import {ApiDef_UserAccount_LoginSAML, RequestParams_LoginSAML, SamlModule} from './_imports';
import {ApiResolver} from '@nu-art/thunderstorm';


class ServerApi_Account_LoginSAML
	extends ServerApi_Get<ApiResolver<typeof ApiDef_UserAccount_LoginSAML>> {

	constructor() {
		super(ApiDef_UserAccount_LoginSAML);
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: RequestParams_LoginSAML, body: void) {
		const loginUrl = await SamlModule.loginRequest(queryParams);
		return {loginUrl};
	}
}

module.exports = new ServerApi_Account_LoginSAML();
