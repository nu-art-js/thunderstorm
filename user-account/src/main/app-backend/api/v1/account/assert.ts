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
	ServerApi,
	ExpressRequest
} from "@nu-art/thunderstorm/backend";

import {__stringify} from "@nu-art/ts-common";
import {
	AccountModule,
	AccountApi_AssertLoginSAML,
	PostAssertBody,
	QueryParam_Email,
	QueryParam_RedirectUrl,
	QueryParam_SessionId,
	RequestBody_SamlAssertOptions,
	SamlModule
} from "./_imports";
import {HttpMethod} from "@nu-art/thunderstorm";


class AssertSamlToken
	extends ServerApi<AccountApi_AssertLoginSAML> {

	constructor() {
		super(HttpMethod.POST, "assert");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: PostAssertBody) {
		const options: RequestBody_SamlAssertOptions = {
			request_body: body
		};

		try {
			const data = await SamlModule.assert(options);
			this.logDebug(`Got data from assertion ${__stringify(data)}`);

			const userEmail = data.userId;
			const {sessionId: userToken} = await AccountModule.loginSAML(userEmail);

			let redirectUrl = data.loginContext[QueryParam_RedirectUrl];

			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_SessionId.toUpperCase(), "g"), userToken);
			redirectUrl = redirectUrl.replace(new RegExp(QueryParam_Email.toUpperCase(), "g"), userEmail);

			return await response.redirect(302, redirectUrl);
		} catch (error) {
			throw new ApiException(401, 'Error authenticating user', error);
		}
	}
}

module.exports = new AssertSamlToken();
