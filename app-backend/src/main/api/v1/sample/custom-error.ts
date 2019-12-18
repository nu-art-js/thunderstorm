/*
 * A backend boilerplate with example apis
 *
 * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
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
	ServerApi_Post,
} from "@nu-art/storm/server";

import * as express from "express";
import {
	CustomError1,
	CustomError2,
	ExampleApiCustomError
} from "@shared/shared";
import {randomObject} from "@nu-art/ts-common";

class ServerApi_CustomError
	extends ServerApi_Post<ExampleApiCustomError> {

	constructor() {
		super("custom-error");
	}

	protected async process(request: express.Request, response: ApiResponse, queryParams: void, body: void) {

		const debugMessage = "The debug message, you will only see this while your backend configuration is set to debug true";
		const error1: CustomError1 = {prop1: "value for prop1", prop2: "value for prop2"};
		const error2: CustomError2 = {prop3: "value for prop3", prop4: "value for prop4"};
		const exception1 = new ApiException<CustomError1>(422, debugMessage).setErrorBody({type: "CustomError1", body: error1});
		const exception2 = new ApiException<CustomError2>(402, debugMessage).setErrorBody({type: "CustomError2", body: error2});

		throw randomObject([exception1, exception2]);
	}
}

module.exports = new ServerApi_CustomError();
