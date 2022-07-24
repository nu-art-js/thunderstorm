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

import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';


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

export type ExampleApiGetType = QueryApi<string>

export type ApiType_GetWithoutParams = QueryApi<'v1/sample/get-without-params-endpoint', any, string>
export type ApiType_ApiGetWithParams = QueryApi<'v1/sample/get-with-params-endpoint', any, string, 'get', ParamsToGet>
export type ApiType_ApiPostWithoutResponse = BodyApi<'v1/sample/post-without-body-endpoint', CommonBodyReq, void>
export type ApiType_ApiPostWithResponse = BodyApi<'v1/sample/post-with-body-endpoint', CommonBodyReq, string>

export type ApiStruct_Examples = {
	v1: {
		setMax: BodyApi<void, { n: number }>;
		getMax: QueryApi<{ n: number }>;
		anotherEndpoint: BodyApi<{ message: string }, CommonBodyReq>;
		customError: BodyApi<void, void>;
		dispatchEndpoint: QueryApi<string>;
		endpoint: QueryApi<string>;
		testPush: QueryApi<string, any>;
		getWithoutParam: QueryApi<string, any>;
		getWithParams: QueryApi<string, any>;
		postWithoutResponse: BodyApi<void, CommonBodyReq>;
		postWithResponse: BodyApi<string, CommonBodyReq>;
	}
}
export const ApiDef_Examples: ApiDefResolver<ApiStruct_Examples> = {
	v1: {
		getMax: {method: HttpMethod.GET, path: 'v1/sample/get-max'},
		setMax: {method: HttpMethod.POST, path: 'v1/sample/set-max'},
		anotherEndpoint: {method: HttpMethod.POST, path: 'v1/sample/another-endpoint'},
		customError: {method: HttpMethod.POST, path: 'v1/sample/custom-error'},
		dispatchEndpoint: {method: HttpMethod.GET, path: 'v1/sample/dispatch-endpoint'},
		endpoint: {method: HttpMethod.GET, path: 'v1/sample/endpoint-example'},
		testPush: {method: HttpMethod.GET, path: 'v1/sample/push-test'},
		getWithoutParam: {method: HttpMethod.GET, path: 'v1/sample/get-without-params-endpoint'},
		getWithParams: {method: HttpMethod.GET, path: 'v1/sample/get-with-params-endpoint'},
		postWithoutResponse: {method: HttpMethod.POST, path: 'v1/sample/post-without-body-endpoint'},
		postWithResponse: {method: HttpMethod.POST, path: 'v1/sample/post-with-body-endpoint'},
	}
};

export type ApiStruct_PermissionAssertTest = {
	v1: {
		test1: QueryApi<{ a: string, c: string, e: string }>
		test2: BodyApi<string, { a: string, b: number, c: string }>
	}
}
export const ApiDef_PermissionAssertTest: ApiDefResolver<ApiStruct_PermissionAssertTest> = {
	v1: {
		test1: {method: HttpMethod.GET, path: ''},
		test2: {method: HttpMethod.POST, path: 'v1/test/permission'},
	}
};