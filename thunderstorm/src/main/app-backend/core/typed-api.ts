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

import {filterInstances} from '@nu-art/ts-common';
import {ApiResponse, ServerApi_Get, ServerApi_Middleware, ServerApi_Post} from '../../backend';
import {ApiDef, BodyApi, QueryApi} from '../shared';
import {ExpressRequest} from '../utils/types';


export class _ServerQueryApi<API extends QueryApi<any, any, any>>
	extends ServerApi_Get<API> {
	private readonly action: (params: API['P'], middleware: any, request?: ExpressRequest) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['P'], middleware: any, request?: ExpressRequest) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: API['P']): Promise<API['R']> {
		return this.action(queryParams, this.middlewareResults || request, request);
	}
}

export class _ServerBodyApi<API extends BodyApi<any, any, any>>
	extends ServerApi_Post<API> {
	private readonly action: (body: API['B'], middleware: any, request?: ExpressRequest) => Promise<API['R']>;

	constructor(apiDef: ApiDef<API>, action: (params: API['B'], middleware: any, request?: ExpressRequest) => Promise<API['R']>) {
		super(apiDef);
		this.action = action;
	}

	protected async process(request: ExpressRequest, response: ApiResponse, queryParams: never, body: API['B']): Promise<API['R']> {
		return this.action(body, this.middlewareResults || request, request);
	}
}

export function createQueryServerApi<API extends QueryApi<any, any, any>, T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown, T5 = unknown, T6 = unknown>(apiDef: ApiDef<API>, action: (params: API['P'], middlewares: NarrowArray<T1, T2, T3, T4, T5, T6>, request?: ExpressRequest) => Promise<API['R']>, middleware1?: ServerApi_Middleware<T1>, middleware2?: ServerApi_Middleware<T2>, middleware3?: ServerApi_Middleware<T3>, middleware4?: ServerApi_Middleware<T4>, middleware5?: ServerApi_Middleware<T5>, middleware6?: ServerApi_Middleware<T6>) {
	return new _ServerQueryApi<API>(apiDef, action).setMiddlewares(...filterInstances([middleware1, middleware2, middleware3, middleware4, middleware5, middleware6]));
}

export function createBodyServerApi<API extends BodyApi<any, any, any>, T1 = unknown, T2 = unknown, T3 = unknown, T4 = unknown, T5 = unknown, T6 = unknown>(apiDef: ApiDef<API>, action: (body: API['B'], middlewares: NarrowArray<T1, T2, T3, T4, T5, T6>, request?: ExpressRequest) => Promise<API['R']>, middleware1?: ServerApi_Middleware<T1>, middleware2?: ServerApi_Middleware<T2>, middleware3?: ServerApi_Middleware<T3>, middleware4?: ServerApi_Middleware<T4>, middleware5?: ServerApi_Middleware<T5>, middleware6?: ServerApi_Middleware<T6>) {
	return new _ServerBodyApi<API>(apiDef, action).setMiddlewares(...filterInstances([middleware1, middleware2, middleware3, middleware4, middleware5, middleware6]));
}

type ValidReturnValue = string | number | object;

type NarrowArray<T1, T2, T3, T4, T5, T6> =
	T6 extends ValidReturnValue ? [T1, T2, T3, T4, T5, T6] :
		T5 extends ValidReturnValue ? [T1, T2, T3, T4, T5] :
			T4 extends ValidReturnValue ? [T1, T2, T3, T4] :
				T3 extends ValidReturnValue ? [T1, T2, T3] :
					T2 extends ValidReturnValue ? [T1, T2] :
						T1 extends ValidReturnValue ? [T1] : ExpressRequest

