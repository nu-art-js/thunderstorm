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
	BodyApi,
	QueryApi
} from "@nu-art/thunderstorm";

export type CommonBodyReq = {
	message: string
}

export type ParamsToGet = {
	param1: string
}

export type CustomError1 = {
	prop1: string
	prop2: string
}

export type CustomError2 = {
	prop3: string
	prop4: string
}

export interface TestDispatch {
	testDispatch: () => void;
}

export type ExampleApiCustomError = BodyApi<"/v1/sample/custom-error", void, void, CustomError1 | CustomError2>
export type ExampleApiPostType = BodyApi<"/v1/sample/another-endpoint", CommonBodyReq, string>
export type ExampleApiGetType = QueryApi< string>
export type ExampleApiTest = QueryApi< string>
export type ExampleTestPush = QueryApi<"/v1/sample/push-test", string>

export type ExampleGetMax = QueryApi<"/v1/sample/get-max", { n: number }>
export type ExampleSetMax = BodyApi<"/v1/sample/set-max", { n: number }, void>
export type ApiType_GetWithoutParams = QueryApi<"/v1/sample/get-without-params-endpoint", string>
export type ApiType_ApiGetWithParams = QueryApi<"/v1/sample/get-with-params-endpoint", string, ParamsToGet>
export type ApiType_ApiPostWithoutResponse = BodyApi<"/v1/sample/post-without-body-endpoint", CommonBodyReq, void>
export type ApiType_ApiPostWithResponse = BodyApi<"/v1/sample/post-with-body-endpoint", CommonBodyReq, string>
