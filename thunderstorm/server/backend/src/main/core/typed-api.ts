/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {_ServerBodyApi, _ServerQueryApi} from './server-api.js';
import {ApiDef, BodyApi, HttpMethod_Body, HttpMethod_Query, QueryApi} from '@nu-art/thunder-db-api-shared';
import {ServerApi_Middleware} from './types.js';

export function createQueryServerApi<API extends QueryApi<any, any, any, any, HttpMethod_Query>>(apiDef: ApiDef<API>, action: (params: API['Params']) => Promise<API['Response']>, ...middleware: ServerApi_Middleware[]) {
	return new _ServerQueryApi<API>(apiDef, action).setMiddlewares(...middleware);
}

export function createBodyServerApi<API extends BodyApi<any, any, any, any, HttpMethod_Body>>(apiDef: ApiDef<API>, action: (body: API['Body']) => Promise<API['Response']>, ...middleware: ServerApi_Middleware[]) {
	return new _ServerBodyApi<API>(apiDef, action).setMiddlewares(...middleware);
}

// export function apiWithQueryAxios<API extends QueryApi<any, any>>(apiDef: ApiDef<API>, onCompleted?: (response: API['R'], params: API['P'], request: BaseHttpRequest<API>) => Promise<any>, onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>) {
// 	return (params: API['Params']): API['Response'] => {
// 		return AxiosHttpModule
// 			.createRequest<API>(apiDef)
// 			.setUrlParams(params)
// 			.setOnError(onError)
// 			.setOnCompleted(onCompleted).execute();
// 	};
// }
//
// export function apiWithBodyAxios<API extends BodyApi<any, any, any, any, HttpMethod_Body>>(apiDef: ApiDef<API>, onCompleted?: (response: API['R'], body: API['B'], request: BaseHttpRequest<API>) => Promise<any>, onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>) {
// 	return (body: API['Body']): API['Response'] => {
// 		return AxiosHttpModule
// 			.createRequest<API>(apiDef)
// 			.setBodyAsJson(body)
// 			.setOnError(onError)
// 			.setOnCompleted(onCompleted).execute();
// 	};
// }
