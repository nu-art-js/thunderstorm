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
import {ApiResponse, ExpressRequest, ServerApi_Get} from '@nu-art/thunderstorm/backend';
import {ApiDef_LiveDoc_Get, LiveDocReqParams, LiveDocsModule} from './_imports';


class ServerApi_LiveDoc_Get
	extends ServerApi_Get<ApiResolver<typeof ApiDef_LiveDoc_Get>> {

	constructor() {
		super(ApiDef_LiveDoc_Get);
		this.dontPrintResponse();
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: LiveDocReqParams, body: void) {
		this.assertProperty(queryParams, 'key');

		return LiveDocsModule.getLiveDoc(queryParams.key);
	}
}

module.exports = new ServerApi_LiveDoc_Get();
