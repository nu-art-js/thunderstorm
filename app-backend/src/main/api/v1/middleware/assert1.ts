// /*
//  * A backend boilerplate with example apis
//  *
//  * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
//
// import {BodyApi, QueryApi} from '@nu-art/thunderstorm';
// import {ApiResponse, ExpressRequest, RemoteProxy, ServerApi_Get, ServerApi_Post} from '@nu-art/thunderstorm/backend';
// import {ModuleBE_PermissionsAssert} from '@nu-art/permissions/backend/modules/ModuleBE_PermissionsAssert';
//
// const PROP_A = 'a';
// const PROP_E = 'e';
//
// type Assert1_Params = { a: string, c: string, e: string };
// type AssertTest1 = QueryApi<Assert1_Params>
//
//
// export const Middleware__Assert_AE = ModuleBE_PermissionsAssert.Middleware([PROP_A, PROP_E]);
// export const Middleware__Assert_A = ModuleBE_PermissionsAssert.Middleware([PROP_A, PROP_E]);
//
// class ServerApi_TestMiddleware1
// 	extends ServerApi_Get<AssertTest1> {
//
// 	constructor() {
// 		super('test1');
// 		this.setMiddlewares(RemoteProxy.Middleware, Middleware__Assert_AE);
// 	}
//
// 	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: Assert1_Params, body: never) {
// 		// PermissionsAssert.processApi(k(queryParams))
// 		console.log('queryParams:', queryParams);
// 		return '';
// 	}
// }
//
// type Assert2_Body = { a: string, b: number, c: string };
// type AssertTest2 = BodyApi<'/v1/test/permission', Assert2_Body, string>
//
// class ServerApi_TestMiddleware2
// 	extends ServerApi_Post<AssertTest2> {
//
// 	constructor() {
// 		super('test2');
// 		this.setMiddlewares(Middleware__Assert_A);
// 	}
//
// 	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: {}, body: Assert2_Body) {
// 		return '';
// 	}
// }
//
// module.exports = [new ServerApi_TestMiddleware1(), new ServerApi_TestMiddleware2()];
