/*
 * A backend boilerplate with example apis
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
import {ApiResponse, ExpressRequest, ServerApi_Post,} from "@nu-art/thunderstorm/backend";


import {DispatchModule} from "@modules/ExampleModule";
import {ExampleSetMax} from "@app/app-shared";

class ServerApi_EndpointExample
	extends ServerApi_Post<ExampleSetMax> {

	constructor() {
		super("set-max");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: { n: number }) {
		console.log('Setting max');
		return DispatchModule.setMax(body.n)
	}
}

module.exports = new ServerApi_EndpointExample();


