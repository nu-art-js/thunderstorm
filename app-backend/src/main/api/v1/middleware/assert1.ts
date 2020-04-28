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

import {
	ApiWithBody,
	ApiWithQuery,
	HttpMethod
} from "@nu-art/thunderstorm";
import {
	ApiResponse,
	ExpressRequest,
	ServerApi_Get,
	HttpRequestData
} from "@nu-art/thunderstorm/backend";
import {
	_keys,
	StringMap
} from "@nu-art/ts-common";
import { MiddleWareAssertionMock } from "../../../api-middleware";
// import {PermissionsAssert} from "@nu-art/permissions/backend";

const PROP_A = "a";
const PROP_E = "e";

type Assert1_Params = { a: string, c: string, e: string };
type AssertTest1 = ApiWithQuery<string, string, Assert1_Params>


const subObject = <B, P>(keys: string[]) => (input: HttpRequestData<B, P>) => {
	const map: StringMap = {};
	const object = (input.method === HttpMethod.POST ? input.body : input.query) as { [k: string]: any };
	_keys(object).filter(key => keys.includes(key as string)).forEach(key => {
		const oElement = object[key];
		if (oElement === undefined || oElement === null)
			return;

		if (typeof oElement !== "string")
			return;

		map[key] = oElement;
	});
	return map;
};
// function k(input: Assert1_Params) {
// 	return {
// 		[PROP_A]: input[PROP_A],
// 		[PROP_E]: input[PROP_E]
// 	};
// }
class ServerApi_TestMiddleware1
	extends ServerApi_Get<AssertTest1> {

	constructor() {
		super("test1");
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: Assert1_Params, body: void) {
		// PermissionsAssert.processApi(k(queryParams))
		console.log("queryParams:", queryParams);
		return "";
	}
}

type Assert2_Body = { a: string, b: number, c: string };
type AssertTest2 = ApiWithBody<"/v1/test/permission", Assert2_Body, string>

class ServerApi_TestMiddleware2
	extends ServerApi_Get<AssertTest2> {

	constructor() {
		super("test2");
		this.setMDR(MiddleWareAssertionMock, subObject<Assert2_Body, {}>([PROP_A, PROP_E]));
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Assert2_Body) {
		return "";
	}
}

module.exports = [new ServerApi_TestMiddleware1(), new ServerApi_TestMiddleware2()];
