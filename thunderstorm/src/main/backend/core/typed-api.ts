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

import {AxiosHttpModule} from '../modules/http/AxiosHttpModule';
import {_ServerBodyApi, _ServerQueryApi} from '../modules/server/server-api';
import {ApiDef, BaseHttpRequest, BodyApi, HttpMethod_Body, QueryApi} from '../shared';
import {ServerApi_Middleware} from '../utils/types';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';


export function createQueryServerApi<API extends QueryApi<any, any, any>>(apiDef: ApiDef<API>, action: (params: API['P'], mem: MemStorage) => Promise<API['R']>, ...middleware: ServerApi_Middleware[]) {
	return new _ServerQueryApi<API>(apiDef, action).setMiddlewares(...middleware);
}

export function createBodyServerApi<API extends BodyApi<any, any, any>>(apiDef: ApiDef<API>, action: (body: API['B'], mem: MemStorage) => Promise<API['R']>, ...middleware: ServerApi_Middleware[]) {
	return new _ServerBodyApi<API>(apiDef, action).setMiddlewares(...middleware);
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


