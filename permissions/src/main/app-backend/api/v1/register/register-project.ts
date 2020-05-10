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

// noinspection TypeScriptPreferShortImport
import {
	Permissions_ApiRegisterProject,
	Request_RegisterProject,
	PermissionsRegisterProject,
	Permissions_ApiRegisterExternalProject
} from "../permissions/_imports";
import {HttpMethod} from "@nu-art/thunderstorm";
import {ExpressRequest} from "@nu-art/thunderstorm/backend";



class ServerApi_RegisterExternalProject
	extends ServerApi<Permissions_ApiRegisterExternalProject> {

	constructor() {
		super(HttpMethod.POST, "register-external-project");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Request_RegisterProject): Promise<void> {
		await PermissionsRegisterProject._registerProject(body);
	}
}

class ServerApi_RegisterProject
	extends ServerApi<Permissions_ApiRegisterProject> {

	constructor() {
		super(HttpMethod.GET, "register-project");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: void): Promise<void> {
		await PermissionsRegisterProject.registerProject();
	}
}

module.exports = [new ServerApi_RegisterProject(), new ServerApi_RegisterExternalProject()];
