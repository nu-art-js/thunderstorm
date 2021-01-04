/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2020 Intuition Robotics
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
} from "@ir/thunderstorm/backend";

import {
	HttpMethod,
	ApiWithQuery
} from "@ir/thunderstorm";

import {FirebaseProjectCollections} from "@ir/firebase";
import {FirebaseModule} from "@ir/firebase/backend";
import {ExpressRequest} from "@ir/thunderstorm/backend";


class ServerApi_RegisterExternalProject
	extends ServerApi<ApiWithQuery<string, { list: FirebaseProjectCollections[] }>> {

	constructor() {
		super(HttpMethod.GET, "list-firebase-collections");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: void) {
		return {list: FirebaseModule.listCollectionsInModules()};
	}
}

module.exports = new ServerApi_RegisterExternalProject();
