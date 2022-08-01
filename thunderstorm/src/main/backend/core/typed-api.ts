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

import {filterInstances, NarrowArray} from '@nu-art/ts-common';
import {AxiosHttpModule} from '../modules/http/AxiosHttpModule';
import {_ServerBodyApi, _ServerQueryApi} from '../modules/server/server-api';
import {ApiDef, BaseHttpRequest, BodyApi, HttpMethod_Body, QueryApi} from '../shared';
import {ExpressRequest, ServerApi_Middleware} from '../utils/types';


export function createQueryServerApi<API extends QueryApi<any, any, any>, T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown, T5 = unknown, T6 = unknown>(apiDef: ApiDef<API>, action: (params: API['P'], middlewares: NarrowArray<ExpressRequest, T1, T2, T3, T4, T5, T6>, request?: ExpressRequest) => Promise<API['R']>, middleware1?: ServerApi_Middleware<T1>, middleware2?: ServerApi_Middleware<T2>, middleware3?: ServerApi_Middleware<T3>, middleware4?: ServerApi_Middleware<T4>, middleware5?: ServerApi_Middleware<T5>, middleware6?: ServerApi_Middleware<T6>) {
	return new _ServerQueryApi<API>(apiDef, action).setMiddlewares(...filterInstances([middleware1, middleware2, middleware3, middleware4, middleware5, middleware6]));
}

export function createBodyServerApi<API extends BodyApi<any, any, any>, T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown, T5 = unknown, T6 = unknown>(apiDef: ApiDef<API>, action: (body: API['B'], middlewares: NarrowArray<ExpressRequest, T1, T2, T3, T4, T5, T6>, request?: ExpressRequest) => Promise<API['R']>, middleware1?: ServerApi_Middleware<T1>, middleware2?: ServerApi_Middleware<T2>, middleware3?: ServerApi_Middleware<T3>, middleware4?: ServerApi_Middleware<T4>, middleware5?: ServerApi_Middleware<T5>, middleware6?: ServerApi_Middleware<T6>) {
	return new _ServerBodyApi<API>(apiDef, action).setMiddlewares(...filterInstances([middleware1, middleware2, middleware3, middleware4, middleware5, middleware6]));
}

export function apiWithQueryAxios<API extends QueryApi<any, any>>(apiDef: ApiDef<API>,
																																	onCompleted?: (response: API['R'], params: API['P'], request: BaseHttpRequest<API>) => Promise<any>,
																																	onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>) {
	return (params: API['P']): BaseHttpRequest<API> => {
		return AxiosHttpModule
			.createRequest<API>(apiDef)
			.setUrlParams(params)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	};
}

export function apiWithBodyAxios<API extends BodyApi<any, any, any, HttpMethod_Body>>(apiDef: ApiDef<API>,
																																											onCompleted?: (response: API['R'], body: API['B'], request: BaseHttpRequest<API>) => Promise<any>,
																																											onError?: (errorResponse: any, input: API['P'] | API['B'], request: BaseHttpRequest<API>) => Promise<any>) {
	return (body: API['B']): BaseHttpRequest<API> => {
		return AxiosHttpModule
			.createRequest<API>(apiDef)
			.setBodyAsJson(body)
			.setOnError(onError)
			.setOnCompleted(onCompleted);
	};
}


