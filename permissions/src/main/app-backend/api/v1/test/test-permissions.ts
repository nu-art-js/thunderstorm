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

import {
	ServerApi,
	ApiResponse
} from "@nu-art/thunderstorm/backend";


import {HttpMethod} from "@nu-art/thunderstorm";

import { Permissions_ApiTestPermissions } from "../permissions/_imports";
import {testUserPermissionsTime} from "./_imports";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";

class ServerApi_TestPermissions
	extends ServerApi<Permissions_ApiTestPermissions> {

	constructor() {
		super(HttpMethod.GET, "test-permissions");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: void): Promise<void> {
		console.log('Starting test permissions assert');
		await testUserPermissionsTime();
		console.log('---Finish test permissions assert---');
	}
}

module.exports = new ServerApi_TestPermissions();
